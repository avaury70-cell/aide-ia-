import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

import type { AideDesktopApi, IPC as IpcChannels } from "../shared/ipc";

// Un preload « sandboxé » ne peut charger que le module electron : les canaux sont donc
// recopiés ici, et le typage garantit qu'ils restent identiques à shared/ipc.ts.
const IPC: typeof IpcChannels = {
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
