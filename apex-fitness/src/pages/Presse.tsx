import { usePageMeta } from '../hooks/usePageMeta';
import Reveal from '../components/Reveal';
import Stagger from '../components/Stagger';
import Icon from '../components/Icon';
import PhotoSlot from '../components/PhotoSlot';
import { LogoMark, type Tone } from '../components/Logo';
import { Hl } from '../components/SectionHeading';

const FACTS: [string, string][] = [
  ['Concept', "Salle de sport connectée : les machines se règlent seules d'après le programme de l'appli"],
  ['Format', 'Smart Studio de 250 à 400 m² (hypothèse)'],
  ['Modèle', 'Réseau de franchise'],
  ['Marché du fitness en France', '[À SOURCER]'],
  ["Taux d'abandon des salles", '[À SOURCER]'],
  ['Clubs ouverts', 'Aucun : projet pédagogique fictif'],
];
const KIT: [string, string, Tone, string][] = [
  ['Logo · version sombre', '/brand/apex-logo-dark.svg', 'dark', 'bg-bg'],
  ['Logo · version claire', '/brand/apex-logo-light.svg', 'light', 'bg-fg'],
  ['Logo · monochrome', '/brand/apex-logo-mono.svg', 'mono', 'bg-fg text-ink'],
  ['Symbole · favicon', '/brand/apex-symbol.svg', 'block', 'bg-ink'],
];

export default function Presse() {
  usePageMeta('Espace presse — APEX FITNESS', 'Communiqué, kit média, logos et contacts presse APEX FITNESS (projet pédagogique fictif).');
  return (
    <>
      <section className="relative overflow-hidden bg-ink">
        <div className="bg-stripes pointer-events-none absolute inset-0 opacity-50" />
        <div className="container-apex relative py-16 lg:py-24">
          <span className="eyebrow">Espace presse</span>
          <h1 className="mt-5 max-w-[14ch] text-7xl font-extrabold leading-[0.9] sm:text-8xl">La salle qui se <Hl>règle toute seule</Hl></h1>
          <p className="lead mt-6">Ressources pour les journalistes : communiqué, chiffres clés, logos et visuels.</p>
        </div>
      </section>

      <div className="container-apex py-section">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Reveal as="article" className="block-card border-2 p-6 sm:p-10" aria-labelledby="cp-title">
            <span className="eyebrow-accent">Communiqué · exemple fictif</span>
            <h2 id="cp-title" className="mt-4 text-5xl">APEX FITNESS lance son réseau de franchise de Smart Studios</h2>
            <div className="mt-6 flex flex-col gap-4 text-lg text-fg-muted">
              <p><strong className="text-fg">« Le sport qui s'adapte à toi. »</strong> Avec cette promesse, APEX FITNESS propose une salle d'un nouveau genre : chaque machine porte un QR code que l'adhérent scanne avec l'appli. La machine règle alors seule sa résistance, sa charge et sa position selon le programme du jour.</p>
              <p>Le concept s'adresse à celles et ceux que la salle intimide ou décourage : débutants, seniors, personnes en reprise après blessure. Chaque série est enregistrée, le programme évolue en temps réel, et des défis entretiennent la motivation.</p>
              <p>Le réseau recrute des franchisés pour ouvrir des Smart Studios de 250 à 400 m², exploités par une petite équipe et appuyés par une plateforme technologique centralisée.</p>
              <p className="text-base text-fg-muted">Document rédigé dans le cadre d'un projet pédagogique (Cnam Versailles, LCVM, ESC 132). Aucune entreprise réelle.</p>
            </div>
          </Reveal>
          <div className="flex flex-col gap-6">
            <Reveal className="block-card border-2">
              <h2 className="text-3xl">Fiche d'identité</h2>
              <dl className="mt-4 flex flex-col">
                {FACTS.map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-1 border-b border-line py-3 last:border-0">
                    <dt className="text-sm font-semibold uppercase tracking-wider text-fg-muted">{k}</dt>
                    <dd>{v.startsWith('[') ? <span className="tag-source">{v}</span> : v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
            <Reveal className="rounded-card bg-primary p-6 text-ink shadow-block">
              <h2 className="text-3xl text-ink">Contact presse</h2>
              <p className="mt-2 text-lg font-medium">Service communication (fictif)<br /><a className="font-bold underline decoration-2 underline-offset-4" href="mailto:presse@apex-fitness.example">presse@apex-fitness.example</a></p>
            </Reveal>
          </div>
        </div>

        <section className="mt-20" aria-labelledby="kit-title">
          <h2 id="kit-title" className="title-section">Kit <Hl tone="accent">média</Hl></h2>
          <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KIT.map(([label, href, tone, bg]) => (
              <a key={href} href={href} download className="group flex flex-col gap-4 rounded-card border-2 border-line bg-card p-4 transition-[transform,border-color] duration-200 hover:-translate-y-1 hover:border-primary">
                <div className={`flex aspect-video items-center justify-center rounded-control ${bg}`}><LogoMark tone={tone} size={64} /></div>
                <span className="flex items-center justify-between gap-2 font-display text-lg font-bold uppercase">{label}<Icon name="download" size={20} className="text-accent-soft transition-transform duration-200 group-hover:translate-y-0.5" /></span>
              </a>
            ))}
          </Stagger>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <PhotoSlot label="Portrait des fondateurs" />
            <PhotoSlot label="Machine connectée et QR code (gros plan)" />
            <PhotoSlot label="Club pilote, vue d'ensemble" />
          </div>
        </section>
      </div>
    </>
  );
}
