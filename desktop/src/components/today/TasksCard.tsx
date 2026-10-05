import { Check, ListTodo, Plus, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import type { Task } from "../../hooks/useDayData";
import { Card } from "../ui";

export function TasksCard({ tasks, onAdd, onToggle, onRemove }: {
  tasks: Task[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [text, setText] = useState("");
  const done = tasks.filter((t) => t.done).length;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text);
    setText("");
  };

  return (
    <Card
      title="Mes tâches du jour"
      icon={ListTodo}
      className="grow"
      action={tasks.length > 0 && <span className="chip">{done}/{tasks.length}</span>}
    >
      <form className="search-row" onSubmit={submit}>
        <input className="input" placeholder="Ajouter une tâche…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="icon-btn" disabled={!text.trim()} title="Ajouter">
          <Plus size={16} />
        </button>
      </form>
      <div className="scroll" style={{ marginTop: 8 }}>
        {tasks.length === 0 && <div className="empty">Rien de prévu. Ajoutez une tâche ou demandez à Aide de vous aider à planifier.</div>}
        {tasks.map((t) => (
          <div key={t.id} className={`task ${t.done ? "done" : ""}`}>
            <button className="task-check" onClick={() => onToggle(t.id)} aria-label={t.done ? "Marquer à faire" : "Marquer comme fait"}>
              {t.done && <Check size={13} strokeWidth={3} />}
            </button>
            <span className="grow">{t.text}</span>
            <button className="task-remove" onClick={() => onRemove(t.id)} aria-label="Supprimer">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
