import { bridge } from "../lib/bridge";
import type {
  Automation,
  AutomationRun,
  ChatMessage,
  ChatReply,
  Conversation,
  Device,
  Memory,
  PendingAction,
  Room,
} from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await bridge.request<T>(method, path, body);
  if (!res.ok) throw new ApiError(res.status, res.error ?? "Erreur inconnue");
  return res.data as T;
}

export const api = {
  devices: () => call<Device[]>("GET", "/devices"),
  rooms: () => call<Room[]>("GET", "/rooms"),
  createRoom: (name: string) => call<Room>("POST", "/rooms", { name }),
  syncDevices: () => call<{ created: number }>("POST", "/devices/sync"),
  updateDevice: (entityId: string, patch: Partial<{ room_id: string | null; is_exposed: boolean; name: string }>) =>
    call<Device>("PATCH", `/devices/${entityId}`, patch),
  deviceAction: (entityId: string, action: string, parameters: Record<string, unknown> = {}) =>
    call<{ status: string }>("POST", `/devices/${entityId}/action`, { action, parameters }),

  conversations: () => call<Conversation[]>("GET", "/conversations"),
  createConversation: () => call<Conversation>("POST", "/conversations"),
  messages: (id: string) => call<ChatMessage[]>("GET", `/conversations/${id}/messages`),
  sendMessage: (id: string, content: string) => call<ChatReply>("POST", `/conversations/${id}/messages`, { content }),

  pendingActions: () => call<PendingAction[]>("GET", "/pending-actions"),
  confirmAction: (id: string) => call<{ status: string }>("POST", `/pending-actions/${id}/confirm`),
  rejectAction: (id: string) => call<{ status: string }>("POST", `/pending-actions/${id}/reject`),

  automations: () => call<Automation[]>("GET", "/automations"),
  setAutomationEnabled: (id: string, enabled: boolean) => call<Automation>("PATCH", `/automations/${id}`, { enabled }),
  runAutomation: (id: string) => call<AutomationRun>("POST", `/automations/${id}/run`),
  deleteAutomation: (id: string) => call<void>("DELETE", `/automations/${id}`),

  memories: () => call<Memory[]>("GET", "/memories"),
  deleteMemory: (id: string) => call<void>("DELETE", `/memories/${id}`),

  transcribe: async (audio: Blob): Promise<string> => {
    const res = await bridge.transcribe(await audio.arrayBuffer(), audio.type || "audio/webm");
    if (!res.ok) throw new ApiError(res.status, res.error ?? "Transcription impossible");
    return res.data?.text ?? "";
  },
};
