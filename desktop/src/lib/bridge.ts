import type { AideDesktopApi, ApiResult, SessionUser } from "../../shared/ipc";

declare global {
  interface Window {
    aide?: AideDesktopApi;
  }
}

/**
 * Pont vers le serveur. Dans Electron, tout passe par le processus principal (window.aide).
 * Hors Electron (navigateur, développement), une implémentation équivalente parle directement
 * à l'API — le serveur doit alors autoriser l'origine via CORS_ORIGINS.
 */
function createWebBridge(): AideDesktopApi {
  const TOKEN = "aide.token";
  const SERVER = "aide.server";
  const store = {
    get: (k: string) => {
      try {
        return localStorage.getItem(k);
      } catch {
        return null;
      }
    },
    set: (k: string, v: string | null) => {
      try {
        if (v === null) localStorage.removeItem(k);
        else localStorage.setItem(k, v);
      } catch {
        // stockage indisponible
      }
    },
  };
  const server = () => store.get(SERVER) ?? import.meta.env.VITE_AIDE_SERVER ?? "http://localhost:8000";
  const listeners = new Set<(e: unknown) => void>();
  let socket: WebSocket | null = null;

  const connect = () => {
    socket?.close();
    const token = store.get(TOKEN);
    if (!token) return;
    const ws = new WebSocket(`${server().replace(/^http/, "ws")}/ws?token=${encodeURIComponent(token)}`);
    socket = ws;
    ws.onmessage = (m) => {
      try {
        const ev = JSON.parse(String(m.data));
        if (ev.type !== "ping") listeners.forEach((l) => l(ev));
      } catch {
        // ignoré
      }
    };
    ws.onclose = () => {
      if (socket === ws && store.get(TOKEN)) setTimeout(connect, 3000);
    };
  };

  async function request<T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
    const headers: Record<string, string> = {};
    const token = store.get(TOKEN);
    if (token) headers.Authorization = `Bearer ${token}`;
    const init: RequestInit = { method, headers };
    if (body instanceof FormData) init.body = body;
    else if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
    let res: Response;
    try {
      res = await fetch(server() + path, init);
    } catch {
      return { ok: false, status: 0, error: "Serveur Aide injoignable" };
    }
    const data = res.status === 204 ? undefined : await res.json().catch(() => undefined);
    if (!res.ok) {
      if (res.status === 401) store.set(TOKEN, null);
      const detail = (data as { detail?: unknown } | undefined)?.detail;
      return { ok: false, status: res.status, error: typeof detail === "string" ? detail : `Erreur ${res.status}` };
    }
    return { ok: true, status: res.status, data: data as T };
  }

  async function auth(path: string, payload: unknown): Promise<ApiResult<SessionUser>> {
    const res = await request<{ access_token: string; user: SessionUser }>("POST", path, payload);
    if (!res.ok || !res.data) return { ok: false, status: res.status, error: res.error };
    store.set(TOKEN, res.data.access_token);
    connect();
    return { ok: true, status: res.status, data: res.data.user };
  }

  return {
    platform: "web",
    getServerUrl: async () => server(),
    setServerUrl: async (url) => store.set(SERVER, new URL(url).origin),
    session: async () => {
      if (!store.get(TOKEN)) return null;
      const res = await request<SessionUser>("GET", "/auth/me");
      if (res.ok && !socket) connect();
      return res.ok ? res.data ?? null : null;
    },
    login: (email, password) => auth("/auth/login", { email, password }),
    register: (email, password, display_name) => auth("/auth/register", { email, password, display_name }),
    logout: async () => {
      store.set(TOKEN, null);
      socket?.close();
      socket = null;
    },
    request,
    transcribe: (audio, mimeType) => {
      const form = new FormData();
      form.append("audio", new Blob([audio], { type: mimeType }), "voix.webm");
      return request("POST", "/voice/transcribe", form);
    },
    notify: async (title, body) => {
      if ("Notification" in window && Notification.permission === "granted") new Notification(title, { body });
    },
    onHomeEvent: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    onVoiceToggle: () => () => undefined,
  };
}

export const bridge: AideDesktopApi = window.aide ?? createWebBridge();
export const isDesktop = Boolean(window.aide);
