import { usePageMeta } from '../hooks/usePageMeta';
import SectionHeading, { Hl } from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import Stagger from '../components/Stagger';
import Icon from '../components/Icon';
import PhotoSlot from '../components/PhotoSlot';
import MagneticButton from '../components/MagneticButton';
import MachineIllustration from '../components/MachineIllustration';
import Marquee from '../components/Marquee';

const GOALS = [
  { icon: 'flame', t: 'Perte de poids', d: 'Circuits dynamiques, charges modérées, repos courts.' },
  { icon: 'dumbbell', t: 'Prise de masse', d: 'Charges progressives, tempo contrôlé, récupération suivie.' },
  { icon: 'zap', t: 'Remise en forme', d: "Un peu de tout, à ton rythme, pour retrouver de l'énergie." },
  { icon: 'shield', t: 'Rééducation', d: 'Amplitudes et charges plafonnées, en lien avec ton kiné.' },
  { icon: 'heart', t: 'Bien vieillir', d: 'Force, équilibre et mobilité, sans à-coups.' },
];

/** Page grand public : comprendre le concept en 2 minutes. */
export default function Concept() {
  usePageMeta('Le concept APEX FITNESS — la salle de sport qui se règle pour toi', 'Scanne le QR code de la machine, elle se règle selon ton programme. Découvre comment fonctionne une salle APEX FITNESS.');
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <div className="container-apex relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col gap-6">
            <span className="eyebrow">Le concept</span>
            <h1 className="text-7xl font-extrabold leading-[0.88] sm:text-8xl">Tu scannes.<br />Elle se règle.<br /><Hl tone="accent">Tu progresses.</Hl></h1>
            <p className="lead">APEX FITNESS, c'est une salle où tu n'as plus à te demander quoi faire ni comment régler une machine. Ton programme est dans l'appli ; chaque machine l'exécute.</p>
          </div>
          <Reveal className="rounded-[20px] border-2 border-primary bg-ink p-6 shadow-block-primary"><MachineIllustration className="h-auto w-full" /></Reveal>
        </div>
        <Marquee tone="primary" items={['Perte de poids', 'Prise de masse', 'Remise en forme', 'Rééducation', 'Bien vieillir']} />
      </section>

      <section className="bg-ink py-section" aria-labelledby="goals-title">
        <div className="container-apex">
          <SectionHeading id="goals-title" eyebrow="Un programme par objectif" title={<>Ton objectif. <Hl>Ton rythme.</Hl></>} lead="Au premier rendez-vous, on fait le point : objectif, antécédents, disponibilités. L'appli construit ton programme et l'ajuste à chaque séance." />
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {GOALS.map((g, i) => (
              <div key={g.t} className={i === 0 ? 'rounded-card bg-primary p-6 text-ink shadow-block' : 'block-card-hover border-2'}>
                <Icon name={g.icon} size={30} className={i === 0 ? '' : 'text-primary-soft'} />
                <h3 className={`mt-4 text-3xl ${i === 0 ? 'text-ink' : ''}`}>{g.t}</h3>
                <p className={`mt-2 ${i === 0 ? 'font-medium' : 'text-fg-muted'}`}>{g.d}</p>
              </div>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="py-section" aria-labelledby="incl-title">
        <div className="container-apex grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading id="incl-title" eyebrow="Pour tout le monde" title={<>Personne n'a à <Hl tone="accent">mériter</Hl> sa place</>} />
            <ul className="flex flex-col gap-4 text-lg">
              {['Débutant·e : les réglages sont faits pour toi, sans erreur possible.', 'Senior : charges douces, mouvements guidés, coach à proximité.', 'Reprise après blessure : limites fixées avec ton kiné, respectées par la machine.', 'Sportif·ve confirmé·e : progression fine, séance après séance.'].map((t) => (
                <li key={t} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-accent text-ink"><Icon name="check" size={16} /></span><span className="text-fg-muted">{t}</span></li>
              ))}
            </ul>
            <div className="mt-8 rounded-card border-2 border-dashed border-primary/60 p-5">
              <p className="font-display text-base font-bold uppercase tracking-wider text-primary-soft">Persona illustratif, fictif</p>
              <p className="mt-2 text-lg">« Martine, 63 ans, veut retrouver de la force après une opération du genou. Son kiné a fixé des limites d'amplitude ; la machine les applique à chaque séance. »</p>
            </div>
          </div>
          <PhotoSlot label="Adhérente senior scannant une machine avec son smartphone" ratio="aspect-[4/5]" />
        </div>
      </section>

      <section className="relative overflow-hidden bg-primary py-section text-ink">
        <div className="bg-stripes pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply" />
        <div className="container-apex relative flex flex-col items-center gap-6 text-center">
          <h2 className="text-6xl text-ink sm:text-7xl">Le premier club ouvre bientôt</h2>
          <p className="max-w-[50ch] text-xl font-medium">Vous êtes entrepreneur et ce concept vous parle ? Ouvrez-le dans votre ville.</p>
          <MagneticButton to="/#candidature" variant="dark" className="px-8 text-xl">Devenir franchisé <Icon name="arrow" size={22} /></MagneticButton>
        </div>
      </section>
    </>
  );
}
