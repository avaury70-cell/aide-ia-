import { usePageMeta } from '../hooks/usePageMeta';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';
import PhotoSlot from '../components/PhotoSlot';
import { LogoMark } from '../components/Logo';

const FACTS = [
  ['Concept', "Salle de sport connectée : les machines se règlent seules d'après le programme de l'appli"],
  ['Format', 'Smart Studio de 250 à 400 m² (hypothèse)'],
  ['Modèle', 'Réseau de franchise'],
  ['Marché du fitness en France', '[À SOURCER]'],
  ['Taux d\'abandon des salles', '[À SOURCER]'],
  ['Clubs ouverts', 'Aucun — projet pédagogique fictif'],
];
const KIT = [
  ['Logo — version sombre (SVG)', '/brand/apex-logo-dark.svg'],
  ['Logo — version claire (SVG)', '/brand/apex-logo-light.svg'],
  ['Logo — monochrome (SVG)', '/brand/apex-logo-mono.svg'],
  ['Symbole / favicon (SVG)', '/brand/apex-symbol.svg'],
];

export default function Presse() {
  usePageMeta('Espace presse — APEX FITNESS', 'Communiqué, kit média, logos et contacts presse APEX FITNESS (projet pédagogique fictif).');
  return (
    <div className="container-apex py-16 lg:py-24">
      <span className="eyebrow">Espace presse</span>
      <h1 className="mt-4 max-w-[18ch] text-5xl font-bold sm:text-6xl">APEX FITNESS, la salle qui se règle toute seule.</h1>
      <p className="lead mt-6">Ressources pour les journalistes : communiqué, chiffres clés, logos et visuels.</p>

      <div className="mt-14 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Reveal as="article" className="glass p-6 sm:p-10" aria-labelledby="cp-title">
          <p className="font-mono text-xs uppercase tracking-widest text-data">Communiqué de presse · exemple fictif</p>
          <h2 id="cp-title" className="mt-3 text-3xl font-semibold">APEX FITNESS lance son réseau de franchise de Smart Studios</h2>
          <div className="mt-6 flex flex-col gap-4 text-mute">
            <p><strong className="text-bone">« Le sport qui s'adapte à toi. »</strong> Avec cette promesse, APEX FITNESS propose une salle de sport d'un nouveau genre : chaque machine porte un QR code que l'adhérent scanne avec l'appli. La machine règle alors seule sa résistance, sa charge et sa position selon le programme du jour.</p>
            <p>Le concept s'adresse à celles et ceux que la salle intimide ou décourage : débutants, seniors, personnes en reprise après blessure. Chaque série est enregistrée et le programme évolue en temps réel.</p>
            <p>Le réseau recrute des franchisés pour ouvrir des Smart Studios de 250 à 400 m², exploités par une équipe réduite et appuyés par une plateforme technologique centralisée.</p>
            <p className="text-sm text-faint">Document rédigé dans le cadre d'un projet pédagogique (Cnam Versailles, LCVM, ESC 132). Aucune entreprise réelle.</p>
          </div>
        </Reveal>
        <div className="flex flex-col gap-6">
          <Reveal className="glass p-6">
            <h2 className="text-xl font-semibold">Fiche d'identité</h2>
            <dl className="mt-4 flex flex-col gap-3 text-sm">
              {FACTS.map(([k, v]) => (
                <div key={k} className="flex flex-col border-b border-bone/5 pb-3">
                  <dt className="text-faint">{k}</dt>
                  <dd className="text-bone">{v.startsWith('[') ? <span className="tag-source">{v}</span> : v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <Reveal className="glass p-6">
            <h2 className="text-xl font-semibold">Contact presse</h2>
            <p className="mt-2 text-mute">Service communication (fictif)<br /><a className="text-signal underline underline-offset-2" href="mailto:presse@apex-fitness.example">presse@apex-fitness.example</a></p>
          </Reveal>
        </div>
      </div>

      <section className="mt-16" aria-labelledby="kit-title">
        <h2 id="kit-title" className="title-section">Kit média</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KIT.map(([label, href]) => (
            <a key={href} href={href} download className="glass group flex flex-col gap-4 p-5 transition-colors hover:border-signal/40">
              <div className={`flex aspect-video items-center justify-center rounded-control ${href.includes('light') ? 'bg-bone' : 'bg-carbon'}`}>
                <LogoMark tone={href.includes('light') ? 'light' : href.includes('mono') ? 'mono' : 'dark'} size={56} />
              </div>
              <span className="flex items-center justify-between gap-2 text-sm">{label}<Icon name="download" size={18} className="text-signal" /></span>
            </a>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <PhotoSlot label="Portrait des fondateurs" />
          <PhotoSlot label="Machine connectée et QR code (gros plan)" />
          <PhotoSlot label="Club pilote — vue d'ensemble" />
        </div>
      </section>
    </div>
  );
}
