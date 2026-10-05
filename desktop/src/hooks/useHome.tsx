import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { api } from "../api/client";
import type { Automation, Device, HomeEvent, PendingAction } from "../api/types";
import { bridge } from "../lib/bridge";

export interface ActivityItem {
  id: string;
  at: string;
  kind: "state" | "notification" | "pending";
  title: string;
  detail: string;
}

export interface Toast {
  id: string;
  title: string;
  body: string;
}

interface HomeState {
  devices: Device[];
  automations: Automation[];
  pending: PendingAction[];
  activity: ActivityItem[];
  toasts: Toast[];
  online: boolean;
  refresh: () => Promise<void>;
  refreshPending: () => Promise<void>;
  setAutomations: (fn: (prev: Automation[]) => Automation[]) => void;
  addPending: (items: PendingAction[]) => void;
  dropPending: (id: string) => void;
  pushToast: (title: string, body: string) => void;
  dismissToast: (id: string) => void;
}

const HomeContext = createContext<HomeState | null>(null);
let seq = 0;
const uid = () => `${Date.now()}-${seq++}`;

export function HomeProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [pending, setPending] = useState<PendingAction[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [online, setOnline] = useState(true);

  const pushToast = useCallback((title: string, body: string) => {
    const id = uid();
    setToasts((t) => [...t, { id, title, body }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }, []);

  const refreshPending = useCallback(async () => {
    setPending(await api.pendingActions());
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [d, a, p] = await Promise.all([api.devices(), api.automations(), api.pendingActions()]);
      setDevices(d);
      setAutomations(a);
      setPending(p);
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 60_000); // filet de sécurité si le flux temps réel décroche
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(
    () =>
      bridge.onHomeEvent((raw) => {
        const event = raw as HomeEvent;
        const at = new Date().toISOString();
        if (event.type === "state_changed") {
          let name = event.data.entity_id;
          setDevices((prev) =>
            prev.map((d) => {
              if (d.entity_id !== event.data.entity_id) return d;
              name = d.name;
              return { ...d, state: event.data.state, attributes: event.data.attributes };
            }),
          );
          setActivity((prev) =>
            [{ id: uid(), at, kind: "state" as const, title: name, detail: event.data.state }, ...prev].slice(0, 40),
          );
        } else if (event.type === "notification") {
          setActivity((prev) =>
            [{ id: uid(), at, kind: "notification" as const, title: event.data.title, detail: event.data.body }, ...prev].slice(0, 40),
          );
          pushToast(event.data.title, event.data.body);
        } else if (event.type === "pending_action") {
          void refreshPending();
          setActivity((prev) =>
            [{ id: uid(), at, kind: "pending" as const, title: "Autorisation requise", detail: event.data.summary }, ...prev].slice(0, 40),
          );
        }
      }),
    [pushToast, refreshPending],
  );

  const value = useMemo<HomeState>(
    () => ({
      devices,
      automations,
      pending,
      activity,
      toasts,
      online,
      refresh,
      refreshPending,
      setAutomations,
      addPending: (items) => setPending((prev) => [...items.filter((i) => !prev.some((p) => p.id === i.id)), ...prev]),
      dropPending: (id) => setPending((prev) => prev.filter((p) => p.id !== id)),
      pushToast,
      dismissToast: (id) => setToasts((t) => t.filter((x) => x.id !== id)),
    }),
    [devices, automations, pending, activity, toasts, online, refresh, refreshPending, pushToast],
  );
  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>;
}

export function useHome(): HomeState {
  const ctx = useContext(HomeContext);
  if (!ctx) throw new Error("useHome hors de <HomeProvider>");
  return ctx;
}
