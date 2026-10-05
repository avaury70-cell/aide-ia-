import { Bell, X } from "lucide-react";

import { useHome } from "../hooks/useHome";

export function Toasts() {
  const { toasts, dismissToast } = useHome();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <Bell size={18} color="#c4b5fd" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <strong>{t.title}</strong>
            <span>{t.body}</span>
          </div>
          <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => dismissToast(t.id)}>
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
