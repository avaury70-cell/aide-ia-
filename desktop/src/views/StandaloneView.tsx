import { Eye, EyeOff, ExternalLink, KeyRound, MessageSquarePlus, Settings, Sparkles, Square, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import type { AssistantStatus, ChatTurn } from "../../shared/ipc";
import type { ChatMessage } from "../api/types";
import { Chat } from "../components/Chat";
import { HoloOrb } from "../components/HoloOrb";
import type { OrbState } from "../components/Orb";
import { HolidaysCard } from "../components/today/HolidaysCard";
import { SunMoonCard } from "../components/today/SunMoonCard";
import { TasksCard } from "../components/today/TasksCard";
import { TodayCard } from "../components/today/TodayCard";
import { WeatherCard } from "../components/today/WeatherCard";
import { useTasks, useWeather } from "../hooks/useDayData";
import { buildDayContext } from "../lib/dayContext";
import { useClock } from "../hooks/useClock";
import { useSpeech } from "../hooks/useVoice";
import { bridge } from "../lib/bridge";
import { greeting } from "../lib/format";

const STORE_KEY = "aide.standalone.messages";
const VOICE_KEY = "aide.standalone.voice";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // stockage indisponible : la conversation reste en mémoire
  }
}

const BRIEFING = "Fais-moi le briefing du jour";
const SOLO_SUGGESTIONS = [
  BRIEFING,
  "Organise ma journée de demain",
  "Une idée de dîner rapide pour ce soir",
  "5 astuces pour réduire ma facture d'énergie",
  "Imagine ma routine du matin idéale",
];

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// --- Saisie de la clé API ------------------------------------------------------------
function KeySetup({ onSaved, onCancel }: { onSaved: () => void; onCancel?: () => void }) {
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await bridge.setApiKey(key);
    setBusy(false);
    if (res.ok) onSaved();
    else setError(res.error ?? "Clé refusée");
  };

  return (
    <div className="key-setup">
      <form className="card key-card" onSubmit={submit}>
        <div className="alert-icon" style={{ background: "var(--grad)", color: "#fff" }}>
          <KeyRound size={26} />
        </div>
        <h2>Connectez Aide à Claude</h2>
        <p className="muted">Aide a besoin d'une clé API Anthropic pour réfléchir et vous répondre.</p>
        <ol className="steps">
          <li>
            Créez un compte sur la console Anthropic, puis ajoutez un peu de crédit dans <b>Billing</b> (l'utilisation est
            facturée à la demande).
          </li>
          <li>
            Ouvrez <b>API Keys</b>, cliquez sur <b>Create Key</b> et copiez la clé (elle commence par <code>sk-ant-</code>).
          </li>
          <li>Collez-la ci-dessous.</li>
        </ol>
        <a className="btn btn-ghost" href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
          Ouvrir la console Anthropic <ExternalLink size={15} />
        </a>
        <div className="field">
          <label htmlFor="api-key">Votre clé API</label>
          <div className="input-wrap">
            <input
              id="api-key"
              className="input"
              type={show ? "text" : "password"}
              placeholder="sk-ant-…"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoFocus
              spellCheck={false}
            />
            <button type="button" className="icon-btn" onClick={() => setShow(!show)} title={show ? "Masquer" : "Afficher"}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        {error && <div className="error-text">{error}</div>}
        <div className="modal-actions">
          {onCancel && (
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              Annuler
            </button>
          )}
          <button className="btn btn-primary" disabled={busy || !key.trim()}>
            {busy ? "Vérification…" : "Enregistrer la clé"}
          </button>
        </div>
        <p className="fine">Votre clé est chiffrée par votre système et reste sur cet ordinateur.</p>
      </form>
    </div>
  );
}

// --- Réglages -------------------------------------------------------------------------
function SoloSettings({ onClose, onChangeKey, onClear }: { onClose: () => void; onChangeKey: () => void; onClear: () => void }) {
  const [confirmMode, setConfirmMode] = useState(false);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Réglages</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>
        <div className="settings-list">
          <button className="settings-row" onClick={onChangeKey}>
            <span>
              <b>Clé API Anthropic</b>
              <small>Remplacer la clé enregistrée</small>
            </span>
          </button>
          <button className="settings-row" onClick={onClear}>
            <span>
              <b>Effacer la conversation</b>
              <small>Supprime l'historique enregistré sur cet ordinateur</small>
            </span>
          </button>
          <button className="settings-row" onClick={() => setConfirmMode(true)}>
            <span>
              <b>Passer à la maison connectée</b>
              <small>Se connecter à un serveur Aide pour piloter vos appareils</small>
            </span>
          </button>
        </div>
        {confirmMode && (
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setConfirmMode(false)}>
              Rester ici
            </button>
            <button
              className="btn btn-primary"
              onClick={async () => {
                await bridge.setMode("server");
                window.location.reload();
              }}
            >
              Changer de mode
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Assistant seul --------------------------------------------------------------------
export function StandaloneView({ initialStatus }: { initialStatus: AssistantStatus }) {
  const [hasKey, setHasKey] = useState(initialStatus.hasKey);
  const [editingKey, setEditingKey] = useState(false);
  const [settings, setSettings] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => load(STORE_KEY, []));
  const [draft, setDraft] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [streamText, setStreamText] = useState("");
  const [voiceOn, setVoiceOn] = useState(() => load(VOICE_KEY, false));
  const speech = useSpeech();
  const now = useClock(15_000);
  const day = useWeather();
  const todo = useTasks();
  const reqRef = useRef<string | null>(null);

  useEffect(() => save(STORE_KEY, messages), [messages]);
  useEffect(() => save(VOICE_KEY, voiceOn), [voiceOn]);

  useEffect(
    () =>
      bridge.onChatText((id, text) => {
        if (id === reqRef.current) setStreamText(text);
      }),
    [],
  );

  // Raccourci global : la fenêtre s'affiche, on place le curseur dans le champ.
  useEffect(() => bridge.onVoiceToggle(() => document.querySelector<HTMLInputElement>(".composer input")?.focus()), []);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || reqRef.current) return;
      speech.cancel();
      setDraft("");
      const userMsg: ChatMessage = { id: newId(), role: "user", content, tool_calls: [], created_at: new Date().toISOString() };
      const history = [...messages, userMsg];
      setMessages(history);
      const id = newId();
      reqRef.current = id;
      setRequestId(id);
      setStreamText("");

      const turns: ChatTurn[] = history.map((m) => ({ role: m.role, content: m.content }));
      const res = await bridge.chat(id, turns, buildDayContext({ city: day.city, weather: day.weather, tasks: todo.tasks }));
      reqRef.current = null;
      setRequestId(null);
      setStreamText("");

      const keep = res.ok ? res.data!.text : res.data?.text;
      if (res.ok || (keep && res.error === "cancelled")) {
        const note = res.ok ? (res.data!.truncated ? "\n\n*(réponse coupée, demandez la suite)*" : "") : "\n\n*(interrompu)*";
        setMessages((prev) => [
          ...prev,
          { id: newId(), role: "assistant", content: (keep ?? "") + note, tool_calls: [], created_at: new Date().toISOString() },
        ]);
        if (res.ok && voiceOn) speech.speak(res.data!.text);
        return;
      }
      if (res.error === "cancelled") return;
      if (res.status === 401) setHasKey(false);
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "assistant", content: `⚠️ ${res.error ?? "Erreur inconnue"}`, tool_calls: [], created_at: new Date().toISOString() },
      ]);
    },
    [messages, speech, voiceOn, day.city, day.weather, todo.tasks],
  );

  if (!hasKey || editingKey) {
    return (
      <KeySetup
        onSaved={() => {
          setHasKey(true);
          setEditingKey(false);
        }}
        onCancel={hasKey ? () => setEditingKey(false) : undefined}
      />
    );
  }

  const waiting = Boolean(requestId) && !streamText;
  const orbState: OrbState = waiting ? "thinking" : streamText || speech.speaking ? "speaking" : "idle";
  const shown: ChatMessage[] = streamText
    ? [...messages, { id: "stream", role: "assistant", content: streamText, tool_calls: [], created_at: "" }]
    : messages;

  return (
    <div className="app">
      <header className={`topbar ${bridge.platform === "darwin" ? "mac" : ""}`}>
        <div className="brand">
          <span className="brand-dot" /> Aide
        </div>
        <span className="chip ai" style={{ marginRight: "auto" }}>
          <span className="dot" /> Assistant seul
        </span>
        <div className="topbar-right">
          <div className="clock">
            <strong>{now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</strong>
            <small>{now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</small>
          </div>
          <button className="avatar" onClick={() => setSettings(true)} title="Réglages">
            <Settings size={18} />
          </button>
        </div>
      </header>

      <main className="main">
        <div className="dashboard">
          <div className="column">
            <TodayCard />
            <SunMoonCard city={day.city} />
            <HolidaysCard />
          </div>

          <section className="card grow assistant-card" style={{ padding: 0 }}>
            <div className="solo-actions">
              {requestId && (
                <button className="btn btn-ghost" style={{ padding: "7px 14px" }} onClick={() => void bridge.cancelChat(requestId)}>
                  <Square size={13} fill="currentColor" /> Arrêter
                </button>
              )}
              {!requestId && shown.length > 0 && (
                <button className="btn btn-ghost" style={{ padding: "7px 14px" }} onClick={() => void send(BRIEFING)}>
                  <Sparkles size={14} /> Briefing
                </button>
              )}
              <button
                className="icon-btn"
                title={voiceOn ? "Couper la lecture des réponses" : "Lire les réponses à voix haute"}
                onClick={() => {
                  if (voiceOn) speech.cancel();
                  setVoiceOn(!voiceOn);
                }}
              >
                {voiceOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                className="icon-btn"
                title="Nouvelle conversation"
                disabled={Boolean(requestId)}
                onClick={() => {
                  speech.cancel();
                  setMessages([]);
                }}
              >
                <MessageSquarePlus size={16} />
              </button>
            </div>
            <div className="hero" style={shown.length ? { paddingBottom: 0, paddingTop: 10 } : undefined}>
              <HoloOrb state={orbState} size={shown.length ? 150 : 300} />
              {shown.length === 0 && (
                <div className="hero-greeting">
                  {greeting()}, je suis <em>Aide</em>.
                </div>
              )}
              <div className="hero-status">
                {waiting ? "Je réfléchis…" : streamText ? "Je vous réponds…" : "Posez-moi une question, je suis prêt."}
              </div>
            </div>
            <Chat
              messages={shown}
              thinking={waiting}
              recording={false}
              draft={draft}
              onDraft={setDraft}
              onSend={(t) => void send(t)}
              hint="Aide connaît la météo, le calendrier et vos tâches affichés ici."
              suggestions={SOLO_SUGGESTIONS}
            />
          </section>

          <div className="column">
            <WeatherCard city={day.city} weather={day.weather} error={day.error} onCity={(c) => void day.setCity(c)} />
            <TasksCard tasks={todo.tasks} onAdd={todo.add} onToggle={todo.toggle} onRemove={todo.remove} />
          </div>
        </div>
      </main>

      {settings && (
        <SoloSettings
          onClose={() => setSettings(false)}
          onChangeKey={() => {
            setSettings(false);
            setEditingKey(true);
          }}
          onClear={() => {
            setMessages([]);
            setSettings(false);
          }}
        />
      )}
    </div>
  );
}
