/**
 * APEX FITNESS — DESIGN TOKENS
 * ---------------------------------------------------------------
 * Fichier unique de référence : couleurs, typographies, rayons,
 * espacements, ombres, mouvement. Consommé par :
 *  - tailwind.config.ts (classes utilitaires)
 *  - les scènes 3D (matériaux three.js)
 *  - la page /charte (brand book interactif)
 * Toute modification de la marque se fait ICI.
 */

export const palette = {
  carbon: { hex: '#0A0D12', name: 'Noir carbone', role: 'Fond principal' },
  graphite: { hex: '#151A22', name: 'Graphite', role: 'Surfaces, cartes' },
  bone: { hex: '#F4F6F8', name: 'Blanc os', role: 'Texte principal, fond clair' },
  signal: { hex: '#B8FF3C', name: 'Signal', role: 'CTA, éléments actifs' },
  data: { hex: '#3CE0FF', name: 'Data', role: 'Graphiques, connexions' },
} as const;

export const tokens = {
  color: {
    carbon: palette.carbon.hex,
    graphite: palette.graphite.hex,
    'graphite-2': '#1E2530', // surface surélevée
    steel: '#2A3340', // bordures pleines, pistes de sliders
    bone: palette.bone.hex,
    mute: '#A3ADBB', // texte secondaire (≥ 7:1 sur carbone)
    faint: '#8590A0', // texte tertiaire (≥ 5:1 sur carbone et graphite)
    signal: palette.signal.hex,
    'signal-deep': '#3F6600', // Signal pour fonds clairs (≥ 6:1 sur Blanc os)
    data: palette.data.hex,
    'data-deep': '#006478', // Data pour fonds clairs
    alert: '#FF7A6B', // erreurs, résultat négatif (toujours avec icône + texte)
  },
  font: {
    display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
  },
  radius: { card: '16px', control: '12px', pill: '999px' },
  space: { section: 'clamp(5rem, 10vw, 9rem)', gutter: '1rem' },
  shadow: {
    glass: '0 1px 0 0 rgba(244,246,248,0.06) inset, 0 24px 48px -24px rgba(0,0,0,0.6)',
    signal: '0 0 0 1px rgba(184,255,60,0.35), 0 12px 40px -12px rgba(184,255,60,0.45)',
  },
  layout: { contentMax: '1200px' },
  motion: { ease: 'cubic-bezier(0.22, 1, 0.36, 1)', fast: '180ms', base: '420ms', slow: '900ms' },
} as const;

/** Variables CSS dérivées des tokens (injectées dans :root par Tailwind). */
export function cssVariables(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [k, v] of Object.entries(tokens.color)) vars[`--c-${k}`] = v;
  vars['--ease-apex'] = tokens.motion.ease;
  vars['--radius-card'] = tokens.radius.card;
  return vars;
}

/** Ratio de contraste WCAG 2.x entre deux couleurs hex. */
export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const n = parseInt(hex.replace('#', ''), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
