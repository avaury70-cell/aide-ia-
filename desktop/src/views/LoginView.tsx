import { ArrowRight, Server } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Orb } from "../components/Orb";
import { useAuth } from "../hooks/useAuth";
import { bridge } from "../lib/bridge";

export function LoginView() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "setup">("login");
  const [server, setServer] = useState("");
  const [showServer, setShowServer] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void bridge.getServerUrl().then(setServer);
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (showServer) await bridge.setServerUrl(server.trim());
      if (mode === "login") await login(email.trim(), password);
      else await register(email.trim(), password, name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <div className="login-hero">
        <Orb state={busy ? "thinking" : "idle"} size={190} />
        <h1>
          Votre maison,
          <br />
          <em>à l'écoute.</em>
        </h1>
        <p>
          Aide pilote vos lumières, votre chauffage et vos routines en langage naturel — à la voix ou au clavier —
          tout en gardant vos données chez vous.
        </p>
      </div>

      <form className="card login-card" onSubmit={submit}>
        <h2>{mode === "login" ? "Connexion" : "Première configuration"}</h2>
        <p style={{ color: "var(--muted)", margin: "6px 0 4px" }}>
          {mode === "login" ? "Heureux de vous revoir." : "Créez le compte administrateur du foyer."}
        </p>

        {mode === "setup" && (
          <div className="field">
            <label htmlFor="name">Prénom</label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        )}
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            className="input"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {showServer && (
          <div className="field">
            <label htmlFor="server">Adresse du serveur</label>
            <input id="server" className="input" value={server} onChange={(e) => setServer(e.target.value)} />
          </div>
        )}
        {error && <div className="error-text">{error}</div>}

        <button className="btn btn-primary" style={{ width: "100%", marginTop: 22, height: 50 }} disabled={busy}>
          {mode === "login" ? "Se connecter" : "Créer le compte"} <ArrowRight size={17} />
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, fontSize: 13 }}>
          <button type="button" className="link-btn" onClick={() => setMode(mode === "login" ? "setup" : "login")}>
            {mode === "login" ? "Première utilisation ?" : "J'ai déjà un compte"}
          </button>
          <button type="button" className="link-btn" onClick={() => setShowServer(!showServer)}>
            <Server size={13} style={{ verticalAlign: -2 }} /> Serveur
          </button>
        </div>
      </form>
    </div>
  );
}
