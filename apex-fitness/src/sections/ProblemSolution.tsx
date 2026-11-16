import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';

const PROBLEMS = [
  { t: 'On ne sait pas quoi faire', d: "Sans programme clair, on erre entre les machines et on finit par faire toujours la même chose." },
  { t: 'On a peur de mal faire', d: 'Mauvais réglage, mauvaise charge : la crainte de se blesser freine les débutants et les seniors.' },
  { t: 'On ne voit pas ses progrès', d: 'Sans suivi, la motivation retombe en quelques semaines.' },
  { t: 'On se sent jugé', d: "Les salles « culte du muscle » intimident ceux qui reprennent le sport." },
];
const ANSWERS = [
  { icon: 'scan', t: 'Un programme sur chaque machine', d: "L'appli sait quoi faire, dans quel ordre, combien de fois. Il suffit de scanner." },
  { icon: 'dial', t: 'Des réglages automatiques et sûrs', d: 'Résistance, charge et position se règlent seules, dans les limites définies par le programme.' },
  { icon: 'chart', t: 'Une progression visible', d: 'Chaque série est enregistrée ; le programme évolue et les progrès sont affichés.' },
  { icon: 'heart', t: 'Un lieu pour tout le monde', d: 'Débutants, seniors, reprise après blessure : le parcours part de là où chacun en est.' },
];

export default function ProblemSolution() {
  return (
    <section aria-labelledby="pb-title" className="section relative">
      <div className="container-apex">
        <SectionHeading
          id="pb-title"
          eyebrow="Le problème · la solution"
          title={<>Pourquoi tant de gens <span className="text-mute">abandonnent</span> la salle.</>}
          lead={<>Selon <span className="tag-source">[À SOURCER]</span>, une part importante des inscrits cesse de fréquenter sa salle dans les premiers mois. Les raisons sont souvent les mêmes — et elles sont toutes solubles.</>}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal className="rounded-card border border-bone/10 bg-graphite/60 p-6 sm:p-8">
            <h3 className="mb-6 font-mono text-sm uppercase tracking-widest text-alert">Ce qui bloque</h3>
            <ul className="flex flex-col gap-5">
              {PROBLEMS.map((p) => (
                <li key={p.t} className="flex gap-4">
                  <span className="mt-1 text-alert"><Icon name="close" size={18} /></span>
                  <div>
                    <p className="font-display text-lg font-semibold">{p.t}</p>
                    <p className="text-mute">{p.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120} className="glass relative overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full border-[10px] border-signal/15" />
            <h3 className="mb-6 font-mono text-sm uppercase tracking-widest text-signal">Ce que fait APEX</h3>
            <ul className="flex flex-col gap-5">
              {ANSWERS.map((a) => (
                <li key={a.t} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-signal/10 text-signal"><Icon name={a.icon} size={20} /></span>
                  <div>
                    <p className="font-display text-lg font-semibold">{a.t}</p>
                    <p className="text-mute">{a.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
