/**
 * /charte — Brand book interactif.
 * Toutes les valeurs proviennent de src/design/tokens.ts : si la marque
 * évolue, cette page se met à jour automatiquement.
 */
import { useState } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import Logo, { LogoMark, type Piste, type Tone } from '../components/Logo';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';
import { contrastRatio, palette, tokens } from '../design/tokens';

const PISTES: { id: Piste; name: string; idea: string; verdict: string }[] = [
  { id: 'A', name: 'Orbite', idea: "Anneau ouvert à 270°, un repère de QR code se loge dans l'ouverture.", verdict: 'Lisible et technologique, mais le lien avec « APEX » reste implicite.' },
  { id: 'B', name: 'Sommet', idea: "L'anneau de résistance s'ouvre au sommet et un « A » en chevron le traverse : on dépasse sa limite. Le pixel de scan remplace la barre du A.", verdict: 'Recommandée : raconte le nom, la technologie et la progression en un seul signe.' },
  { id: 'C', name: 'Coin', idea: "Un coin de repère QR qui se prolonge en arc de résistance, avec le module central plein.", verdict: 'Très « tech », moins sportive ; idéale en motif secondaire.' },
];

const SWATCHES = [
  { ...palette.carbon, text: tokens.color.bone },
  { ...palette.graphite, text: tokens.color.bone },
  { ...palette.bone, text: tokens.color.carbon },
  { ...palette.signal, text: tokens.color.carbon },
  { ...palette.data, text: tokens.color.carbon },
];
const SUPPORT = [
  ['Mute', tokens.color.mute, 'Texte secondaire'],
  ['Faint', tokens.color.faint, 'Texte tertiaire, mentions'],
  ['Signal profond', tokens.color['signal-deep'], 'Signal sur fond clair'],
  ['Data profond', tokens.color['data-deep'], 'Data sur fond clair'],
  ['Alerte', tokens.color.alert, 'Erreurs (toujours avec icône)'],
];
const PAIRS: [string, string, string, string][] = [
  ['Blanc os', tokens.color.bone, 'Noir carbone', tokens.color.carbon],
  ['Signal', tokens.color.signal, 'Noir carbone', tokens.color.carbon],
  ['Data', tokens.color.data, 'Noir carbone', tokens.color.carbon],
  ['Mute', tokens.color.mute, 'Graphite', tokens.color.graphite],
  ['Faint', tokens.color.faint, 'Graphite', tokens.color.graphite],
  ['Noir carbone', tokens.color.carbon, 'Signal', tokens.color.signal],
  ['Signal profond', tokens.color['signal-deep'], 'Blanc os', tokens.color.bone],
  ['Signal', tokens.color.signal, 'Blanc os', tokens.color.bone],
];

const NAV = [['logo', 'Logo'], ['couleurs', 'Couleurs'], ['typo', 'Typographies'], ['formes', 'Formes'], ['usage', 'Règles d\'usage'], ['ton', 'Ton de voix']];

export default function Charte() {
  usePageMeta('Charte graphique — APEX FITNESS', 'Brand book APEX FITNESS : logo, palette, typographies, formes, règles d\'usage et ton de voix.');
  const [piste, setPiste] = useState<Piste>('B');
  const [tone, setTone] = useState<Tone>('dark');
  const [copied, setCopied] = useState('');
  const copy = (hex: string) => {
    navigator.clipboard?.writeText(hex).then(() => {
      setCopied(hex);
      window.setTimeout(() => setCopied(''), 1500);
    });
  };
  const bg = tone === 'light' ? 'bg-bone' : tone === 'mono' ? 'bg-graphite text-bone' : 'bg-carbon';

  return (
    <div className="container-apex py-16 lg:py-24">
      <span className="eyebrow">Brand book · v1.0</span>
      <h1 className="mt-4 text-5xl font-bold sm:text-6xl">Charte graphique</h1>
      <p className="lead mt-5">Tech-premium, sportive, rassurante : un laboratoire high-tech qui serait aussi un studio de sport haut de gamme.</p>
      <nav aria-label="Sommaire de la charte" className="mt-8 flex flex-wrap gap-2">
        {NAV.map(([id, l]) => <a key={id} href={`#${id}`} className="rounded-pill border border-bone/15 px-4 py-2 text-sm text-mute hover:border-signal hover:text-bone">{l}</a>)}
      </nav>

      {/* LOGO */}
      <Block id="logo" n="01" title="Logo">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className={`flex min-h-[320px] flex-col items-center justify-center gap-8 rounded-card border border-bone/10 p-10 transition-colors ${bg}`}>
            <span className="text-[28px]"><Logo piste={piste} tone={tone} size={72} /></span>
            <div className="flex items-end gap-6" aria-label="Déclinaisons favicon">
              {[64, 32, 16].map((s) => (
                <div key={s} className="flex flex-col items-center gap-2">
                  <LogoMark piste={piste} tone={tone} size={s} />
                  <span className={`font-mono text-[10px] ${tone === 'light' ? 'text-carbon/70' : 'text-faint'}`}>{s}px</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <fieldset>
              <legend className="mb-2 text-sm text-mute">Piste</legend>
              <div className="flex flex-col gap-2">
                {PISTES.map((p) => (
                  <label key={p.id} className={`flex cursor-pointer gap-4 rounded-card border p-4 transition-colors ${piste === p.id ? 'border-signal bg-signal/5' : 'border-bone/10 hover:border-bone/30'}`}>
                    <input type="radio" name="piste" value={p.id} checked={piste === p.id} onChange={() => setPiste(p.id)} className="sr-only" />
                    <LogoMark piste={p.id} size={40} />
                    <span>
                      <span className="font-display font-semibold">Piste {p.id} · {p.name}</span>
                      {p.id === 'B' && <span className="ml-2 rounded-pill bg-signal px-2 py-0.5 font-mono text-[10px] uppercase text-carbon">recommandée</span>}
                      <span className="mt-1 block text-sm text-mute">{p.idea}</span>
                      <span className="mt-1 block text-xs text-faint">{p.verdict}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm text-mute">Version</legend>
              <div className="flex gap-2">
                {(['dark', 'light', 'mono'] as Tone[]).map((t) => (
                  <label key={t} className={`cursor-pointer rounded-pill border px-4 py-2 text-sm ${tone === t ? 'border-bone bg-bone text-carbon' : 'border-bone/15 text-mute'}`}>
                    <input type="radio" name="tone" className="sr-only" checked={tone === t} onChange={() => setTone(t)} />
                    {{ dark: 'Sombre', light: 'Claire', mono: 'Monochrome' }[t]}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Rule title="Zone de protection" text="Autour du logo, laisser un espace libre égal à la hauteur du pixel de scan × 2 (≈ 20 % de la hauteur du symbole)." />
          <Rule title="Taille minimale" text="Symbole seul : 16 px (favicon). Logo complet : 96 px de large à l'écran, 25 mm en impression." />
          <Rule title="Construction" text="Grille 64 × 64. Anneau r = 24, trait 5, ouverture de 60° au sommet. Chevron trait 5, extrémités arrondies." />
        </div>
      </Block>

      {/* COULEURS */}
      <Block id="couleurs" n="02" title="Couleurs">
        <p className="mb-6 text-mute">Mode sombre dominant. Le Signal est rare et précieux : il désigne ce qui est actif ou ce sur quoi cliquer. Cliquez sur une couleur pour copier son code.</p>
        <div className="grid gap-3 sm:grid-cols-5">
          {SWATCHES.map((s) => (
            <button key={s.hex} type="button" onClick={() => copy(s.hex)} className="group flex flex-col overflow-hidden rounded-card border border-bone/10 text-left">
              <span className="flex h-32 items-end p-3 font-mono text-xs" style={{ background: s.hex, color: s.text }}>{copied === s.hex ? 'Copié ✓' : 'Copier'}</span>
              <span className="bg-graphite p-3">
                <span className="block font-display font-semibold">{s.name}</span>
                <span className="block font-mono text-sm text-mute">{s.hex}</span>
                <span className="block text-xs text-faint">{s.role}</span>
              </span>
            </button>
          ))}
        </div>
        <h3 className="mb-3 mt-8 text-xl font-semibold">Couleurs de support</h3>
        <div className="flex flex-wrap gap-3">
          {SUPPORT.map(([n, hex, role]) => (
            <button key={n} type="button" onClick={() => copy(hex)} className="flex items-center gap-3 rounded-control border border-bone/10 bg-graphite p-2 pr-4 text-left">
              <span className="h-10 w-10 rounded-lg" style={{ background: hex }} />
              <span><span className="block text-sm font-semibold">{n} <span className="font-mono font-normal text-mute">{copied === hex ? 'copié ✓' : hex}</span></span><span className="block text-xs text-faint">{role}</span></span>
            </button>
          ))}
        </div>
        <h3 className="mb-3 mt-8 text-xl font-semibold">Contrastes (WCAG 2.1)</h3>
        <div className="overflow-x-auto rounded-card border border-bone/10">
          <table className="w-full min-w-[520px] text-sm">
            <caption className="sr-only">Ratios de contraste des combinaisons de couleurs</caption>
            <thead className="bg-graphite text-left text-mute"><tr><th className="p-3">Aperçu</th><th className="p-3">Texte / fond</th><th className="p-3">Ratio</th><th className="p-3">Verdict</th></tr></thead>
            <tbody>
              {PAIRS.map(([fn, f, bn, b]) => {
                const r = contrastRatio(f, b);
                const v = r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA grands textes' : 'Interdit pour du texte';
                return (
                  <tr key={fn + bn} className="border-t border-bone/5">
                    <td className="p-3"><span className="inline-block rounded-md px-3 py-1 font-semibold" style={{ color: f, background: b }}>Aa</span></td>
                    <td className="p-3">{fn} sur {bn}</td>
                    <td className="p-3 font-mono">{r.toFixed(2)} : 1</td>
                    <td className={`p-3 font-mono ${r < 4.5 ? 'text-alert' : 'text-signal'}`}>{r < 4.5 && <Icon name="alert" size={14} className="mr-1 inline" />}{v}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Block>

      {/* TYPO */}
      <Block id="typo" n="03" title="Typographies">
        <div className="grid gap-4 lg:grid-cols-3">
          <TypeCard family="Space Grotesk" cls="font-display" role="Titres, logotype, boutons" sample="Le sport qui s'adapte à toi." weights="500 · 600 · 700" />
          <TypeCard family="Inter" cls="font-sans" role="Texte courant, formulaires" sample="Scanne. Pousse. La machine s'occupe du reste." weights="400 · 500 · 600" />
          <TypeCard family="JetBrains Mono" cls="font-mono" role="Chiffres, données, surtitres" sample="45 kg · 3 × 12 · 06:42" weights="400 · 600" />
        </div>
        <div className="mt-6 glass p-6">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-faint">Échelle typographique (responsive)</p>
          <p className="font-display text-5xl font-bold">H1 · 44–70 px</p>
          <p className="font-display text-4xl font-semibold">H2 · 30–48 px</p>
          <p className="font-display text-2xl font-semibold">H3 · 20–24 px</p>
          <p className="text-lg text-mute">Chapeau · 18–20 px, interligne 1.6</p>
          <p className="text-base text-mute">Texte · 16 px minimum, 62 caractères par ligne maximum</p>
        </div>
      </Block>

      {/* FORMES */}
      <Block id="formes" n="04" title="Formes et motifs">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ShapeCard title="L'anneau ouvert" text="Symbole de la résistance. Toujours ouvert : on peut toujours progresser.">
            <svg viewBox="0 0 100 100" className="h-24 w-24" aria-hidden="true"><path d="M68.7 17.6 A38 38 0 1 1 31.3 17.6" fill="none" stroke="#B8FF3C" strokeWidth="6" strokeLinecap="round" /></svg>
          </ShapeCard>
          <ShapeCard title="Grille de points" text="Fond technique discret (opacité 8–20 %), espacement 22 px.">
            <div className="bg-dots h-24 w-full rounded-control" />
          </ShapeCard>
          <ShapeCard title="Lignes de connexion" text="En Data, fines (1–2 px), animées en pointillés quand une donnée circule.">
            <svg viewBox="0 0 120 60" className="h-24 w-full" aria-hidden="true"><path d="M5 50 C 40 50, 60 10, 115 10" stroke="#3CE0FF" strokeWidth="2" fill="none" className="flow-line" /><circle cx="5" cy="50" r="4" fill="#3CE0FF" /><circle cx="115" cy="10" r="4" fill="#B8FF3C" /></svg>
          </ShapeCard>
          <ShapeCard title="Cartes de verre" text="Rayon 16 px (cartes) / 12 px (contrôles), flou 14 px, bordure blanche à 10 %.">
            <div className="glass h-24 w-full" />
          </ShapeCard>
        </div>
      </Block>

      {/* USAGE */}
      <Block id="usage" n="05" title="Règles d'usage">
        <div className="grid gap-4 md:grid-cols-2">
          <DoDont ok items={['Logo sombre sur Noir carbone ou Graphite', 'Logo clair (Signal profond) sur Blanc os', 'Monochrome sur photo, après assombrissement', 'Un seul élément Signal dominant par écran (le CTA)', 'Chiffres en JetBrains Mono, toujours avec leur unité', 'Mentions [À SOURCER] et « hypothèse » visibles']} />
          <DoDont items={['Déformer, pivoter ou recolorer le symbole', 'Signal en texte sur fond clair (contraste insuffisant)', 'Fermer l\'anneau', 'Ajouter des ombres portées ou des dégradés au logo', 'Plus de deux couleurs d\'accent dans un même bloc', 'Photos de banque d\'images génériques']} />
        </div>
      </Block>

      {/* TON */}
      <Block id="ton" n="06" title="Ton de voix">
        <div className="grid gap-4 md:grid-cols-3">
          <Rule title="Confiant" text="On affirme, sans arrogance. « La machine s'occupe du reste. » plutôt que « Nous essayons de vous simplifier la vie »." />
          <Rule title="Simple" text="Phrases courtes, verbes d'action, zéro jargon. On tutoie l'adhérent, on vouvoie le futur franchisé." />
          <Rule title="Énergique" text="Rythme ternaire (Scanne. Pousse. Progresse.), chiffres concrets, toujours sourcés ou signalés comme hypothèses." />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-card border border-signal/30 bg-signal/5 p-5"><p className="font-mono text-xs text-signal">ON DIT</p><p className="mt-2">« Ton programme est prêt. Scanne la machine 4. »</p></div>
          <div className="rounded-card border border-alert/30 bg-alert/5 p-5"><p className="font-mono text-xs text-alert">ON ÉVITE</p><p className="mt-2">« Veuillez procéder à l'identification de l'équipement via le module QR. »</p></div>
        </div>
      </Block>
    </div>
  );
}

function Block({ id, n, title, children }: { id: string; n: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="mt-20 border-t border-bone/10 pt-10">
      <Reveal>
        <p className="font-mono text-sm text-signal">{n}</p>
        <h2 id={`${id}-t`} className="mb-8 mt-1 text-4xl font-semibold">{title}</h2>
        {children}
      </Reveal>
    </section>
  );
}
function Rule({ title, text }: { title: string; text: string }) {
  return <div className="glass p-5"><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm text-mute">{text}</p></div>;
}
function TypeCard({ family, cls, role, sample, weights }: { family: string; cls: string; role: string; sample: string; weights: string }) {
  return (
    <div className="glass flex flex-col gap-4 p-6">
      <p className={`${cls} text-6xl font-semibold text-signal`}>Aa</p>
      <div><h3 className={`${cls} text-xl font-semibold`}>{family}</h3><p className="text-sm text-mute">{role} · {weights}</p></div>
      <p className={`${cls} text-lg`}>{sample}</p>
    </div>
  );
}
function ShapeCard({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return <div className="glass flex flex-col gap-3 p-5"><div className="flex h-28 items-center justify-center">{children}</div><h3 className="font-semibold">{title}</h3><p className="text-sm text-mute">{text}</p></div>;
}
function DoDont({ ok, items }: { ok?: boolean; items: string[] }) {
  return (
    <div className={`rounded-card border p-6 ${ok ? 'border-signal/30' : 'border-alert/30'}`}>
      <h3 className={`flex items-center gap-2 font-mono text-sm uppercase tracking-widest ${ok ? 'text-signal' : 'text-alert'}`}><Icon name={ok ? 'check' : 'close'} size={18} />{ok ? 'À faire' : 'À éviter'}</h3>
      <ul className="mt-4 flex flex-col gap-2 text-mute">{items.map((i) => <li key={i}>— {i}</li>)}</ul>
    </div>
  );
}
