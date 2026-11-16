/**
 * « Un club APEX » — plan isométrique interactif (SVG procédural).
 * Chaque zone est focusable au clavier ; survol, focus ou clic
 * met à jour le panneau d'information (aria-live).
 * Choix technique : SVG isométrique plutôt que WebGL → léger, net,
 * accessible et lisible sur mobile.
 */
import { useMemo, useState } from 'react';
import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import PhotoSlot from '../components/PhotoSlot';

const S = 17; // pixels par mètre
const COS = Math.cos(Math.PI / 6);
const iso = (x: number, y: number, z = 0): [number, number] => [(x - y) * COS * S, (x + y) * 0.5 * S - z * S];
const pts = (arr: [number, number][]) => arr.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');

type Box = { x: number; y: number; w: number; d: number; h: number; z?: number; tone?: 'dark' | 'signal' | 'data' | 'glass' | 'mat'; ring?: boolean };
type Zone = { id: string; name: string; area: number; x: number; y: number; w: number; d: number; desc: string; items: string[]; boxes: Box[] };

const machines: Box[] = [];
for (let i = 0; i < 6; i++) for (const y of [1.6, 5.4]) machines.push({ x: 7.2 + i * 2.1, y, w: 1.1, d: 1.5, h: 1.7, tone: 'dark', ring: true });

const ZONES: Zone[] = [
  {
    id: 'vestiaires', name: 'Vestiaires & sanitaires', area: 30, x: 0, y: 0, w: 6, d: 5,
    desc: 'Casiers connectés ouverts avec l\'appli, douches, cabine accessible PMR.',
    items: ['Casiers sans clé', 'Douches individuelles', 'Accès PMR'],
    boxes: [{ x: 0.3, y: 0.3, w: 5.4, d: 0.7, h: 2.0 }, { x: 1, y: 2.6, w: 3.6, d: 0.5, h: 0.45, tone: 'mat' }],
  },
  {
    id: 'coaching', name: 'Studio coaching augmenté', area: 36, x: 0, y: 5, w: 6, d: 6,
    desc: 'Bilans, petits groupes et suivi rééducation avec les kinés partenaires. Le coach pilote ses adhérents depuis son tableau de bord.',
    items: ['Bilan d\'entrée', 'Small group (6 pers.)', 'Partenariats santé'],
    boxes: [{ x: 0.4, y: 5.4, w: 0.2, d: 5.2, h: 2.2, tone: 'glass' }, { x: 1.4, y: 6.3, w: 3.4, d: 1.4, h: 0.06, tone: 'mat' }, { x: 1.4, y: 8.4, w: 3.4, d: 1.4, h: 0.06, tone: 'mat' }, { x: 0.65, y: 7.3, w: 0.15, d: 1.6, h: 1.4, tone: 'data' }],
  },
  {
    id: 'circuit', name: 'Circuit de machines connectées', area: 126, x: 6, y: 0, w: 14, d: 9,
    desc: '12 machines qui se règlent seules : poussée, tirage, jambes, gainage. Chaque poste porte son QR code et son anneau lumineux.',
    items: ['12 postes connectés', 'Réglage automatique', 'Circuit guidé par l\'appli'],
    boxes: machines,
  },
  {
    id: 'accueil', name: 'Accueil & onboarding', area: 24, x: 0, y: 11, w: 6, d: 4,
    desc: 'Pas de comptoir de vente : un espace chaleureux où l\'on installe l\'appli et réalise son premier scan accompagné.',
    items: ['Borne d\'inscription', 'Premier scan accompagné', 'Accès badge 6 h – 23 h'],
    boxes: [{ x: 1, y: 12.3, w: 3, d: 1, h: 1.05 }, { x: 4.6, y: 13.2, w: 0.5, d: 0.5, h: 1.7, tone: 'signal' }],
  },
  {
    id: 'libre', name: 'Espace libre', area: 84, x: 6, y: 9, w: 14, d: 6,
    desc: 'Échauffement, mobilité, cardio et poids du corps, guidés par l\'appli et l\'écran mural.',
    items: ['Tapis et petit matériel', 'Zone cardio', 'Écran de séances guidées'],
    boxes: [{ x: 8, y: 10.5, w: 4.5, d: 3, h: 0.05, tone: 'mat' }, { x: 14, y: 10.5, w: 1.2, d: 2.2, h: 1.3 }, { x: 16.2, y: 10.5, w: 1.2, d: 2.2, h: 1.3 }, { x: 18.6, y: 10.2, w: 0.8, d: 3.8, h: 1.9, tone: 'glass' }],
  },
];

const FACE = {
  dark: ['#2a323d', '#161b22', '#0f1318'],
  signal: ['#B8FF3C', '#7fb320', '#5e8615'],
  data: ['#3CE0FF', '#1d9db5', '#157a8d'],
  glass: ['rgba(60,224,255,0.25)', 'rgba(60,224,255,0.12)', 'rgba(60,224,255,0.08)'],
  mat: ['#232b36', '#1a2029', '#141920'],
} as const;

function IsoBox({ b }: { b: Box }) {
  const { x, y, w, d, h, z = 0, tone = 'dark', ring } = b;
  const [top, left, right] = FACE[tone];
  return (
    <g>
      <polygon points={pts([iso(x, y + d, z), iso(x + w, y + d, z), iso(x + w, y + d, z + h), iso(x, y + d, z + h)])} fill={left} />
      <polygon points={pts([iso(x + w, y, z), iso(x + w, y + d, z), iso(x + w, y + d, z + h), iso(x + w, y, z + h)])} fill={right} />
      <polygon points={pts([iso(x, y, z + h), iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x, y + d, z + h)])} fill={top} />
      {ring && (
        // anneau lumineux sur le dessus des machines connectées
        <ellipse cx={iso(x + w / 2, y + d / 2, z + h)[0]} cy={iso(x + w / 2, y + d / 2, z + h)[1]} rx={w * S * 0.42} ry={w * S * 0.22} fill="none" stroke="#B8FF3C" strokeWidth="1.6" />
      )}
    </g>
  );
}

export default function ClubPlan() {
  const [active, setActive] = useState('circuit');
  const zone = ZONES.find((z) => z.id === active)!;

  const ordered = useMemo(() => [...ZONES].sort((a, b) => a.x + a.y + (a.w + a.d) / 2 - (b.x + b.y + (b.w + b.d) / 2)), []);
  const [minX, minY] = [iso(0, 15)[0] - 20, iso(0, 0, 3.2)[1] - 20];
  const vbW = iso(20, 0)[0] - minX + 20;
  const vbH = iso(20, 15)[1] - minY + 20;

  return (
    <section aria-labelledby="club-title" className="section relative border-t border-bone/5">
      <div className="container-apex">
        <SectionHeading
          id="club-title"
          eyebrow="Un club APEX"
          title={<>300 m², cinq zones, <span className="text-signal">zéro temps perdu.</span></>}
          lead={<>Le format Smart Studio tient sur 250 à 400 m². Survolez ou parcourez au clavier chaque zone de ce plan type. <span className="tag-hyp">Plan illustratif</span></>}
        />
        <div className="grid items-start gap-8 lg:grid-cols-[1.5fr_1fr]">
          <Reveal className="glass overflow-hidden p-2 sm:p-4">
            <svg viewBox={`${minX} ${minY} ${vbW} ${vbH}`} className="h-auto w-full" role="group" aria-label="Plan isométrique d'un club APEX FITNESS">
              {/* murs du fond */}
              <polygon points={pts([iso(0, 0), iso(20, 0), iso(20, 0, 3), iso(0, 0, 3)])} fill="#151A22" stroke="rgba(244,246,248,0.08)" />
              <polygon points={pts([iso(0, 0), iso(0, 15), iso(0, 15, 3), iso(0, 0, 3)])} fill="#11151b" stroke="rgba(244,246,248,0.08)" />
              {/* logo mural */}
              <path d={(() => { const c = iso(13, 0, 2); return `M${c[0] - 18} ${c[1] + 8} A 22 14 0 1 1 ${c[0] + 18} ${c[1] + 8}`; })()} fill="none" stroke="#B8FF3C" strokeWidth="2.5" opacity=".7" />

              {ordered.map((z) => {
                const on = z.id === active;
                return (
                  <g
                    key={z.id}
                    tabIndex={0}
                    role="button"
                    aria-pressed={on}
                    aria-label={`${z.name}, ${z.area} m²`}
                    onMouseEnter={() => setActive(z.id)}
                    onFocus={() => setActive(z.id)}
                    onClick={() => setActive(z.id)}
                    className="cursor-pointer outline-none"
                  >
                    <polygon
                      points={pts([iso(z.x, z.y), iso(z.x + z.w, z.y), iso(z.x + z.w, z.y + z.d), iso(z.x, z.y + z.d)])}
                      fill={on ? 'rgba(184,255,60,0.10)' : 'rgba(30,37,48,0.85)'}
                      stroke={on ? '#B8FF3C' : 'rgba(244,246,248,0.14)'}
                      strokeWidth={on ? 2 : 1}
                      className="transition-all duration-300"
                    />
                    {[...z.boxes].sort((a, b) => a.x + a.y - (b.x + b.y)).map((b, i) => <IsoBox key={i} b={b} />)}
                  </g>
                );
              })}
              {/* étiquette de la zone active */}
              {(() => {
                const [cx, cy] = iso(zone.x + zone.w / 2, zone.y + zone.d / 2, 2.8);
                return (
                  <g pointerEvents="none">
                    <line x1={cx} y1={cy} x2={cx} y2={cy + 34} stroke="#B8FF3C" strokeDasharray="2 3" />
                    <rect x={cx - 64} y={cy - 26} width="128" height="26" rx="8" fill="#0A0D12" stroke="#B8FF3C" />
                    <text x={cx} y={cy - 9} textAnchor="middle" fill="#F4F6F8" fontSize="11" fontFamily="JetBrains Mono, monospace">{zone.name.split(' ')[0].toUpperCase()} · {zone.area} m²</text>
                  </g>
                );
              })()}
            </svg>
          </Reveal>

          <div className="flex flex-col gap-4">
            <div className="glass p-6" aria-live="polite">
              <p className="font-mono text-xs uppercase tracking-widest text-data">{zone.area} m² · zone</p>
              <h3 className="mt-2 text-2xl font-semibold">{zone.name}</h3>
              <p className="mt-3 text-mute">{zone.desc}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {zone.items.map((it) => (
                  <li key={it} className="rounded-pill border border-bone/15 px-3 py-1 text-sm">{it}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Choisir une zone">
              {ZONES.map((z) => (
                <button key={z.id} type="button" onClick={() => setActive(z.id)} aria-pressed={z.id === active} className={`rounded-pill border px-3 py-2 text-sm transition-colors ${z.id === active ? 'border-signal bg-signal text-carbon' : 'border-bone/15 text-mute hover:text-bone'}`}>
                  {z.name.split(' ')[0]}
                </button>
              ))}
            </div>
            <PhotoSlot label="Vue intérieure d'un club pilote (circuit machines)" ratio="aspect-[16/9]" />
          </div>
        </div>
      </div>
    </section>
  );
}
