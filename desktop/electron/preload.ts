import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

import type { AideDesktopApi, IPC as IpcChannels } from "../shared/ipc";

// Un preload « sandboxé » ne peut charger que le module electron : les canaux sont donc
// recopiés ici, et le typage garantit qu'ils restent identiques à shared/ipc.ts.
const IPC: typeof IpcChannels = {
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
};

// Seule surface exposée à l'interface : pas d'accès Node, pas de jeton d'authentification.
const api: AideDesktopApi = {
  platform: process.platform,
  getStatus: () => ipcRenderer.invoke(IPC.getStatus),
  setMode: (mode) => ipcRenderer.invoke(IPC.setMode, mode),
  setApiKey: (key) => ipcRenderer.invoke(IPC.setApiKey, key),
  clearApiKey: () => ipcRenderer.invoke(IPC.clearApiKey),
  chat: (requestId, turns) => ipcRenderer.invoke(IPC.chat, requestId, turns),
  cancelChat: (requestId) => ipcRenderer.invoke(IPC.cancelChat, requestId),
  onChatText: (listener) => {
    const handler = (_e: IpcRendererEvent, requestId: string, text: string) => listener(requestId, text);
    ipcRenderer.on(IPC.chatText, handler);
    return () => ipcRenderer.removeListener(IPC.chatText, handler);
  },
  getServerUrl: () => ipcRenderer.invoke(IPC.getServerUrl),
  setServerUrl: (url) => ipcRenderer.invoke(IPC.setServerUrl, url),
  session: () => ipcRenderer.invoke(IPC.session),
  login: (email, password) => ipcRenderer.invoke(IPC.login, email, password),
  register: (email, password, name) => ipcRenderer.invoke(IPC.register, email, password, name),
  logout: () => ipcRenderer.invoke(IPC.logout),
  request: (method, path, body) => ipcRenderer.invoke(IPC.request, method, path, body),
  transcribe: (audio, mimeType) => ipcRenderer.invoke(IPC.transcribe, audio, mimeType),
  notify: (title, body) => ipcRenderer.invoke(IPC.notify, title, body),
  onHomeEvent: (listener) => {
    const handler = (_e: IpcRendererEvent, event: unknown) => listener(event);
    ipcRenderer.on(IPC.homeEvent, handler);
    return () => ipcRenderer.removeListener(IPC.homeEvent, handler);
  },
  onVoiceToggle: (listener) => {
    const handler = () => listener();
    ipcRenderer.on(IPC.voiceToggle, handler);
    return () => ipcRenderer.removeListener(IPC.voiceToggle, handler);
  },
};

contextBridge.exposeInMainWorld("aide", api);
