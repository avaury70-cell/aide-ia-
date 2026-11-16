import SectionHeading, { Hl } from '../components/SectionHeading';
import Stagger from '../components/Stagger';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';

const PROBLEMS = [
  { t: 'On ne sait pas quoi faire', d: 'Sans programme clair, on erre entre les machines et on refait toujours la même chose.' },
  { t: 'On a peur de mal faire', d: 'Mauvais réglage, mauvaise charge : la peur de se blesser freine débutants et seniors.' },
  { t: 'On ne voit pas ses progrès', d: 'Sans suivi, la motivation retombe en quelques semaines.' },
  { t: 'On se sent jugé', d: 'Les salles « culte du muscle » intimident ceux qui reprennent le sport.' },
];
const ANSWERS = [
  { icon: 'scan', t: 'Un programme sur chaque machine', d: "L'appli sait quoi faire, dans quel ordre, combien de fois. Il suffit de scanner." },
  { icon: 'dial', t: 'Des réglages automatiques et sûrs', d: 'Résistance, charge et position se règlent seules, dans les limites du programme.' },
  { icon: 'chart', t: 'Une progression visible', d: 'Chaque série est enregistrée. Défis, badges et séries de jours entretiennent la motivation.' },
  { icon: 'heart', t: 'Un lieu pour tout le monde', d: 'Débutants, seniors, reprise après blessure : chacun part de là où il en est.' },
];

export default function ProblemSolution() {
  return (
    <section aria-labelledby="pb-title" className="relative py-section">
      <div className="container-apex">
        <SectionHeading
          id="pb-title"
          eyebrow="Le problème"
          title={<>Pourquoi on <Hl>abandonne</Hl> la salle</>}
          lead={<>Selon <span className="tag-source">[À SOURCER]</span>, une part importante des inscrits cesse de venir dans les premiers mois. Les raisons sont presque toujours les mêmes, et elles ont toutes une solution.</>}
        />
        <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <Stagger className="grid content-start gap-4 sm:grid-cols-2">
            {PROBLEMS.map((p) => (
              <div key={p.t} className="block-card">
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-control bg-ink text-danger-soft"><Icon name="close" size={20} /></span>
                <h3 className="text-2xl">{p.t}</h3>
                <p className="mt-2 text-fg-muted">{p.d}</p>
              </div>
            ))}
          </Stagger>
          <Reveal className="relative overflow-hidden rounded-[20px] bg-primary p-7 text-ink shadow-block sm:p-10">
            <div aria-hidden="true" className="absolute -right-16 -top-16 h-56 w-56 rounded-full border-[18px] border-ink/10" />
            <span className="inline-block rounded-[4px] bg-ink px-2.5 py-1 font-display text-sm font-bold uppercase tracking-[0.12em] text-primary-soft">La réponse APEX</span>
            <h3 className="mt-4 text-4xl text-ink sm:text-5xl">La machine fait le travail compliqué.</h3>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2">
              {ANSWERS.map((a) => (
                <li key={a.t}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-control bg-ink text-primary"><Icon name={a.icon} size={24} /></span>
                  <p className="mt-3 font-display text-2xl font-bold uppercase leading-tight">{a.t}</p>
                  <p className="mt-1 font-medium">{a.d}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
