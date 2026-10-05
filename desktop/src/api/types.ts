export type { SessionUser as User } from "../../shared/ipc";

export interface Room {
  id: string;
  name: string;
  floor: number | null;
  icon: string | null;
}

export interface Device {
  id: string;
  entity_id: string;
  name: string;
  domain: string;
  device_class: string | null;
  room: Room | null;
  is_exposed: boolean;
  is_sensitive: boolean;
  state: string | null;
  attributes: Record<string, unknown>;
  last_changed_at: string | null;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  is_error: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  tool_calls: ToolCall[];
  created_at: string;
}

export interface PendingAction {
  id: string;
  entity_id: string;
  action: string;
  parameters: Record<string, unknown>;
  summary: string;
  status: string;
  expires_at: string;
}

export interface ChatReply {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
  pending_actions: PendingAction[];
}

export type Trigger =
  | { type: "time"; cron: string }
  | { type: "state"; entity_id: string; to?: string; from?: string };

export interface Automation {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  trigger: Trigger;
  conditions: { entity_id: string; state: string }[];
  actions: Record<string, unknown>[];
  created_by: string;
  last_run_at: string | null;
  created_at: string;
}

export interface AutomationRun {
  id: number;
  started_at: string;
  status: string;
  detail: Record<string, unknown>;
}

export interface Memory {
  id: string;
  category: string;
  content: string;
  user_id: string | null;
  created_at: string;
}

export type HomeEvent =
  | { type: "state_changed"; data: { entity_id: string; state: string; attributes: Record<string, unknown> } }
  | { type: "pending_action"; data: { id: string; summary: string } }
  | { type: "notification"; data: { title: string; body: string } };
