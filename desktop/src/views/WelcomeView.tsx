import { ArrowRight, House, MessagesSquare } from "lucide-react";

import type { AppMode } from "../../shared/ipc";
import { Orb } from "../components/Orb";

/** Premier lancement : choix entre l'assistant seul et la maison connectée. */
export function WelcomeView({ onChoose }: { onChoose: (mode: AppMode) => void }) {
  return (
    <div className="welcome">
      <Orb state="idle" size={150} />
      <h1>
        Bienvenue dans <em>Aide</em>
      </h1>
      <p className="welcome-sub">Comment voulez-vous commencer ? Vous pourrez changer plus tard dans les réglages.</p>
      <div className="choice-grid">
        <button className="card choice" onClick={() => onChoose("standalone")}>
          <span className="chip ai">Recommandé pour commencer</span>
          <span className="choice-icon">
            <MessagesSquare size={22} />
          </span>
          <h2>Assistant seul</h2>
          <p>Discutez avec Aide tout de suite. Il vous faut seulement une clé API Anthropic : pas de serveur, rien d'autre à installer.</p>
          <span className="choice-cta">
            Commencer <ArrowRight size={16} />
          </span>
        </button>
        <button className="card choice" onClick={() => onChoose("server")}>
          <span className="chip">Configuration avancée</span>
          <span className="choice-icon">
            <House size={22} />
          </span>
          <h2>Maison connectée</h2>
          <p>Pilotez lumières, chauffage et volets. Nécessite le serveur Aide (Docker) et, pour de vrais appareils, Home Assistant.</p>
          <span className="choice-cta">
            Se connecter au serveur <ArrowRight size={16} />
          </span>
        </button>
      </div>
    </div>
  );
}
