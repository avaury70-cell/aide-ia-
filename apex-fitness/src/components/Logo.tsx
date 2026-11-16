/**
 * LOGO APEX FITNESS v2 — même concept (anneau de résistance ouvert + coin de QR),
 * redessiné pour le style « blocs » : traits plus épais, couleurs Orange Énergie / Vert Go.
 *
 *  A · Orbite  : anneau ouvert, un repère QR loge dans l'ouverture.
 *  B · Sommet  : (RECOMMANDÉE) l'anneau s'ouvre au sommet, un « A » en chevron le traverse.
 *  C · Coin    : un coin de repère QR qui se prolonge en arc de résistance.
 *
 * Tons : dark (fond sombre), light (fond clair), mono (currentColor), block (symbole blanc sur pavé orange).
 */
export type Piste = 'A' | 'B' | 'C';
export type Tone = 'dark' | 'light' | 'mono' | 'block';

const TONES: Record<Tone, { base: string; accent: string; dot: string; plate?: string }> = {
  dark: { base: '#F8FAFC', accent: '#F97316', dot: '#22C55E' },
  light: { base: '#0F172A', accent: '#C2410C', dot: '#15803D' },
  mono: { base: 'currentColor', accent: 'currentColor', dot: 'currentColor' },
  block: { base: '#0F172A', accent: '#0F172A', dot: '#F8FAFC', plate: '#F97316' },
};

export function MarkPaths({ piste, tone }: { piste: Piste; tone: Tone }) {
  const c = TONES[tone];
  const s = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const plate = c.plate ? <rect width="64" height="64" rx="12" fill={c.plate} /> : null;
  // en version « block », le dessin est réduit pour laisser une marge dans le pavé
  const wrap = (children: React.ReactNode) => (c.plate ? <>{plate}<g transform="translate(8 8) scale(0.75)">{children}</g></> : <>{children}</>);
  if (piste === 'A')
    return wrap(
      <>
        <path d="M53.67 35.82 A22 22 0 1 1 35.82 10.33" stroke={c.base} strokeWidth={7} {...s} />
        <rect x="41" y="7" width="17" height="17" rx="3" stroke={c.accent} strokeWidth={4.5} fill="none" />
        <rect x="46.5" y="12.5" width="6" height="6" rx="1" fill={c.dot} />
      </>,
    );
  if (piste === 'C')
    return wrap(
      <>
        <path d="M10 28 L10 16 Q10 10 16 10 L32 10 A22 22 0 1 1 11.33 39.52" stroke={c.base} strokeWidth={7} {...s} />
        <rect x="25" y="25" width="14" height="14" rx="2" fill={c.accent} />
        <rect x="45" y="45" width="6" height="6" rx="1" fill={c.dot} />
      </>,
    );
  return wrap(
    <>
      <path d="M44 13.22 A24 24 0 1 1 20 13.22" stroke={c.base} strokeWidth={6.5} {...s} />
      <path d="M16 45 L32 4 L48 45" stroke={c.accent} strokeWidth={6.5} {...s} />
      <rect x="28.5" y="29.5" width="7" height="7" rx="1.2" fill={c.dot} />
    </>,
  );
}

export function LogoMark({ piste = 'B', tone = 'dark', size = 36, title }: { piste?: Piste; tone?: Tone; size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ flexShrink: 0 }} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <MarkPaths piste={piste} tone={tone} />
    </svg>
  );
}

/** Logo complet : symbole + logotype en Barlow Condensed (APEX en capitales grasses, FITNESS espacé). */
export default function Logo({ piste = 'B', tone = 'dark', size = 36 }: { piste?: Piste; tone?: Tone; size?: number }) {
  const text = tone === 'light' ? 'text-ink' : tone === 'mono' ? '' : 'text-fg';
  return (
    <span className={`inline-flex items-center gap-2.5 ${text}`}>
      <LogoMark piste={piste} tone={tone} size={size} />
      <span className="flex flex-col font-display uppercase leading-none">
        <span className="text-[1.55em] font-extrabold tracking-[0.02em]">APEX</span>
        <span className={`text-[0.62em] font-semibold tracking-[0.5em] ${tone === 'dark' ? 'text-primary-soft' : ''}`}>Fitness</span>
      </span>
    </span>
  );
}
