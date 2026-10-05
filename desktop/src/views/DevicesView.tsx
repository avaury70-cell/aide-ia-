import { DoorOpen, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

import { api, ApiError } from "../api/client";
import { DeviceControl } from "../components/DeviceControl";
import { Card, deviceIcon } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { useHome } from "../hooks/useHome";
import { formatState, isActive } from "../lib/format";
import { useDeviceAction } from "./useDeviceAction";

export function DevicesView() {
  const { user } = useAuth();
  const { devices, refresh, pushToast } = useHome();
  const runAction = useDeviceAction();
  const [filter, setFilter] = useState<string>("all");
  const [syncing, setSyncing] = useState(false);

  const rooms = useMemo(() => {
    const groups = new Map<string, typeof devices>();
    for (const d of devices) {
      if (filter !== "all" && d.domain !== filter) continue;
      const key = d.room?.name ?? "Autres";
      groups.set(key, [...(groups.get(key) ?? []), d]);
    }
    return [...groups.entries()].sort(([a], [b]) => (a === "Autres" ? 1 : b === "Autres" ? -1 : a.localeCompare(b)));
  }, [devices, filter]);

  const domains = useMemo(() => [...new Set(devices.map((d) => d.domain))].sort(), [devices]);

  const sync = async () => {
    setSyncing(true);
    try {
      const { created } = await api.syncDevices();
      await refresh();
      pushToast("Synchronisation terminée", `${created} nouvel(s) appareil(s) importé(s).`);
    } catch (e) {
      pushToast("Synchronisation impossible", e instanceof ApiError ? e.message : "Erreur");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Appareils</h1>
          <p>
            {devices.length} appareils · {devices.filter(isActive).length} actifs · {rooms.length} pièces
          </p>
        </div>
        {user?.role === "admin" && (
          <button className="btn btn-ghost" onClick={() => void sync()} disabled={syncing}>
            <RefreshCw size={15} className={syncing ? "spin" : ""} /> Synchroniser
          </button>
        )}
      </div>

      <div className="filters">
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
          Tous
        </button>
        {domains.map((d) => (
          <button key={d} className={filter === d ? "active" : ""} onClick={() => setFilter(d)}>
            {DOMAIN_LABELS[d] ?? d}
          </button>
        ))}
      </div>

      {rooms.length === 0 && <div className="empty">Aucun appareil. Synchronisez Home Assistant pour commencer.</div>}
      <div className="rooms-grid">
        {rooms.map(([room, list]) => (
          <Card key={room} title={room} icon={DoorOpen} sub={`${list.length} appareil(s) · ${list.filter(isActive).length} actif(s)`}>
            <div className="device-grid">
              {list.map((d) => {
                const Icon = deviceIcon(d);
                const active = isActive(d);
                return (
                  <div key={d.id} className={`device-card ${active ? "active" : ""}`}>
                    <div className="top">
                      <div className={`device-icon ${active ? "active" : ""} ${d.domain === "lock" ? "warm" : ""}`}>
                        <Icon size={19} />
                      </div>
                      <DeviceControl device={d} readOnly={user?.role === "guest"} onAction={runAction} />
                    </div>
                    <div className="device-meta">
                      <strong>{d.name}</strong>
                      <span>{formatState(d)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

const DOMAIN_LABELS: Record<string, string> = {
  light: "Lumières",
  switch: "Prises",
  climate: "Chauffage",
  cover: "Volets",
  lock: "Serrures",
  sensor: "Capteurs",
  person: "Personnes",
  weather: "Météo",
  vacuum: "Aspirateur",
  script: "Scripts",
  alarm_control_panel: "Alarme",
  binary_sensor: "Détecteurs",
  media_player: "Médias",
  scene: "Scènes",
  fan: "Ventilation",
};
