/**
 * /charte — Brand book interactif v2 (identité issue du skill UI/UX Pro Max).
 * Toutes les valeurs viennent de src/design/tokens.ts : la page suit la marque.
 */
import { useState } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import Logo, { LogoMark, type Piste, type Tone } from '../components/Logo';
import Reveal from '../components/Reveal';
import Stagger from '../components/Stagger';
import Icon from '../components/Icon';
import { Hl } from '../components/SectionHeading';
import { contrastRatio, palette, tokens } from '../design/tokens';

const C = tokens.color;
const PISTES: { id: Piste; name: string; idea: string; verdict: string }[] = [
  { id: 'A', name: 'Orbite', idea: "Anneau ouvert, un repère de QR code se loge dans l'ouverture.", verdict: 'Lisible et technologique, mais le lien avec « APEX » reste implicite.' },
  { id: 'B', name: 'Sommet', idea: "L'anneau de résistance s'ouvre au sommet et un « A » en chevron le traverse : on dépasse sa limite. Le pixel de scan remplace la barre du A.", verdict: 'Recommandée : raconte le nom, la technologie et la progression en un seul signe.' },
  { id: 'C', name: 'Coin', idea: 'Un coin de repère QR qui se prolonge en arc de résistance, module central plein.', verdict: 'Très « tech », moins sportive : idéale en motif secondaire.' },
];
const TONES: { id: Tone; label: string; bg: string }[] = [
  { id: 'dark', label: 'Sombre', bg: 'bg-bg' },
  { id: 'light', label: 'Claire', bg: 'bg-fg' },
  { id: 'block', label: 'Bloc', bg: 'bg-ink' },
  { id: 'mono', label: 'Mono', bg: 'bg-card text-fg' },
];
const SWATCHES = [
  { ...palette.primary, text: C.ink },
  { ...palette.accent, text: C.ink },
  { ...palette.bg, text: C.fg },
  { ...palette.ink, text: C.fg },
  { ...palette.fg, text: C.ink },
];
const SUPPORT: [string, string, string][] = [
  ['Orange doux', C['primary-soft'], 'Petits textes orange sur cartes'],
  ['Vert doux', C['accent-soft'], 'Petits textes verts'],
  ['Carte', C.card, 'Surfaces de cartes'],
  ['Atténué', C.muted, 'Pistes, fonds secondaires'],
  ['Texte secondaire', C['fg-muted'], 'Chapeaux, descriptions'],
  ['Texte tertiaire', C.faint, 'Mentions (sur Ardoise/Encre uniquement)'],
  ['Erreur', C.danger, 'Aplats d\'erreur, texte noir'],
  ['Erreur doux', C['danger-soft'], 'Texte d\'erreur'],
];
const PAIRS: [string, string, string, string][] = [
  ['Craie', C.fg, 'Ardoise', C.bg],
  ['Texte secondaire', C['fg-muted'], 'Carte', C.card],
  ['Orange Énergie', C.primary, 'Ardoise', C.bg],
  ['Orange Énergie', C.primary, 'Carte', C.card],
  ['Orange doux', C['primary-soft'], 'Carte', C.card],
  ['Encre', C.ink, 'Orange Énergie', C.primary],
  ['Encre', C.ink, 'Vert Go', C.accent],
  ['Blanc', '#FFFFFF', 'Vert Go', C.accent],
  ['Erreur doux', C['danger-soft'], 'Carte', C.card],
];
const NAV = [['logo', 'Logo'], ['couleurs', 'Couleurs'], ['typo', 'Typographie'], ['formes', 'Formes & motion'], ['usage', 'Règles'], ['ton', 'Ton de voix']];

export default function Charte() {
  usePageMeta('Charte graphique — APEX FITNESS', "Brand book APEX FITNESS v2 : logo, palette Orange Énergie / Vert Go, Barlow Condensed, formes, règles d'usage et ton de voix.");
  const [piste, setPiste] = useState<Piste>('B');
  const [tone, setTone] = useState<Tone>('dark');
  const [copied, setCopied] = useState('');
  const copy = (hex: string) => navigator.clipboard?.writeText(hex).then(() => { setCopied(hex); window.setTimeout(() => setCopied(''), 1500); });
  const bg = TONES.find((t) => t.id === tone)!.bg;

  return (
    <>
      <section className="relative overflow-hidden bg-ink">
        <div className="bg-stripes pointer-events-none absolute inset-0 opacity-50" />
        <div className="container-apex relative py-16 lg:py-24">
          <span className="eyebrow">Brand book · v2.0</span>
          <h1 className="mt-5 text-7xl font-extrabold sm:text-8xl lg:text-9xl">Charte <Hl>graphique</Hl></h1>
          <p className="lead mt-6">Style « Vibrant & Block-based » : blocs francs, contrastes forts, typographie condensée XXL, énergie sportive. Construite avec le skill UI/UX Pro Max, contrastes vérifiés WCAG AA.</p>
          <nav aria-label="Sommaire de la charte" className="mt-8 flex flex-wrap gap-2">
            {NAV.map(([id, l], i) => (
              <a key={id} href={`#${id}`} className="inline-flex min-h-[44px] items-center gap-2 rounded-control border-2 border-line bg-bg px-4 font-display text-lg font-bold uppercase transition-colors duration-200 hover:border-primary">
                <span className="text-primary-soft">{String(i + 1).padStart(2, '0')}</span>{l}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="container-apex pb-24">
        <Block id="logo" n="01" title="Logo">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className={`flex min-h-[340px] flex-col items-center justify-center gap-10 rounded-[20px] border-2 border-line p-10 transition-colors duration-300 ${bg}`}>
              <span className="text-[30px]"><Logo piste={piste} tone={tone} size={84} /></span>
              <div className="flex items-end gap-8" aria-label="Déclinaisons en tailles favicon">
                {[64, 32, 16].map((s) => (
                  <div key={s} className="flex flex-col items-center gap-2">
                    <LogoMark piste={piste} tone={tone} size={s} />
                    <span className={`text-xs font-semibold ${tone === 'light' ? 'text-ink' : 'text-fg-muted'}`}>{s} px</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-5">
              <fieldset>
                <legend className="mb-2 font-display text-lg font-bold uppercase text-fg-muted">Piste</legend>
                <div className="flex flex-col gap-2">
                  {PISTES.map((p) => (
                    <label key={p.id} className={`flex cursor-pointer gap-4 rounded-card border-2 p-4 transition-colors duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-primary-soft ${piste === p.id ? 'border-primary bg-card' : 'border-line hover:border-primary/60'}`}>
                      <input type="radio" name="piste" value={p.id} checked={piste === p.id} onChange={() => setPiste(p.id)} className="sr-only" />
                      <LogoMark piste={p.id} size={44} />
                      <span>
                        <span className="font-display text-xl font-bold uppercase">Piste {p.id} · {p.name}</span>
                        {p.id === 'B' && <span className="ml-2 rounded-[4px] bg-accent px-2 py-0.5 text-xs font-bold uppercase text-ink">Recommandée</span>}
                        <span className="mt-1 block text-fg-muted">{p.idea}</span>
                        <span className="mt-1 block text-sm text-fg-muted/90">{p.verdict}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 font-display text-lg font-bold uppercase text-fg-muted">Version</legend>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((t) => (
                    <label key={t.id} className={`inline-flex min-h-[44px] cursor-pointer items-center rounded-control border-2 px-4 font-display text-lg font-bold uppercase transition-colors duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-primary-soft ${tone === t.id ? 'border-fg bg-fg text-ink' : 'border-line text-fg-muted hover:text-fg'}`}>
                      <input type="radio" name="tone" className="sr-only" checked={tone === t.id} onChange={() => setTone(t.id)} />
                      {t.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>
          <Stagger className="mt-6 grid gap-4 md:grid-cols-3">
            <Rule title="Zone de protection" text="Espace libre égal à 2 × le pixel de scan (≈ 20 % de la hauteur du symbole) tout autour du logo." />
            <Rule title="Taille minimale" text="Symbole seul : 16 px (favicon). Logo complet : 110 px de large à l'écran, 28 mm en impression." />
            <Rule title="Construction" text="Grille 64 × 64. Anneau r = 24, trait 6,5, ouverture de 60° au sommet. Chevron trait 6,5, extrémités arrondies." />
          </Stagger>
        </Block>

        <Block id="couleurs" n="02" title="Couleurs">
          <p className="mb-6 text-lg text-fg-muted">Orange Énergie pour la marque et les blocs, Vert Go réservé aux boutons d'action et à la réussite. Cliquez sur une couleur pour copier son code.</p>
          <Stagger className="grid gap-3 sm:grid-cols-5">
            {SWATCHES.map((s) => (
              <button key={s.hex} type="button" onClick={() => copy(s.hex)} className="group flex flex-col overflow-hidden rounded-card border-2 border-line text-left transition-transform duration-200 hover:-translate-y-1">
                <span className="flex h-36 items-end p-3 font-display text-lg font-bold uppercase" style={{ background: s.hex, color: s.text }}>{copied === s.hex ? 'Copié' : 'Copier'}</span>
                <span className="bg-card p-3">
                  <span className="block font-display text-xl font-bold uppercase">{s.name}</span>
                  <span className="block font-semibold tabular-nums text-fg-muted">{s.hex}</span>
                  <span className="block text-sm text-fg-muted">{s.role}</span>
                </span>
              </button>
            ))}
          </Stagger>
          <h3 className="mb-3 mt-10 text-3xl">Couleurs de soutien</h3>
          <div className="flex flex-wrap gap-3">
            {SUPPORT.map(([n, hex, role]) => (
              <button key={n} type="button" onClick={() => copy(hex)} className="flex items-center gap-3 rounded-control border-2 border-line bg-card p-2 pr-4 text-left transition-colors duration-200 hover:border-primary">
                <span className="h-11 w-11 rounded-[6px]" style={{ background: hex }} />
                <span><span className="block font-semibold">{n} <span className="tabular-nums text-fg-muted">{copied === hex ? 'copié' : hex}</span></span><span className="block text-sm text-fg-muted">{role}</span></span>
              </button>
            ))}
          </div>
          <h3 className="mb-3 mt-10 text-3xl">Contrastes (WCAG 2.1, calculés en direct)</h3>
          <div className="overflow-x-auto rounded-card border-2 border-line">
            <table className="w-full min-w-[560px]">
              <caption className="sr-only">Ratios de contraste des combinaisons de couleurs</caption>
              <thead className="bg-ink text-left font-display text-lg uppercase text-fg-muted"><tr><th className="p-3">Aperçu</th><th className="p-3">Texte / fond</th><th className="p-3">Ratio</th><th className="p-3">Verdict</th></tr></thead>
              <tbody>
                {PAIRS.map(([fn, f, bn, b]) => {
                  const r = contrastRatio(f, b);
                  const v = r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'Grands titres seulement' : 'Interdit en texte';
                  return (
                    <tr key={fn + bn} className="border-t border-line">
                      <td className="p-3"><span className="inline-block rounded-[6px] px-3 py-1 font-display text-lg font-bold" style={{ color: f, background: b }}>Aa</span></td>
                      <td className="p-3">{fn} sur {bn}</td>
                      <td className="p-3 font-semibold tabular-nums">{r.toFixed(2)} : 1</td>
                      <td className={`p-3 font-semibold ${r < 4.5 ? 'text-danger-soft' : 'text-accent-soft'}`}><Icon name={r < 4.5 ? 'alert' : 'check'} size={16} className="mr-1 inline" />{v}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-fg-muted">Note : la spécification de bouton du skill (texte blanc sur Vert Go) ne fait que 2,28 : 1. Elle a été corrigée en texte Encre (7,83 : 1).</p>
        </Block>

        <Block id="typo" n="03" title="Typographie">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[20px] bg-primary p-8 text-ink shadow-block">
              <p className="font-display text-[9rem] font-extrabold leading-none">Aa</p>
              <h3 className="text-4xl text-ink">Barlow Condensed</h3>
              <p className="text-lg font-semibold">Titres, chiffres, boutons, étiquettes · 500 à 800 · en capitales</p>
              <p className="mt-4 font-display text-4xl font-bold uppercase leading-none">Scanne. Pousse. Progresse.</p>
            </div>
            <div className="block-card border-2 p-8">
              <p className="font-sans text-[9rem] font-semibold leading-none text-primary-soft">Aa</p>
              <h3 className="text-4xl">Barlow</h3>
              <p className="text-lg text-fg-muted">Texte courant, formulaires · 400 à 700</p>
              <p className="mt-4 text-xl">La machine règle seule la résistance, la charge et la position du siège.</p>
            </div>
          </div>
          <div className="mt-4 block-card border-2">
            <p className="mb-4 font-display text-lg font-bold uppercase text-fg-muted">Échelle (responsive)</p>
            <p className="font-display text-7xl font-extrabold uppercase leading-none">H1 · 58–112 px</p>
            <p className="font-display text-5xl font-bold uppercase leading-none">H2 · 44–72 px</p>
            <p className="font-display text-3xl font-bold uppercase">H3 · 24–36 px</p>
            <p className="text-xl text-fg-muted">Chapeau · 18–20 px · interligne 1,6</p>
            <p className="text-fg-muted">Texte · 17 px (jamais moins de 16 px), 60 caractères par ligne maximum</p>
          </div>
        </Block>

        <Block id="formes" n="04" title="Formes & motion">
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Shape title="Mot-bloc" text="Un mot clé posé sur un bloc orange incliné de −2°. Un seul par titre.">
              <span className="font-display text-4xl font-extrabold uppercase"><Hl>Énergie</Hl></span>
            </Shape>
            <Shape title="Ombre décalée" text="Ombre pleine 6 px × 6 px, sans flou : la signature « bloc ».">
              <span className="h-20 w-28 rounded-card bg-accent shadow-block" />
            </Shape>
            <Shape title="Anneau ouvert" text="Symbole de la résistance. Toujours ouvert : on peut toujours progresser.">
              <svg viewBox="0 0 100 100" className="h-24 w-24" aria-hidden="true"><path d="M68.7 17.6 A38 38 0 1 1 31.3 17.6" fill="none" stroke="#F97316" strokeWidth="9" strokeLinecap="round" /></svg>
            </Shape>
            <Shape title="Motifs animés" text="Rayures et bandeaux défilants (pause au survol, figés si mouvement réduit).">
              <span className="bg-stripes h-20 w-full rounded-card border-2 border-line" />
            </Shape>
          </Stagger>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Rule title="Rayons" text="Cartes 16 px, grands blocs 20 px, boutons et champs 8 px, étiquettes 4 px." />
            <Rule title="Durées" text="Survols 200 ms, apparitions 350–450 ms. Cascade : back.out(1.4), décalage 60 ms." />
            <Rule title="Espacement" text="Grilles à 16 px, sections de 72 à 128 px. Cibles tactiles de 44 à 48 px minimum." />
          </div>
        </Block>

        <Block id="usage" n="05" title="Règles d'usage">
          <div className="grid gap-4 md:grid-cols-2">
            <DoDont ok items={['Logo sombre sur Ardoise ou Encre, logo « bloc » sur fond neutre', 'Vert Go uniquement pour les CTA et la réussite', 'Un seul mot-bloc orange par titre', 'Titres en capitales Barlow Condensed', 'Icônes Lucide, trait 2,25, jamais d\'emoji', 'Mentions [À SOURCER] et « hypothèse » toujours visibles']} />
            <DoDont items={['Texte blanc sur Vert Go ou sur Orange (contraste insuffisant)', 'Orange en petit texte sur carte (utiliser Orange doux)', 'Déformer, pivoter ou fermer l\'anneau du logo', 'Plus de deux blocs pleins de couleur côte à côte', 'Information portée par la couleur seule', 'Photos de banque d\'images génériques']} />
          </div>
        </Block>

        <Block id="ton" n="06" title="Ton de voix">
          <div className="grid gap-4 md:grid-cols-3">
            <Rule title="Énergique" text="Verbes d'action, rythme ternaire (Scanne. Pousse. Progresse.), phrases courtes." />
            <Rule title="Simple" text="Zéro jargon. On tutoie l'adhérent, on vouvoie le futur franchisé." />
            <Rule title="Honnête" text="Chiffres concrets, toujours sourcés ou signalés comme hypothèses. Pas de faux témoignages." />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-card bg-accent p-6 text-ink"><p className="font-display text-lg font-bold uppercase">On dit</p><p className="mt-2 text-xl font-semibold">« Ton programme est prêt. Scanne la machine 4. »</p></div>
            <div className="rounded-card border-2 border-danger-soft p-6"><p className="font-display text-lg font-bold uppercase text-danger-soft">On évite</p><p className="mt-2 text-xl">« Veuillez procéder à l'identification de l'équipement via le module QR. »</p></div>
          </div>
        </Block>
      </div>
    </>
  );
}

function Block({ id, n, title, children }: { id: string; n: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="mt-20">
      <Reveal className="mb-8 flex items-end gap-4 border-b-2 border-line pb-4">
        <span className="num text-6xl leading-none text-primary-soft">{n}</span>
        <h2 id={`${id}-t`} className="text-5xl sm:text-6xl">{title}</h2>
      </Reveal>
      {children}
    </section>
  );
}
function Rule({ title, text }: { title: string; text: string }) {
  return <div className="block-card border-2"><h3 className="text-2xl">{title}</h3><p className="mt-2 text-fg-muted">{text}</p></div>;
}
function Shape({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return <div className="block-card flex flex-col gap-3 border-2"><div className="flex h-28 items-center justify-center">{children}</div><h3 className="text-2xl">{title}</h3><p className="text-fg-muted">{text}</p></div>;
}
function DoDont({ ok, items }: { ok?: boolean; items: string[] }) {
  return (
    <div className={`rounded-card border-2 p-6 ${ok ? 'border-accent' : 'border-danger-soft'}`}>
      <h3 className={`flex items-center gap-2 text-3xl ${ok ? 'text-accent-soft' : 'text-danger-soft'}`}><Icon name={ok ? 'check' : 'close'} size={26} />{ok ? 'À faire' : 'À éviter'}</h3>
      <ul className="mt-4 flex flex-col gap-2 text-lg text-fg-muted">{items.map((i) => <li key={i} className="flex gap-2"><span aria-hidden="true" className={ok ? 'text-accent-soft' : 'text-danger-soft'}>■</span>{i}</li>)}</ul>
    </div>
  );
}
