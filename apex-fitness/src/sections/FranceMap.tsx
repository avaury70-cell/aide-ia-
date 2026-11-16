/**
 * Carte de France des zones disponibles — SVG procédural en grille de points.
 * Les marqueurs sont des boutons accessibles au clavier ; une liste textuelle
 * équivalente est fournie. Statuts fictifs.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionHeading, { Hl } from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';
import { CITIES, CORSICA, MAINLAND, STATUS_LABEL, type City, type ZoneStatus } from '../data/zones';

const K = 40;
const proj = (lon: number, lat: number): [number, number] => [(lon + 5.3) * 0.69 * K, (51.4 - lat) * K];
// statut toujours doublé d'un libellé (jamais la couleur seule)
const COLORS: Record<ZoneStatus, string> = { dispo: '#22C55E', discussion: '#F97316', attribuee: '#94A3B8' };

function inside(pt: [number, number], poly: [number, number][]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** Préremplit le formulaire avec la ville choisie. */
export const ZONE_EVENT = 'apex:zone';

export default function FranceMap() {
  const [filter, setFilter] = useState<ZoneStatus | 'all'>('all');
  const [sel, setSel] = useState<City>(CITIES.find((c) => c.name === 'Nantes')!);
  const navigate = useNavigate();

  const dots = useMemo(() => {
    const m = MAINLAND.map(([a, b]) => proj(a, b));
    const c = CORSICA.map(([a, b]) => proj(a, b));
    const out: [number, number][] = [];
    for (let x = 0; x < 440; x += 9) for (let y = 0; y < 420; y += 9) if (inside([x, y], m) || inside([x, y], c)) out.push([x, y]);
    return out;
  }, []);

  const visible = CITIES.filter((c) => filter === 'all' || c.status === filter);
  const choose = (c: City) => {
    window.dispatchEvent(new CustomEvent(ZONE_EVENT, { detail: c.name }));
    navigate('/#candidature');
  };

  return (
    <section id="zones" aria-labelledby="zones-title" className="relative bg-ink py-section">
      <div className="container-apex">
        <SectionHeading id="zones-title" eyebrow="Zones disponibles" title={<>Où ouvrir <Hl tone="accent">votre</Hl> club ?</>} lead={<>Nous privilégions les agglomérations où la demande et l'accès sont favorables. <span className="tag-hyp">Statuts fictifs</span></>} />
        <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]">
          <Reveal className="relative rounded-[20px] border-2 border-line bg-bg p-4">
            <svg viewBox="0 0 440 420" className="h-auto w-full" role="group" aria-label="Carte de France des zones d'implantation">
              {dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={1.6} fill="rgba(248,250,252,0.22)" />)}
              {visible.map((c) => {
                const [x, y] = proj(c.lon, c.lat);
                const on = sel.name === c.name;
                return (
                  <g key={c.name} role="button" tabIndex={0} aria-pressed={on} aria-label={`${c.name} — ${STATUS_LABEL[c.status]}`} className="cursor-pointer outline-none [&:focus-visible>circle:first-child]:stroke-[#FB923C]" onClick={() => setSel(c)} onMouseEnter={() => setSel(c)} onFocus={() => setSel(c)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), choose(c))}>
                    <circle cx={x} cy={y} r={14} fill="transparent" stroke="transparent" strokeWidth="2" />
                    {on && <circle cx={x} cy={y} r={11} fill="none" stroke={COLORS[c.status]} strokeOpacity=".5"><animate attributeName="r" values="7;14;7" dur="2s" repeatCount="indefinite" /></circle>}
                    <circle cx={x} cy={y} r={on ? 6 : 4.5} fill={COLORS[c.status]} stroke="#0F172A" strokeWidth="2.5" />
                    {on && <text x={x + 10} y={y - 8} fill="#F8FAFC" fontSize="16" fontFamily="Barlow Condensed, sans-serif" fontWeight="700" stroke="#1F2937" strokeWidth="4" paintOrder="stroke">{c.name.toUpperCase()}</text>}
                  </g>
                );
              })}
            </svg>
          </Reveal>

          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par statut">
              {(['all', 'dispo', 'discussion', 'attribuee'] as const).map((s) => (
                <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)} className={`inline-flex min-h-[44px] items-center gap-2 rounded-control border-2 px-4 font-display text-lg font-bold uppercase transition-colors duration-200 ${filter === s ? 'border-fg bg-fg text-ink' : 'border-line text-fg-muted hover:border-fg/60 hover:text-fg'}`}>
                  {s !== 'all' && <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[s] }} />}
                  {s === 'all' ? 'Toutes' : STATUS_LABEL[s]} <span className="text-sm opacity-75">{s === 'all' ? CITIES.length : CITIES.filter((c) => c.status === s).length}</span>
                </button>
              ))}
            </div>
            <div className="block-card border-2" aria-live="polite">
              <p className="inline-flex items-center gap-2 rounded-[4px] px-2 py-1 font-display text-sm font-bold uppercase tracking-wider text-ink" style={{ background: COLORS[sel.status] }}>
                <Icon name="pin" size={16} /> {STATUS_LABEL[sel.status]}
              </p>
              <h3 className="mt-3 text-5xl">{sel.name}</h3>
              <p className="mt-2 text-fg-muted">
                {sel.status === 'dispo' && 'Zone ouverte aux candidatures. Une étude d\'implantation est réalisée avec vous.'}
                {sel.status === 'discussion' && 'Un projet est à l\'étude. Vous pouvez vous positionner sur une zone voisine ou en second club.'}
                {sel.status === 'attribuee' && 'Zone attribuée à un franchisé. D\'autres secteurs de l\'agglomération peuvent rester ouverts.'}
              </p>
              <button type="button" onClick={() => choose(sel)} className="btn-primary mt-5 w-full sm:w-auto">
                Candidater pour {sel.name} <Icon name="arrow" size={18} />
              </button>
            </div>
            <details className="rounded-control border-2 border-line px-4 py-3">
              <summary className="cursor-pointer font-semibold text-fg-muted">Liste des zones (version texte)</summary>
              <ul className="mt-3 grid grid-cols-2 gap-1">
                {CITIES.map((c) => <li key={c.name}><span className="text-fg">{c.name}</span> <span className="text-faint">— {STATUS_LABEL[c.status]}</span></li>)}
              </ul>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}
