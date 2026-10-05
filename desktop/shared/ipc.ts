/** Contrat entre le processus principal Electron et l'interface (exposé via le preload). */

export interface ApiResult<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export interface SessionUser {
  id: string;
  email: string;
  display_name: string;
  role: "admin" | "member" | "guest";
}

export interface AideDesktopApi {
  platform: string;
  getServerUrl(): Promise<string>;
  setServerUrl(url: string): Promise<void>;
  session(): Promise<SessionUser | null>;
  login(email: string, password: string): Promise<ApiResult<SessionUser>>;
  register(email: string, password: string, displayName: string): Promise<ApiResult<SessionUser>>;
  logout(): Promise<void>;
  request<T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>>;
  transcribe(audio: ArrayBuffer, mimeType: string): Promise<ApiResult<{ text: string }>>;
  notify(title: string, body: string): Promise<void>;
  onHomeEvent(listener: (event: unknown) => void): () => void;
  onVoiceToggle(listener: () => void): () => void;
}

export const IPC = {
  getServerUrl: "config:get-server",
  setServerUrl: "config:set-server",
  session: "auth:session",
  login: "auth:login",
  register: "auth:register",
  logout: "auth:logout",
  request: "api:request",
  transcribe: "voice:transcribe",
  notify: "ui:notify",
  homeEvent: "home:event",
  voiceToggle: "voice:toggle",
} as const;
