# APEX FITNESS — site de recrutement de franchisés

> **Projet pédagogique fictif — Cnam Versailles, LCVM, ESC 132 (stratégie de communication multicanale).**
> Marque, réseau et chiffres imaginaires. Les données économiques sont des *hypothèses pédagogiques* ; les chiffres de marché sont marqués `[À SOURCER]`.

**Promesse :** Le sport qui s'adapte à toi. · **Baseline :** Scanne. Pousse. La machine s'occupe du reste.

## Lancer le projet

Prérequis : Node.js 18 ou plus récent.

```bash
cd apex-fitness
npm install
npm run dev        # http://localhost:5173
npm run build      # build de production dans dist/
npm run preview    # sert dist/ sur http://localhost:4173
```

Déploiement statique (Netlify, Vercel, GitHub Pages…) : publier `dist/`. Les fichiers `public/_redirects` (Netlify) et `vercel.json` renvoient toutes les routes vers `index.html`, nécessaire pour `/charte`, `/presse`, etc.

## Stack

React 18 + Vite 5 + TypeScript + Tailwind 3 · @react-three/fiber + drei (3D) · GSAP ScrollTrigger (scrollytelling) · react-router (pages).
Aucun modèle 3D, aucune photo, aucun HDR téléchargé : tout est généré par le code.

## Arborescence

```
apex-fitness/
├─ index.html                 SEO, Open Graph, polices Google Fonts
├─ tailwind.config.ts         consomme les design tokens
├─ public/
│  ├─ favicon.svg, og-image.png, robots.txt
│  └─ brand/                  logos SVG (sombre, clair, mono, symbole, 3 pistes)
└─ src/
   ├─ design/tokens.ts        ★ SOURCE UNIQUE : couleurs, typo, rayons, ombres, mouvement
   ├─ data/                   franchise.ts (hypothèses + calcul du simulateur), zones.ts (carte)
   ├─ hooks/                  media queries, détection 3D, meta SEO par page
   ├─ components/             Logo (3 pistes), Header, Footer, MagneticButton, Counter, Reveal, PhotoSlot…
   ├─ three/                  Machine.tsx (machine procédurale), Stage, HeroCanvas, StoryCanvas
   ├─ sections/               Hero, ProblemSolution, HowItWorks, ClubPlan, FranchiseModel, Simulator,
   │                          Join, Support, FranceMap, Faq, ApplicationForm
   └─ pages/                  Home, Concept, Presse, Charte, Mentions, NotFound
```

## Pages

| Route | Contenu |
|---|---|
| `/` | One-page franchise : hero 3D, problème/solution, 3 étapes en scrollytelling 3D, plan isométrique du club, modèle, simulateur, profil + 5 étapes, accompagnement, carte, FAQ (DIP), formulaire |
| `/concept` | Version grand public du concept |
| `/presse` | Communiqué (exemple fictif), fiche d'identité, kit média téléchargeable |
| `/charte` | Brand book interactif (pistes de logo, versions, palette avec ratios de contraste calculés en direct, typographies, formes, règles, ton) |
| `/mentions-legales` | Mentions + RGPD |

## 3D : performances et accessibilité

- `frameloop="demand"` : la scène ne se redessine que pendant une animation ou un mouvement de souris.
- `dpr={[1, 1.5]}` : pixel ratio plafonné.
- three.js est dans un chunk séparé, chargé après le premier affichage (`requestIdleCallback`) : le bundle initial pèse environ 80 ko gzip.
- Repli : illustration SVG statique si WebGL est absent, en mode économie de données, ou sur mobile peu puissant (`canRender3D()`).
- `prefers-reduced-motion` : pas de parallax, séquence affichée directement dans son état final, scrollytelling remplacé par des cartes.

## À compléter avant rendu

- Rechercher `[À SOURCER]` et remplacer par des données citées.
- Remplir les blocs `[PHOTO À AJOUTER]` (composant `PhotoSlot`).
- Compléter éditeur et hébergeur dans `src/pages/Mentions.tsx`.
- Vectoriser le texte des logos de `public/brand/` (vectoriser le texte dans Illustrator ou Figma) pour un usage hors web.
