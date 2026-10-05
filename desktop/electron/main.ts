/**
 * Processus principal : fenêtre, icône de la barre système, raccourci global,
 * et passerelle réseau vers le serveur Aide (le jeton ne quitte jamais ce processus).
 */
import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  Notification,
  safeStorage,
  session,
  shell,
  systemPreferences,
  Tray,
} from "electron";
import fs from "node:fs";
import path from "node:path";

import { IPC, type ApiResult, type AppMode, type SessionUser } from "../shared/ipc";
import { cancelChat, chat, checkApiKey } from "./assistant";

const DEV_URL = process.env.AIDE_DEV_URL;
const VOICE_SHORTCUT = "CommandOrControl+Shift+Space";

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let quitting = false;

// --- Configuration et session persistées ---------------------------------------------
const configFile = () => path.join(app.getPath("userData"), "config.json");
const tokenFile = () => path.join(app.getPath("userData"), "session.bin");
const keyFile = () => path.join(app.getPath("userData"), "anthropic-key.bin");

interface AppConfig {
  serverUrl: string;
  mode: AppMode | null;
}

function readConfig(): AppConfig {
  const defaults: AppConfig = { serverUrl: "http://localhost:8000", mode: null };
  try {
    return { ...defaults, ...JSON.parse(fs.readFileSync(configFile(), "utf8")) };
  } catch {
    return defaults;
  }
}

function writeConfig(cfg: AppConfig) {
  fs.writeFileSync(configFile(), JSON.stringify(cfg, null, 2));
}

// Clé API Anthropic (mode assistant seul), chiffrée par le trousseau du système.
let apiKey: string | null = null;

function loadApiKey(): string | null {
  try {
    return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(fs.readFileSync(keyFile())) : null;
  } catch {
    return null;
  }
}

function saveApiKey(value: string | null) {
  apiKey = value;
  try {
    if (value && safeStorage.isEncryptionAvailable()) fs.writeFileSync(keyFile(), safeStorage.encryptString(value));
    else fs.rmSync(keyFile(), { force: true });
  } catch {
    // la clé reste en mémoire jusqu'à la fermeture
  }
}

let token: string | null = null;

function loadToken(): string | null {
  try {
    const raw = fs.readFileSync(tokenFile());
    return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(raw) : null;
  } catch {
    return null;
  }
}

function saveToken(value: string | null) {
  token = value;
  try {
    if (value && safeStorage.isEncryptionAvailable()) {
      // Chiffré par le trousseau du système (DPAPI, Keychain, libsecret).
      fs.writeFileSync(tokenFile(), safeStorage.encryptString(value));
    } else {
      fs.rmSync(tokenFile(), { force: true });
    }
  } catch {
    // la session reste en mémoire
  }
}

// --- Passerelle HTTP -------------------------------------------------------------------
async function apiFetch<T>(method: string, apiPath: string, body?: unknown): Promise<ApiResult<T>> {
  if (!apiPath.startsWith("/") || apiPath.includes("..")) {
    return { ok: false, status: 400, error: "Chemin invalide" };
  }
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let init: RequestInit = { method, headers };
  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  let res: Response;
  try {
    res = await fetch(readConfig().serverUrl.replace(/\/$/, "") + apiPath, init);
  } catch {
    return { ok: false, status: 0, error: "Serveur Aide injoignable. Vérifiez l'adresse dans les réglages." };
  }
  if (res.status === 401 && token && apiPath !== "/auth/login") {
    saveToken(null);
    stopEvents();
  }
  let data: unknown;
  try {
    data = res.status === 204 ? undefined : await res.json();
  } catch {
    data = undefined;
  }
  if (!res.ok) {
    const detail = (data as { detail?: unknown } | undefined)?.detail;
    return { ok: false, status: res.status, error: typeof detail === "string" ? detail : `Erreur ${res.status}` };
  }
  return { ok: true, status: res.status, data: data as T };
}

async function authenticate(apiPath: string, payload: unknown): Promise<ApiResult<SessionUser>> {
  const res = await apiFetch<{ access_token: string; user: SessionUser }>("POST", apiPath, payload);
  if (!res.ok || !res.data) return { ok: false, status: res.status, error: res.error };
  saveToken(res.data.access_token);
  startEvents();
  return { ok: true, status: res.status, data: res.data.user };
}

// --- Flux temps réel (WebSocket du serveur → interface + notifications natives) ----------
let socket: WebSocket | null = null;
let retryTimer: NodeJS.Timeout | null = null;
let retryDelay = 1000;

function startEvents() {
  stopEvents();
  if (!token) return;
  const url = readConfig().serverUrl.replace(/^http/, "ws").replace(/\/$/, "") + `/ws?token=${encodeURIComponent(token)}`;
  const ws = new WebSocket(url);
  socket = ws;
  ws.onopen = () => {
    retryDelay = 1000;
  };
  ws.onmessage = (msg) => {
    let event: { type: string; data?: Record<string, string> };
    try {
      event = JSON.parse(String(msg.data));
    } catch {
      return;
    }
    if (event.type === "ping") return;
    win?.webContents.send(IPC.homeEvent, event);
    const unfocused = !win?.isFocused();
    if (event.type === "notification" && unfocused) showNotification(event.data?.title ?? "Aide", event.data?.body ?? "");
    if (event.type === "pending_action" && unfocused) {
      showNotification("Autorisation requise", event.data?.summary ?? "Une action attend votre validation");
    }
  };
  ws.onclose = () => {
    if (socket !== ws || !token) return;
    retryTimer = setTimeout(startEvents, retryDelay);
    retryDelay = Math.min(retryDelay * 2, 30000);
  };
}

function stopEvents() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  const ws = socket;
  socket = null;
  ws?.close();
}

function showNotification(title: string, body: string) {
  if (!Notification.isSupported()) return;
  const n = new Notification({ title, body, silent: false });
  n.on("click", showWindow);
  n.show();
}

// --- Fenêtre, barre système, raccourci -------------------------------------------------
function showWindow() {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

function toggleVoice() {
  showWindow();
  win?.webContents.send(IPC.voiceToggle);
}

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#07080f",
    title: "Aide",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.once("ready-to-show", () => win?.show());

  // Aucune navigation hors de l'application ; liens externes ouverts dans le navigateur.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) void shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!DEV_URL || !url.startsWith(DEV_URL)) e.preventDefault();
  });

  // Fermer la fenêtre la masque : l'assistant reste disponible dans la barre système.
  win.on("close", (e) => {
    if (!quitting && tray) {
      e.preventDefault();
      win?.hide();
    }
  });

  if (DEV_URL) void win.loadURL(DEV_URL);
  else void win.loadFile(path.join(__dirname, "..", "..", "dist", "index.html"));
}

function createTray() {
  // Petite icône générée (pastille dégradée) : aucun fichier image à embarquer.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs><circle cx="16" cy="16" r="13" fill="url(#g)"/><circle cx="16" cy="16" r="5" fill="#fff"/></svg>`;
  const icon = nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`);
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon.resize({ width: 16, height: 16 }));
  tray.setToolTip("Aide — assistant domestique");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Ouvrir Aide", click: showWindow },
      { label: "Parler à Aide", accelerator: VOICE_SHORTCUT, click: toggleVoice },
      { type: "separator" },
      {
        label: "Quitter",
        click: () => {
          quitting = true;
          app.quit();
        },
      },
    ]),
  );
  tray.on("click", showWindow);
}

function registerIpc() {
  ipcMain.handle(IPC.getStatus, () => ({
    mode: readConfig().mode,
    hasKey: Boolean(apiKey),
    keyPersistent: safeStorage.isEncryptionAvailable(),
  }));
  ipcMain.handle(IPC.setMode, (_e, mode: AppMode) => {
    if (mode !== "standalone" && mode !== "server") throw new Error("Mode inconnu");
    writeConfig({ ...readConfig(), mode });
  });
  ipcMain.handle(IPC.setApiKey, async (_e, key: string) => {
    const res = await checkApiKey(String(key));
    if (res.ok) saveApiKey(String(key).trim());
    return res;
  });
  ipcMain.handle(IPC.clearApiKey, () => saveApiKey(null));
  ipcMain.handle(IPC.chat, (e, requestId: string, turns: unknown) => {
    if (!apiKey) return { ok: false, status: 401, error: "Aucune clé API enregistrée." };
    const sender = e.sender;
    return chat(apiKey, String(requestId), turns, (text) => {
      if (!sender.isDestroyed()) sender.send(IPC.chatText, requestId, text);
    });
  });
  ipcMain.handle(IPC.cancelChat, (_e, requestId: string) => cancelChat(String(requestId)));

  ipcMain.handle(IPC.getServerUrl, () => readConfig().serverUrl);
  ipcMain.handle(IPC.setServerUrl, (_e, url: string) => {
    const parsed = new URL(url); // lève une erreur si l'URL est invalide
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("URL http(s) attendue");
    writeConfig({ ...readConfig(), serverUrl: parsed.origin });
    if (token) startEvents();
  });
  ipcMain.handle(IPC.session, async () => {
    if (!token) return null;
    const res = await apiFetch<SessionUser>("GET", "/auth/me");
    if (res.ok && !socket) startEvents();
    return res.ok ? res.data : null;
  });
  ipcMain.handle(IPC.login, (_e, email: string, password: string) => authenticate("/auth/login", { email, password }));
  ipcMain.handle(IPC.register, (_e, email: string, password: string, display_name: string) =>
    authenticate("/auth/register", { email, password, display_name }),
  );
  ipcMain.handle(IPC.logout, () => {
    saveToken(null);
    stopEvents();
  });
  ipcMain.handle(IPC.request, (_e, method: string, apiPath: string, body?: unknown) => apiFetch(method, apiPath, body));
  ipcMain.handle(IPC.transcribe, (_e, audio: ArrayBuffer, mimeType: string) => {
    const form = new FormData();
    const ext = mimeType.includes("ogg") ? "ogg" : mimeType.includes("wav") ? "wav" : "webm";
    form.append("audio", new Blob([audio], { type: mimeType }), `voix.${ext}`);
    return apiFetch("POST", "/voice/transcribe", form);
  });
  ipcMain.handle(IPC.notify, (_e, title: string, body: string) => showNotification(title, body));
}

// --- Démarrage ----------------------------------------------------------------------------
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", showWindow);

  app.whenReady().then(async () => {
    if (process.platform === "win32") app.setAppUserModelId("fr.aide.desktop");
    // Seul le micro est autorisé (dictée vocale) ; toute autre permission est refusée.
    session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
      callback(permission === "media");
    });
    if (process.platform === "darwin") await systemPreferences.askForMediaAccess("microphone");

    token = loadToken();
    apiKey = loadApiKey();
    registerIpc();
    createWindow();
    createTray();
    if (!globalShortcut.register(VOICE_SHORTCUT, toggleVoice)) {
      console.warn(`Raccourci ${VOICE_SHORTCUT} indisponible`);
    }
  });

  app.on("activate", showWindow);
  app.on("before-quit", () => {
    quitting = true;
  });
  app.on("will-quit", () => {
    globalShortcut.unregisterAll();
    stopEvents();
  });
}
