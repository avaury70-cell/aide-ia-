import { API_URL } from "../config";
import type {
  Automation,
  ChatMessage,
  ChatReply,
  Conversation,
  Device,
  Memory,
  PendingAction,
  TokenResponse,
  User,
} from "./types";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Serveur injoignable. Êtes-vous connecté au réseau de la maison ?");
  }
  if (res.status === 401 && authToken) onUnauthorized?.();
  if (!res.ok) {
    let detail = `Erreur ${res.status}`;
    try {
      const data = await res.json();
      if (typeof data.detail === "string") detail = data.detail;
    } catch {
      // corps non JSON
    }
    throw new ApiError(res.status, detail);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<TokenResponse>("POST", "/auth/login", { email, password }),
  register: (email: string, password: string, display_name: string) =>
    request<TokenResponse>("POST", "/auth/register", { email, password, display_name }),
  me: () => request<User>("GET", "/auth/me"),
  registerPushToken: (token: string, platform: "ios" | "android") =>
    request<void>("POST", "/auth/push-token", { token, platform }),

  devices: () => request<Device[]>("GET", "/devices"),
  syncDevices: () => request<{ created: number }>("POST", "/devices/sync"),
  deviceAction: (entityId: string, action: string, parameters: Record<string, unknown> = {}) =>
    request<{ status: string }>("POST", `/devices/${entityId}/action`, { action, parameters }),

  conversations: () => request<Conversation[]>("GET", "/conversations"),
  createConversation: () => request<Conversation>("POST", "/conversations"),
  messages: (conversationId: string) =>
    request<ChatMessage[]>("GET", `/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, content: string) =>
    request<ChatReply>("POST", `/conversations/${conversationId}/messages`, { content }),

  pendingActions: () => request<PendingAction[]>("GET", "/pending-actions"),
  confirmAction: (id: string) => request<{ status: string }>("POST", `/pending-actions/${id}/confirm`),
  rejectAction: (id: string) => request<{ status: string }>("POST", `/pending-actions/${id}/reject`),

  automations: () => request<Automation[]>("GET", "/automations"),
  setAutomationEnabled: (id: string, enabled: boolean) =>
    request<Automation>("PATCH", `/automations/${id}`, { enabled }),
  runAutomation: (id: string) => request<{ status: string }>("POST", `/automations/${id}/run`),
  deleteAutomation: (id: string) => request<void>("DELETE", `/automations/${id}`),

  memories: () => request<Memory[]>("GET", "/memories"),
  deleteMemory: (id: string) => request<void>("DELETE", `/memories/${id}`),
};
