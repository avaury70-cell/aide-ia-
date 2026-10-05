import type { CSSProperties } from "react";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

interface Props {
  state: OrbState;
  level?: number; // niveau du micro 0–1, fait « respirer » l'orbe pendant l'écoute
  size?: number;
  onClick?: () => void;
}

/** Orbe IA : sphère lumineuse à nappes de couleur, entourée d'orbites en rotation. */
export function Orb({ state, level = 0, size = 210, onClick }: Props) {
  const style = { "--size": `${size}px`, "--level": level } as CSSProperties;
  return (
    <div
      className="orb-wrap"
      data-state={state}
      style={style}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      aria-label={onClick ? "Parler à Aide" : undefined}
    >
      <div className="halo" />
      <div className="orbit">
        <svg viewBox="0 0 100 100">
          <defs>
            <linearGradient id="orbit-a" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffc067" stopOpacity="0.9" />
              <stop offset="0.5" stopColor="#ff8a1f" stopOpacity="0.15" />
              <stop offset="1" stopColor="#ff5a1f" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="49" fill="none" stroke="url(#orbit-a)" strokeWidth="0.35" />
          <circle cx="50" cy="1" r="1.3" fill="#ffe2a8" />
          <circle cx="50" cy="99" r="0.8" fill="#ffb36b" />
        </svg>
      </div>
      <div className="orbit reverse">
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.3" strokeDasharray="0.6 2.4" />
          <circle cx="99" cy="50" r="1.1" fill="#ff8c5a" />
        </svg>
      </div>
      <div className="orb" />
    </div>
  );
}
