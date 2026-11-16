/**
 * APEX FITNESS — DESIGN TOKENS (v2, refonte « Vibrant & Block-based »)
 * ---------------------------------------------------------------
 * Source : skill UI/UX Pro Max (design-system/apex-fitness/MASTER.md),
 * corrigée pour l'accessibilité (contrastes WCAG AA vérifiés, voir /charte).
 * Fichier unique consommé par Tailwind, les scènes 3D et la page /charte.
 */

/** Couleurs de marque, avec nom et rôle (affichées dans le brand book). */
export const palette = {
  primary: { hex: '#F97316', name: 'Orange Énergie', role: 'Couleur de marque, blocs, grands titres' },
  accent: { hex: '#22C55E', name: 'Vert Go', role: 'Boutons d\'action (CTA), réussite' },
  bg: { hex: '#1F2937', name: 'Ardoise', role: 'Fond principal' },
  ink: { hex: '#0F172A', name: 'Encre', role: 'Fond profond, texte sur couleur' },
  fg: { hex: '#F8FAFC', name: 'Craie', role: 'Texte principal' },
} as const;

export const tokens = {
  color: {
    primary: palette.primary.hex,
    'primary-soft': '#FB923C', // orange pour petits textes sur cartes (≥ 5:1)
    accent: palette.accent.hex,
    'accent-soft': '#4ADE80', // vert pour petits textes (≥ 5,9:1)
    bg: palette.bg.hex,
    ink: palette.ink.hex,
    card: '#313742',
    muted: '#37414F',
    line: '#374151', // bordures
    fg: palette.fg.hex,
    'fg-muted': '#CBD5E1', // texte secondaire (≥ 6,9:1)
    faint: '#94A3B8', // texte tertiaire, seulement sur bg/ink (≥ 5,7:1)
    danger: '#EF4444', // aplats d'erreur (texte noir dessus)
    'danger-soft': '#FCA5A5', // texte d'erreur sur fonds sombres
  },
  font: {
    display: ['"Barlow Condensed"', 'Impact', 'sans-serif'],
    sans: ['Barlow', 'system-ui', 'sans-serif'],
  },
  radius: { card: '16px', control: '8px', pill: '999px' },
  space: { section: 'clamp(4.5rem, 9vw, 8rem)' },
  shadow: {
    md: '0 4px 6px rgba(0,0,0,0.1)',
    lg: '0 10px 15px rgba(0,0,0,0.15)',
    xl: '0 20px 25px rgba(0,0,0,0.25)',
    block: '6px 6px 0 0 #0F172A', // ombre « bloc » décalée, signature du style
    'block-primary': '6px 6px 0 0 #F97316',
  },
  layout: { contentMax: '1240px' },
  motion: { ease: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fast: '200ms', base: '350ms' },
} as const;

/** Variables CSS dérivées des tokens (injectées dans :root par Tailwind). */
export function cssVariables(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [k, v] of Object.entries(tokens.color)) vars[`--c-${k}`] = v;
  vars['--ease-apex'] = tokens.motion.ease;
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
