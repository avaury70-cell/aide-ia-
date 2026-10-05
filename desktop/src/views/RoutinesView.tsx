import { Bot, Play, Trash2, User } from "lucide-react";

import { api, ApiError } from "../api/client";
import type { Automation } from "../api/types";
import { Toggle } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { useHome } from "../hooks/useHome";
import { describeTrigger, relativeTime } from "../lib/format";

export function RoutinesView() {
  const { user } = useAuth();
  const { automations, setAutomations, pushToast } = useHome();
  const readOnly = user?.role === "guest";

  const toggle = async (a: Automation, enabled: boolean) => {
    setAutomations((prev) => prev.map((x) => (x.id === a.id ? { ...x, enabled } : x)));
    try {
      await api.setAutomationEnabled(a.id, enabled);
    } catch {
      setAutomations((prev) => prev.map((x) => (x.id === a.id ? { ...x, enabled: !enabled } : x)));
    }
  };

  const run = async (a: Automation) => {
    try {
      const r = await api.runAutomation(a.id);
      const now = new Date().toISOString();
      setAutomations((prev) => prev.map((x) => (x.id === a.id ? { ...x, last_run_at: now } : x)));
      pushToast(a.name, r.status === "success" ? "Routine exécutée" : `Statut : ${r.status}`);
    } catch (e) {
      pushToast("Exécution impossible", e instanceof ApiError ? e.message : "Erreur");
    }
  };

  const remove = async (a: Automation) => {
    if (!window.confirm(`Supprimer la routine « ${a.name} » ?`)) return;
    await api.deleteAutomation(a.id);
    setAutomations((prev) => prev.filter((x) => x.id !== a.id));
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Routines</h1>
          <p>Décrivez une routine à Aide en langage naturel : « tous les matins à 7 h, ouvre les volets ».</p>
        </div>
      </div>
      {automations.length === 0 && <div className="empty">Aucune routine pour l'instant.</div>}
      <div className="routine-grid">
        {automations.map((a) => (
          <article key={a.id} className="card routine-card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <h3>{a.name}</h3>
                <span className="chip">{describeTrigger(a.trigger)}</span>
              </div>
              <Toggle on={a.enabled} label={a.name} disabled={readOnly} onChange={(v) => void toggle(a, v)} />
            </div>
            {a.description && <p style={{ color: "var(--text-soft)", margin: "14px 0 0" }}>{a.description}</p>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
              <span className={`chip ${a.created_by === "assistant" ? "ai" : ""}`}>
                {a.created_by === "assistant" ? <Bot size={12} /> : <User size={12} />}
                {a.created_by === "assistant" ? "Créée par Aide" : "Manuelle"}
              </span>
              <span className="chip">{a.actions.length} action(s)</span>
              {a.last_run_at && <span className="chip">Dernière : {relativeTime(a.last_run_at)}</span>}
            </div>
            {!readOnly && (
              <div className="actions">
                <button className="btn btn-ghost" style={{ padding: "8px 14px" }} onClick={() => void run(a)}>
                  <Play size={14} /> Exécuter
                </button>
                <button className="icon-btn danger" title="Supprimer" onClick={() => void remove(a)}>
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
