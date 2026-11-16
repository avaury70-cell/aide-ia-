/**
 * Simulateur de rentabilité — calcul en direct à partir des hypothèses
 * de data/franchise.ts. Graphique : 3 barres annuelles (CA, charges, résultat),
 * étiquettes directes, infobulle au survol/focus, tableau détaillé en vue texte.
 */
import { useId, useMemo, useState } from 'react';
import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';
import { eur, simulate, simAssumptions, franchise } from '../data/franchise';

type SliderDef = { key: 'members' | 'price' | 'rent' | 'staff'; label: string; min: number; max: number; step: number; fmt: (v: number) => string };
const SLIDERS: SliderDef[] = [
  { key: 'members', label: "Nombre d'abonnés", min: 150, max: 1200, step: 10, fmt: (v) => v.toLocaleString('fr-FR') },
  { key: 'price', label: 'Prix mensuel moyen', min: 19, max: 69, step: 1, fmt: (v) => `${v} €` },
  { key: 'rent', label: 'Loyer mensuel HT', min: 2000, max: 12000, step: 100, fmt: (v) => eur(v) },
  { key: 'staff', label: 'Nombre de salariés', min: 1, max: 5, step: 1, fmt: (v) => `${v}` },
];

export default function Simulator() {
  const [input, setInput] = useState({ members: 600, price: 39, rent: 5500, staff: 2 });
  const r = useMemo(() => simulate(input), [input]);
  const annual = { ca: r.revenue * 12, charges: r.totalCharges * 12, result: r.result * 12 };
  const margin = r.revenue ? (r.result / r.revenue) * 100 : 0;

  return (
    <section id="simulateur" aria-labelledby="sim-title" className="section relative border-t border-bone/5">
      <div className="container-apex">
        <SectionHeading
          id="sim-title"
          eyebrow="Simulateur de rentabilité"
          title={<>Faites tourner <span className="text-signal">votre</span> club.</>}
          lead="Ajustez quatre curseurs : le compte de résultat estimé se met à jour en direct."
        />
        <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
          <Reveal className="glass flex flex-col gap-7 p-6 sm:p-8">
            {SLIDERS.map((s) => (
              <Slider key={s.key} def={s} value={input[s.key]} onChange={(v) => setInput((i) => ({ ...i, [s.key]: v }))} />
            ))}
            <div className="rounded-control border border-bone/10 bg-carbon/60 p-4 text-sm text-mute">
              <p className="mb-1 font-mono text-xs uppercase tracking-widest text-data">Point mort estimé</p>
              <p><strong className="font-mono text-2xl text-bone">{r.breakEven.toLocaleString('fr-FR')}</strong> abonnés pour couvrir les charges.</p>
            </div>
          </Reveal>

          <Reveal delay={100} className="glass flex flex-col gap-6 p-6 sm:p-8">
            <div className="grid grid-cols-3 gap-3">
              <Kpi label="CA annuel" value={eur(annual.ca)} />
              <Kpi label="Charges annuelles" value={eur(annual.charges)} />
              <Kpi label="Résultat annuel" value={eur(annual.result)} tone={annual.result >= 0 ? 'good' : 'bad'} sub={`marge ${margin.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`} />
            </div>
            <BarChart data={annual} />
            <details className="group rounded-control border border-bone/10">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-bone marker:hidden">
                <span className="inline-flex items-center gap-2">Voir le détail mensuel <span className="transition-transform group-open:rotate-90"><Icon name="arrow" size={16} /></span></span>
              </summary>
              <table className="w-full text-sm">
                <caption className="sr-only">Compte de résultat mensuel estimé</caption>
                <tbody className="font-mono">
                  <Row k="Abonnements" v={r.subs} />
                  <Row k={`Revenus annexes (${simAssumptions.ancillaryRate * 100} %)`} v={r.ancillary} />
                  <Row k="Chiffre d'affaires" v={r.revenue} strong />
                  {Object.entries(r.charges).map(([k, v]) => <Row key={k} k={k} v={-v} />)}
                  <Row k="Résultat avant impôt" v={r.result} strong />
                </tbody>
              </table>
            </details>
          </Reveal>
        </div>
        <p className="mt-6 flex gap-2 text-sm text-faint">
          <Icon name="alert" size={18} className="shrink-0 text-alert" />
          <span>
            <strong className="text-mute">Simulation indicative non contractuelle.</strong> Hypothèses pédagogiques : revenus annexes {simAssumptions.ancillaryRate * 100} % des abonnements, coût salarié {eur(simAssumptions.salaryCost)}/mois, location du parc machines {eur(simAssumptions.equipmentLease)}/mois, redevances {franchise.royaltyRate * 100} % + {franchise.marketingRate * 100} % du CA + plateforme {eur(franchise.platformFee)}/mois. Hors amortissements, emprunt et impôts. Ne constitue pas un prévisionnel.
          </span>
        </p>
      </div>
    </section>
  );
}

function Slider({ def, value, onChange }: { def: SliderDef; value: number; onChange: (v: number) => void }) {
  const id = useId();
  const fill = ((value - def.min) / (def.max - def.min)) * 100;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm text-mute">{def.label}</label>
        <output htmlFor={id} className="font-mono text-lg font-semibold text-bone">{def.fmt(value)}</output>
      </div>
      <input id={id} type="range" className="range" min={def.min} max={def.max} step={def.step} value={value} aria-valuetext={def.fmt(value)} style={{ ['--fill' as string]: `${fill}%` }} onChange={(e) => onChange(Number(e.target.value))} />
      <div className="flex justify-between font-mono text-[11px] text-faint" aria-hidden="true">
        <span>{def.fmt(def.min)}</span>
        <span>{def.fmt(def.max)}</span>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone, sub }: { label: string; value: string; tone?: 'good' | 'bad'; sub?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-mute sm:text-sm">{label}</p>
      <p className="font-mono text-base font-semibold text-bone sm:text-2xl">{value}</p>
      {sub && (
        <p className={`flex items-center gap-1 font-mono text-xs ${tone === 'bad' ? 'text-alert' : 'text-signal'}`}>
          <Icon name={tone === 'bad' ? 'alert' : 'check'} size={14} /> {sub}
        </p>
      )}
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: number; strong?: boolean }) {
  return (
    <tr className={`border-t border-bone/5 ${strong ? 'text-bone' : 'text-mute'}`}>
      <th scope="row" className={`px-4 py-2 text-left font-sans ${strong ? 'font-semibold' : 'font-normal'}`}>{k}</th>
      <td className={`px-4 py-2 text-right ${v < 0 ? '' : ''} ${strong ? 'font-semibold' : ''}`}>{eur(v)}</td>
    </tr>
  );
}

/** Graphique en barres — une seule échelle, étiquettes directes, infobulles. */
function BarChart({ data }: { data: { ca: number; charges: number; result: number } }) {
  const [hover, setHover] = useState<number | null>(null);
  const bars = [
    { label: 'CA', value: data.ca, color: '#3CE0FF' },
    { label: 'Charges', value: data.charges, color: '#5E6A7A' },
    { label: 'Résultat', value: data.result, color: data.result >= 0 ? '#B8FF3C' : '#FF7A6B' },
  ];
  const W = 420, H = 230, base = 170, top = 18;
  const max = Math.max(data.ca, data.charges, 1);
  const neg = Math.min(0, data.result);
  const scale = (base - top) / max;
  const negRoom = H - base - 22;
  const bw = 56, gap = (W - bw * 3) / 4;

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`CA annuel ${eur(data.ca)}, charges ${eur(data.charges)}, résultat ${eur(data.result)}`}>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1="0" x2={W} y1={base - g * (base - top)} y2={base - g * (base - top)} stroke="rgba(244,246,248,0.06)" />
        ))}
        {bars.map((b, i) => {
          const x = gap + i * (bw + gap);
          const hgt = b.value >= 0 ? b.value * scale : Math.min(negRoom, Math.abs(b.value) * scale);
          const y = b.value >= 0 ? base - hgt : base;
          const r = Math.min(4, hgt / 2);
          // barre aux extrémités arrondies côté donnée, ancrée sur la ligne de base
          const d = b.value >= 0
            ? `M${x},${base} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${base} Z`
            : `M${x},${base} V${base + hgt - r} Q${x},${base + hgt} ${x + r},${base + hgt} H${x + bw - r} Q${x + bw},${base + hgt} ${x + bw},${base + hgt - r} V${base} Z`;
          return (
            <g key={b.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} tabIndex={0} onFocus={() => setHover(i)} onBlur={() => setHover(null)} aria-label={`${b.label} : ${eur(b.value)}`} role="img" className="outline-none">
              <rect x={x - gap / 2} y={0} width={bw + gap} height={H} fill="transparent" />
              <path d={d} fill={b.color} opacity={hover === null || hover === i ? 1 : 0.45} style={{ transition: 'd 0.5s cubic-bezier(0.22,1,0.36,1), opacity .2s' }} />
              <text x={x + bw / 2} y={b.value >= 0 ? y - 6 : base + hgt + 14} textAnchor="middle" fill="#F4F6F8" fontSize="11" fontFamily="JetBrains Mono, monospace">
                {Math.round(b.value / 1000).toLocaleString('fr-FR')} k€
              </text>
              <text x={x + bw / 2} y={H - 4} textAnchor="middle" fill="#A3ADBB" fontSize="12" fontFamily="Inter, sans-serif">{b.label}</text>
            </g>
          );
        })}
        <line x1="0" x2={W} y1={base} y2={base} stroke="rgba(244,246,248,0.35)" />
        {neg < 0 && <text x={W - 4} y={base - 6} textAnchor="end" fill="#FF7A6B" fontSize="11" fontFamily="Inter, sans-serif">⚠ résultat négatif</text>}
        {hover !== null && (
          <g pointerEvents="none">
            <rect x={W / 2 - 90} y={2} width={180} height={24} rx={6} fill="#0A0D12" stroke="rgba(244,246,248,0.2)" />
            <text x={W / 2} y={18} textAnchor="middle" fill="#F4F6F8" fontSize="12" fontFamily="JetBrains Mono, monospace">{bars[hover].label} : {eur(bars[hover].value)}</text>
          </g>
        )}
      </svg>
      <figcaption className="mt-2 text-xs text-faint">Montants annuels estimés (× 12 mois), en euros HT.</figcaption>
    </figure>
  );
}
