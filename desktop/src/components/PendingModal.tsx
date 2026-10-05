import { ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { api, ApiError } from "../api/client";
import type { PendingAction } from "../api/types";
import { useHome } from "../hooks/useHome";

/** Validation humaine d'une action sensible demandée à l'assistant (serrure, alarme, volets…). */
export function PendingModal({ action }: { action: PendingAction }) {
  const { dropPending, pushToast } = useHome();
  const [busy, setBusy] = useState(false);
  const total = Math.max(1, new Date(action.expires_at).getTime() - Date.now());
  const [left, setLeft] = useState(total);

  useEffect(() => {
    const id = setInterval(() => {
      const remaining = new Date(action.expires_at).getTime() - Date.now();
      setLeft(remaining);
      if (remaining <= 0) dropPending(action.id);
    }, 1000);
    return () => clearInterval(id);
  }, [action, dropPending]);

  const resolve = async (approve: boolean) => {
    setBusy(true);
    try {
      await (approve ? api.confirmAction(action.id) : api.rejectAction(action.id));
      pushToast(approve ? "Action autorisée" : "Action refusée", action.summary);
    } catch (e) {
      pushToast("Action impossible", e instanceof ApiError ? e.message : "Erreur inconnue");
    } finally {
      dropPending(action.id);
    }
  };

  return (
    <div className="overlay">
      <div className="modal" role="alertdialog" aria-labelledby="pending-title">
        <div className="alert-icon">
          <ShieldAlert size={28} />
        </div>
        <h2 id="pending-title">Autorisation requise</h2>
        <p>
          Aide souhaite exécuter <strong>{action.summary}</strong>. Cette action concerne la sécurité de la maison
          et nécessite votre accord.
        </p>
        <div className="countdown">
          <div style={{ width: `${Math.max(0, (left / total) * 100)}%` }} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" disabled={busy} onClick={() => void resolve(false)}>
            Refuser
          </button>
          <button className="btn btn-warm" disabled={busy} onClick={() => void resolve(true)}>
            Autoriser
          </button>
        </div>
      </div>
    </div>
  );
}
