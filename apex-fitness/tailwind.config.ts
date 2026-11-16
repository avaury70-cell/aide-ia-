import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';
import { tokens, cssVariables } from './src/design/tokens';

/**
 * Tailwind consomme les design tokens (source unique : src/design/tokens.ts).
 * Les mêmes valeurs sont injectées en variables CSS (:root) pour le CSS pur.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: tokens.color,
      fontFamily: Object.fromEntries(Object.entries(tokens.font).map(([k, v]) => [k, [...v]])),
      borderRadius: tokens.radius,
      boxShadow: tokens.shadow,
      maxWidth: { content: tokens.layout.contentMax },
      spacing: tokens.space,
      transitionTimingFunction: { apex: tokens.motion.ease },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({ ':root': cssVariables() });
    }),
  ],
} satisfies Config;
