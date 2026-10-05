import { Brain, House, LayoutDashboard, Workflow, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { AppMode, AssistantStatus } from "../shared/ipc";
import { PendingModal } from "./components/PendingModal";
import { SettingsModal } from "./components/SettingsModal";
import { Toasts } from "./components/Toasts";
import { useAssistant } from "./hooks/useAssistant";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useClock } from "./hooks/useClock";
import { HomeProvider, useHome } from "./hooks/useHome";
import { bridge } from "./lib/bridge";
import { Dashboard } from "./views/Dashboard";
import { DevicesView } from "./views/DevicesView";
import { LoginView } from "./views/LoginView";
import { MemoryView } from "./views/MemoryView";
import { RoutinesView } from "./views/RoutinesView";
import { StandaloneView } from "./views/StandaloneView";
import { WelcomeView } from "./views/WelcomeView";

const VIEWS = [
  { id: "home", label: "Accueil", icon: LayoutDashboard },
  { id: "devices", label: "Appareils", icon: House },
  { id: "routines", label: "Routines", icon: Workflow },
  { id: "memory", label: "Mémoire", icon: Brain },
] as const;
type ViewId = (typeof VIEWS)[number]["id"];

function Shell() {
  const { user } = useAuth();
  const { pending, online } = useHome();
  const assistant = useAssistant();
  const now = useClock(15_000);
  const [view, setView] = useState<ViewId>("home");
  const [settings, setSettings] = useState(false);

  // Raccourci global (Ctrl/⌘ + Maj + Espace) : retour à l'accueil et micro.
  const toggleMic = useRef(assistant.toggleMic);
  toggleMic.current = assistant.toggleMic;
  useEffect(
    () =>
      bridge.onVoiceToggle(() => {
        setView("home");
        void toggleMic.current();
      }),
    [],
  );

  return (
    <div className="app">
      <header className={`topbar ${bridge.platform === "darwin" ? "mac" : ""}`}>
        <div className="brand">
          <span className="brand-dot" /> Aide
        </div>
        <nav className="nav">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
        <div className="topbar-right">
          {!online && (
            <span className="chip warn">
              <WifiOff size={12} /> Hors ligne
            </span>
          )}
          <div className="clock">
            <strong>{now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</strong>
            <small>{now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</small>
          </div>
          <button className="avatar" onClick={() => setSettings(true)} title="Profil et réglages">
            {user?.display_name.slice(0, 1).toUpperCase()}
          </button>
        </div>
      </header>

      <main className="main">
        {view === "home" && <Dashboard assistant={assistant} />}
        {view === "devices" && <DevicesView />}
        {view === "routines" && <RoutinesView />}
        {view === "memory" && <MemoryView />}
      </main>

      {pending[0] && <PendingModal key={pending[0].id} action={pending[0]} />}
      {settings && <SettingsModal onClose={() => setSettings(false)} />}
      <Toasts />
    </div>
  );
}

function Root() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <LoginView />;
  return (
    <HomeProvider>
      <Shell />
    </HomeProvider>
  );
}

function Aurora() {
  return (
    <div className="aurora" aria-hidden>
      <span />
      <span />
      <span />
    </div>
  );
}

export default function App() {
  const [status, setStatus] = useState<AssistantStatus | null>(null);

  useEffect(() => {
    void bridge.getStatus().then(setStatus);
  }, []);

  const choose = async (mode: AppMode) => {
    await bridge.setMode(mode);
    setStatus(await bridge.getStatus());
  };

  return (
    <>
      <Aurora />
      {status && status.mode === null && <WelcomeView onChoose={(m) => void choose(m)} />}
      {status?.mode === "standalone" && <StandaloneView initialStatus={status} />}
      {status?.mode === "server" && (
        <AuthProvider>
          <Root />
        </AuthProvider>
      )}
    </>
  );
}
