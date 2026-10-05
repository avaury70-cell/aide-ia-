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

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** "standalone" : assistant seul avec une clé API ; "server" : maison connectée via un serveur Aide. */
export type AppMode = "standalone" | "server";

export interface AssistantStatus {
  mode: AppMode | null;
  hasKey: boolean;
  /** false si le système ne peut pas chiffrer la clé : elle n'est alors gardée que jusqu'à la fermeture. */
  keyPersistent: boolean;
}

export interface AideDesktopApi {
  platform: string;
  getStatus(): Promise<AssistantStatus>;
  setMode(mode: AppMode): Promise<void>;
  setApiKey(key: string): Promise<ApiResult<null>>;
  clearApiKey(): Promise<void>;
  chat(requestId: string, turns: ChatTurn[]): Promise<ApiResult<{ text: string; truncated: boolean }>>;
  cancelChat(requestId: string): Promise<void>;
  onChatText(listener: (requestId: string, text: string) => void): () => void;
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
  getStatus: "app:status",
  setMode: "app:set-mode",
  setApiKey: "assistant:set-key",
  clearApiKey: "assistant:clear-key",
  chat: "assistant:chat",
  cancelChat: "assistant:cancel",
  chatText: "assistant:text",
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
