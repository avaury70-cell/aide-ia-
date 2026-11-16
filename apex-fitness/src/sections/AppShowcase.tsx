/**
 * « L'appli » — maquette de smartphone en CSS (aucune image) montrant
 * le programme du jour et la gamification recommandée par le skill
 * (anti-pattern « No gamification ») : série de jours, niveau, défis, badges.
 */
import SectionHeading, { Hl } from '../components/SectionHeading';
import Stagger from '../components/Stagger';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';

const FEATURES = [
  { icon: 'target', t: 'Programme sur mesure', d: 'Objectif, niveau, antécédents : le programme est construit au premier rendez-vous, puis ajusté à chaque séance.' },
  { icon: 'trophy', t: 'Défis et badges', d: 'Séries de jours, niveaux, défis du mois entre adhérents du club : la régularité devient un jeu.' },
  { icon: 'chart', t: 'Progrès en temps réel', d: 'Charges, volume, régularité : des courbes simples, sans jargon.' },
  { icon: 'users', t: 'Lien coach et kiné', d: "Le coach suit ses adhérents depuis son tableau de bord ; le kiné partenaire peut fixer des limites d'amplitude." },
];

const SESSION = [
  { m: 'Poussée poitrine', d: '3 × 12 · 45 kg', done: true },
  { m: 'Tirage dos', d: '3 × 12 · 40 kg', done: true },
  { m: 'Presse à cuisses', d: '3 × 10 · 80 kg', done: false },
  { m: 'Gainage guidé', d: '3 × 40 s', done: false },
];

export default function AppShowcase() {
  return (
    <section id="appli" aria-labelledby="app-title" className="relative overflow-hidden py-section">
      <div className="container-apex grid items-center gap-14 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <SectionHeading id="app-title" eyebrow="L'appli APEX" title={<>La motivation, <Hl tone="accent">version jeu</Hl></>} lead="L'appli est le cœur du concept : elle pilote les machines, garde l'historique et transforme la régularité en défis. Elle est fournie et maintenue par la tête de réseau." />
          <Stagger className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.t} className="block-card-hover">
                <Icon name={f.icon} size={28} className="text-primary-soft" />
                <h3 className="mt-3 text-2xl">{f.t}</h3>
                <p className="mt-1 text-fg-muted">{f.d}</p>
              </div>
            ))}
          </Stagger>
        </div>

        <Reveal className="relative mx-auto w-full max-w-[360px]">
          <div className="relative">
          <div aria-hidden="true" className="absolute -inset-6 -rotate-6 rounded-[48px] bg-primary" />
          <figure className="relative rounded-[44px] border-[10px] border-ink bg-bg p-4 shadow-xl" aria-label="Maquette illustrative de l'écran d'accueil de l'appli APEX">
            <div className="mx-auto mb-3 h-5 w-24 rounded-full bg-ink" aria-hidden="true" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-fg-muted">Bonjour Inès</p>
                <p className="font-display text-2xl font-bold uppercase">Séance 12</p>
              </div>
              <div className="relative flex h-16 w-16 items-center justify-center" aria-label="Niveau 4, 72 % vers le niveau 5">
                <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden="true">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#37414F" strokeWidth="4" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#22C55E" strokeWidth="4" strokeDasharray="94.2" strokeDashoffset={94.2 * 0.28} strokeLinecap="round" />
                </svg>
                <span className="num text-xl">N4</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-control bg-primary p-3 text-ink">
                <Icon name="flame" size={18} />
                <p className="num mt-1 text-3xl leading-none">12 j</p>
                <p className="text-xs font-semibold uppercase">Série en cours</p>
              </div>
              <div className="rounded-control bg-card p-3">
                <Icon name="zap" size={18} className="text-accent-soft" />
                <p className="num mt-1 text-3xl leading-none">+18 %</p>
                <p className="text-xs font-semibold uppercase text-fg-muted">Charge en 2 mois</p>
              </div>
            </div>
            <p className="mt-4 font-display text-lg font-bold uppercase">Programme du jour</p>
            <ul className="mt-2 flex flex-col gap-2">
              {SESSION.map((s) => (
                <li key={s.m} className="flex items-center gap-3 rounded-control bg-card p-2.5">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] ${s.done ? 'bg-accent text-ink' : 'bg-muted text-fg-muted'}`}>
                    <Icon name={s.done ? 'check' : 'scan'} size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{s.m}</span>
                    <span className="block text-sm text-fg-muted">{s.d}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center gap-2 rounded-control border-2 border-dashed border-accent/60 p-2.5 text-sm">
              <Icon name="trophy" size={18} className="shrink-0 text-accent-soft" /> Défi du mois : 12 séances. Il en reste 3.
            </div>
          </figure>
          </div>
          <p className="relative mt-10 text-center text-sm text-fg-muted">Maquette illustrative. Prénom et données fictifs.</p>
        </Reveal>
      </div>
    </section>
  );
}
