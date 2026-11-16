import { usePageMeta } from '../hooks/usePageMeta';
import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';
import PhotoSlot from '../components/PhotoSlot';
import MagneticButton from '../components/MagneticButton';
import MachineIllustration from '../components/MachineIllustration';

const GOALS = [
  { t: 'Perte de poids', d: 'Circuits dynamiques, charges modérées, temps de repos courts.' },
  { t: 'Prise de masse', d: 'Charges progressives, tempo contrôlé, récupération suivie.' },
  { t: 'Remise en forme', d: 'Un peu de tout, à ton rythme, pour retrouver de l\'énergie.' },
  { t: 'Rééducation', d: 'Amplitudes et charges plafonnées, en lien avec ton kiné.' },
  { t: 'Bien vieillir', d: 'Force, équilibre et mobilité, sans à-coups.' },
];

/** Page grand public : comprendre le concept en 2 minutes. */
export default function Concept() {
  usePageMeta('Le concept APEX FITNESS — la salle de sport qui se règle pour toi', "Scanne le QR code de la machine, elle se règle selon ton programme. Découvre comment fonctionne une salle APEX FITNESS.");
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-dots absolute inset-0 opacity-50" />
        <div className="container-apex relative grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col gap-6">
            <span className="eyebrow">Le concept</span>
            <h1 className="text-5xl font-bold sm:text-6xl">Tu scannes.<br />Elle se règle.<br /><span className="text-signal">Tu progresses.</span></h1>
            <p className="lead">APEX FITNESS, c'est une salle où tu n'as plus à te demander quoi faire ni comment régler une machine. Ton programme est dans l'appli ; chaque machine l'exécute.</p>
          </div>
          <Reveal className="glass p-6"><MachineIllustration className="h-auto w-full" /></Reveal>
        </div>
      </section>

      <section className="section border-t border-bone/5" aria-labelledby="goals-title">
        <div className="container-apex">
          <SectionHeading id="goals-title" eyebrow="Un programme pour chaque objectif" title="Ton objectif. Ton niveau. Ton rythme." lead="Au premier rendez-vous, on fait le point : objectif, antécédents, disponibilités. L'appli construit ton programme et l'ajuste à chaque séance." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {GOALS.map((g, i) => (
              <Reveal key={g.t} delay={i * 60} className="glass p-5">
                <h3 className="text-lg font-semibold">{g.t}</h3>
                <p className="mt-2 text-sm text-mute">{g.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section border-t border-bone/5" aria-labelledby="incl-title">
        <div className="container-apex grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading id="incl-title" eyebrow="Pour tout le monde" title="Personne n'a à « mériter » sa place." />
            <ul className="flex flex-col gap-4">
              {['Débutant·e : les réglages sont faits pour toi, sans erreur possible.', 'Senior : charges douces, mouvements guidés, coach à proximité.', 'Reprise après blessure : limites fixées avec ton kiné, respectées par la machine.', 'Sportif·ve confirmé·e : progression fine, séance après séance.'].map((t) => (
                <li key={t} className="flex gap-3"><Icon name="check" className="mt-0.5 shrink-0 text-signal" /> <span className="text-mute">{t}</span></li>
              ))}
            </ul>
            <div className="mt-8 rounded-card border border-data/30 bg-data/5 p-5">
              <p className="font-mono text-xs uppercase tracking-widest text-data">Persona illustratif — fictif</p>
              <p className="mt-2 text-bone">« Martine, 63 ans, veut retrouver de la force après une opération du genou. Son kiné a fixé des limites d'amplitude ; la machine les applique à chaque séance. »</p>
            </div>
          </div>
          <PhotoSlot label="Adhérente senior scannant une machine avec son smartphone" ratio="aspect-[4/5]" />
        </div>
      </section>

      <section className="section border-t border-bone/5 text-center">
        <div className="container-apex flex flex-col items-center gap-6">
          <h2 className="title-section">Le premier club ouvre bientôt.</h2>
          <p className="lead mx-auto">Vous êtes entrepreneur et ce concept vous parle ? Ouvrez-le dans votre ville.</p>
          <MagneticButton to="/#candidature">Devenir franchisé <Icon name="arrow" size={18} /></MagneticButton>
        </div>
      </section>
    </>
  );
}
