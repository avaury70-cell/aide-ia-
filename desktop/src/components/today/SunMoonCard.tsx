import { Sunrise } from "lucide-react";
import { useMemo } from "react";

import type { City } from "../../../shared/ipc";
import { useClock } from "../../hooks/useClock";
import { duration, hhmm, moon, sunTimes } from "../../lib/day";
import { Card } from "../ui";

const DEFAULT = { lat: 48.8566, lon: 2.3522 }; // Paris si aucune ville n'est choisie

export function SunMoonCard({ city }: { city: City | null }) {
  const now = useClock(60_000);
  const { lat, lon } = city ?? DEFAULT;
  const sun = useMemo(() => sunTimes(now, lat, lon), [now, lat, lon]);
  const yesterday = useMemo(() => sunTimes(new Date(now.getTime() - 86_400_000), lat, lon), [now, lat, lon]);
  const m = useMemo(() => moon(now), [now]);
  const delta = sun.dayLengthMin - yesterday.dayLengthMin;

  // Position du soleil sur l'arc (0 = lever, 1 = coucher).
  let pos: number | null = null;
  if (sun.sunrise && sun.sunset) {
    pos = (now.getTime() - sun.sunrise.getTime()) / (sun.sunset.getTime() - sun.sunrise.getTime());
  }
  const visible = pos !== null && pos >= 0 && pos <= 1;
  const p = Math.min(1, Math.max(0, pos ?? 0));
  const x = 20 + p * 260;
  const y = 92 - Math.sin(p * Math.PI) * 74;

  return (
    <Card title="Soleil et lune" icon={Sunrise} sub={city ? city.name : "Paris (par défaut)"}>
      <svg className="sun-arc" viewBox="0 0 300 110" role="img" aria-label="Course du soleil">
        <defs>
          <linearGradient id="arc" x1="0" x2="1">
            <stop offset="0" stopColor="#ff7a18" stopOpacity="0.2" />
            <stop offset="0.5" stopColor="#ffd27a" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ff7a18" stopOpacity="0.2" />
          </linearGradient>
          <radialGradient id="sunglow">
            <stop offset="0" stopColor="#fff4d6" />
            <stop offset="0.4" stopColor="#ffc067" />
            <stop offset="1" stopColor="#ff8a1f" stopOpacity="0" />
          </radialGradient>
        </defs>
        <line x1="10" y1="92" x2="290" y2="92" stroke="rgba(255,200,140,0.18)" strokeWidth="1" />
        <path d="M20 92 Q150 -56 280 92" fill="none" stroke="url(#arc)" strokeWidth="2" strokeDasharray="3 5" />
        {visible ? (
          <>
            <circle cx={x} cy={y} r="16" fill="url(#sunglow)" />
            <circle cx={x} cy={y} r="5.5" fill="#fff4d6" />
          </>
        ) : (
          <text x="150" y="70" textAnchor="middle" fill="#8d8070" fontSize="12">
            Le soleil est couché
          </text>
        )}
      </svg>
      <div className="stat-row three">
        <div className="stat">
          <span>Lever</span>
          <strong>{hhmm(sun.sunrise)}</strong>
        </div>
        <div className="stat">
          <span>Coucher</span>
          <strong>{hhmm(sun.sunset)}</strong>
        </div>
        <div className="stat">
          <span>Durée</span>
          <strong>{duration(sun.dayLengthMin)}</strong>
        </div>
      </div>
      <p className="card-note">
        {delta === 0 ? "Même durée qu'hier." : `${Math.abs(delta)} min de ${delta > 0 ? "plus" : "moins"} qu'hier.`}
      </p>
      <div className="moon-row">
        <span className="moon-emoji" aria-hidden>
          {m.emoji}
        </span>
        <div className="grow">
          <strong>{m.name}</strong>
          <small>
            Éclairée à {Math.round(m.illumination * 100)} % · pleine lune le{" "}
            {m.nextFull.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
          </small>
        </div>
      </div>
    </Card>
  );
}
