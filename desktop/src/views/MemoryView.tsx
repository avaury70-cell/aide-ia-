import { Brain, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "../api/client";
import type { Memory } from "../api/types";
import { relativeTime } from "../lib/format";

const CATEGORIES: Record<string, string> = {
  preference: "Préférence",
  routine: "Habitude",
  household: "Foyer",
  general: "Général",
};

export function MemoryView() {
  const [memories, setMemories] = useState<Memory[] | null>(null);

  useEffect(() => {
    void api.memories().then(setMemories).catch(() => setMemories([]));
  }, []);

  const forget = async (m: Memory) => {
    await api.deleteMemory(m.id);
    setMemories((prev) => prev?.filter((x) => x.id !== m.id) ?? null);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Mémoire</h1>
          <p>Ce qu'Aide a retenu de vos préférences. Vous pouvez effacer chaque souvenir à tout moment.</p>
        </div>
      </div>
      <section className="card" style={{ maxWidth: 860 }}>
        {memories?.length === 0 && (
          <div className="empty">
            <Brain size={28} style={{ opacity: 0.5 }} />
            <div>Aucun souvenir. Dites par exemple : « retiens que je préfère 19 °C la nuit ».</div>
          </div>
        )}
        {memories?.map((m) => (
          <div key={m.id} className="list-item">
            <span className="timeline-dot notification" />
            <div className="grow">
              <strong>{m.content}</strong>
              <small>
                {CATEGORIES[m.category] ?? m.category} · {relativeTime(m.created_at)}
              </small>
            </div>
            {m.user_id === null && (
              <span className="chip">
                <Users size={12} /> Foyer
              </span>
            )}
            <button className="icon-btn danger" title="Oublier" onClick={() => void forget(m)}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
