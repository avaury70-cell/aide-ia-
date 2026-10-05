import { Check, Mic, Send, Square, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import type { ChatMessage } from "../api/types";
import { isDesktop } from "../lib/bridge";
import { TOOL_LABELS } from "../lib/format";

const SUGGESTIONS = [
  "Quelle température fait-il dans le salon ?",
  "Éteins toutes les lumières",
  "Lance le mode cinéma",
  "Chaque soir à 23 h, ferme les volets",
];

interface Props {
  messages: ChatMessage[];
  thinking: boolean;
  recording: boolean;
  draft: string;
  onDraft: (value: string) => void;
  onSend: (text: string) => void;
  onMic: () => void;
}

export function Chat({ messages, thinking, recording, draft, onDraft, onSend, onMic }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const [isMac] = useState(() => navigator.platform.toLowerCase().includes("mac"));

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, thinking]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (draft.trim()) onSend(draft);
  };

  return (
    <div className="chat">
      {messages.length === 0 && !thinking ? (
        <div className="suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => onSend(s)}>
              {s}
            </button>
          ))}
        </div>
      ) : (
        <div className="messages">
          {messages.map((m) => (
            <div key={m.id} className={`msg ${m.role}`}>
              {m.content}
              {m.tool_calls.length > 0 && (
                <div className="tools">
                  {m.tool_calls.map((t, i) => (
                    <span key={i} className={`chip ${t.is_error ? "warn" : "ai"}`}>
                      {t.is_error ? <TriangleAlert size={11} /> : <Check size={11} />}
                      {TOOL_LABELS[t.name] ?? t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {thinking && (
            <div className="typing" aria-label="Aide réfléchit">
              <i />
              <i />
              <i />
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      <form className="composer" onSubmit={submit}>
        <button
          type="button"
          className={`mic-btn ${recording ? "live" : ""}`}
          onClick={onMic}
          title={recording ? "Arrêter" : "Parler"}
        >
          {recording ? <Square size={16} fill="currentColor" /> : <Mic size={19} />}
        </button>
        <input
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          placeholder={recording ? "Je vous écoute…" : "Demandez quelque chose à Aide…"}
          disabled={thinking}
          autoFocus
        />
        <button type="submit" className="send-btn" disabled={thinking || !draft.trim()} title="Envoyer">
          <Send size={17} />
        </button>
      </form>
      {isDesktop && (
        <div className="composer-hint">
          Parlez à tout moment avec <kbd>{isMac ? "⌘" : "Ctrl"}</kbd> <kbd>⇧</kbd> <kbd>Espace</kbd>
        </div>
      )}
    </div>
  );
}
