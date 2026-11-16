/**
 * LOGO APEX FITNESS — 3 pistes créatives, toutes fondées sur
 * « l'anneau de résistance ouvert » + « le coin de QR code ».
 *
 *  A · Orbite  : anneau ouvert à 270°, un repère QR loge dans l'ouverture.
 *  B · Sommet  : (RECOMMANDÉE) l'anneau s'ouvre au sommet, un « A » en chevron
 *                le traverse — on dépasse sa limite. Le point de scan (pixel QR)
 *                remplace la barre du A.
 *  C · Coin    : un coin de repère QR qui se prolonge en arc de résistance.
 *
 * Tons : dark (sur fond sombre), light (sur fond clair), mono (currentColor).
 */
export type Piste = 'A' | 'B' | 'C';
export type Tone = 'dark' | 'light' | 'mono';

const TONES: Record<Tone, { base: string; accent: string; dot: string }> = {
  dark: { base: '#F4F6F8', accent: '#B8FF3C', dot: '#3CE0FF' },
  light: { base: '#0A0D12', accent: '#3F6600', dot: '#006478' },
  mono: { base: 'currentColor', accent: 'currentColor', dot: 'currentColor' },
};

export function MarkPaths({ piste, tone }: { piste: Piste; tone: Tone }) {
  const c = TONES[tone];
  const common = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (piste === 'A')
    return (
      <>
        <path d="M53.67 35.82 A22 22 0 1 1 35.82 10.33" stroke={c.base} strokeWidth={5.5} {...common} />
        <rect x="42" y="8" width="16" height="16" rx="3" stroke={c.accent} strokeWidth={3.5} fill="none" />
        <rect x="47" y="13" width="6" height="6" rx="1" fill={c.dot} />
      </>
    );
  if (piste === 'C')
    return (
      <>
        <path d="M10 28 L10 16 Q10 10 16 10 L32 10 A22 22 0 1 1 11.33 39.52" stroke={c.base} strokeWidth={5.5} {...common} />
        <rect x="26" y="26" width="12" height="12" rx="2" fill={c.accent} />
        <rect x="45" y="45" width="5" height="5" rx="1" fill={c.dot} />
      </>
    );
  // Piste B — Sommet
  return (
    <>
      <path d="M44 13.22 A24 24 0 1 1 20 13.22" stroke={c.base} strokeWidth={5} {...common} />
      <path d="M17 44 L32 5 L47 44" stroke={c.accent} strokeWidth={5} {...common} />
      <rect x="29" y="30" width="6" height="6" rx="1.2" fill={c.dot} />
    </>
  );
}

export function LogoMark({
  piste = 'B',
  tone = 'dark',
  size = 36,
  title,
}: {
  piste?: Piste;
  tone?: Tone;
  size?: number;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ flexShrink: 0 }}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <MarkPaths piste={piste} tone={tone} />
    </svg>
  );
}

/** Logo complet (symbole + logotype). Le logotype est en Space Grotesk / JetBrains Mono. */
export default function Logo({ piste = 'B', tone = 'dark', size = 34 }: { piste?: Piste; tone?: Tone; size?: number }) {
  const text = tone === 'light' ? 'text-carbon' : tone === 'mono' ? '' : 'text-bone';
  return (
    <span className={`inline-flex items-center gap-2.5 ${text}`}>
      <LogoMark piste={piste} tone={tone} size={size} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.35em] font-bold tracking-[0.06em]">APEX</span>
        <span className="mt-0.5 font-mono text-[0.6em] tracking-[0.42em] opacity-80">FITNESS</span>
      </span>
    </span>
  );
}
