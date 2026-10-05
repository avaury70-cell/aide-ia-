import { LogOut, Server, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "../hooks/useAuth";
import { bridge, isDesktop } from "../lib/bridge";

const ROLES = { admin: "Administrateur", member: "Membre", guest: "Invité" } as const;

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth();
  const [server, setServer] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void bridge.getServerUrl().then(setServer);
  }, []);

  const save = async () => {
    setError(null);
    try {
      await bridge.setServerUrl(server.trim());
      setSaved(true);
    } catch {
      setError("Adresse invalide (exemple : http://192.168.1.10:8000)");
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div className="avatar" style={{ width: 52, height: 52, fontSize: 20 }}>
              {user?.display_name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0 }}>{user?.display_name}</h2>
              <p style={{ fontSize: 13 }}>
                {user?.email} · {user ? ROLES[user.role] : ""}
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        <div className="field" style={{ marginTop: 24 }}>
          <label htmlFor="server">
            <Server size={12} style={{ verticalAlign: -1 }} /> Adresse du serveur Aide
          </label>
          <input
            id="server"
            className="input"
            value={server}
            onChange={(e) => {
              setServer(e.target.value);
              setSaved(false);
            }}
          />
        </div>
        {error && <div className="error-text">{error}</div>}
        {isDesktop && (
          <button
            className="link-btn"
            style={{ marginTop: 16, fontSize: 13 }}
            onClick={async () => {
              await bridge.setMode("standalone");
              window.location.reload();
            }}
          >
            Passer en mode « assistant seul » (sans maison)
          </button>
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => void logout()}>
            <LogOut size={16} /> Se déconnecter
          </button>
          <button className="btn btn-primary" onClick={() => void save()}>
            {saved ? "Enregistré ✓" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
