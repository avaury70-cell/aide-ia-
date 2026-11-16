/** Profils (cas d'usage), profil idéal et les 5 étapes pour rejoindre le réseau. */
import SectionHeading, { Hl } from '../components/SectionHeading';
import Stagger from '../components/Stagger';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';

const PROFILES = [
  { icon: 'zap', t: 'Entrepreneur·e', d: 'Vous voulez créer votre entreprise avec un concept éprouvé et une marque forte.' },
  { icon: 'target', t: 'En reconversion', d: "Cadre ou ex-salarié·e avec un apport, vous voulez un métier de terrain qui a du sens." },
  { icon: 'dumbbell', t: 'Coach sportif', d: 'Vous connaissez le métier et voulez votre salle, sans vous noyer dans la technique.' },
  { icon: 'chart', t: 'Investisseur·se', d: 'Vous envisagez plusieurs clubs avec un·e gérant·e opérationnel·le.' },
];
const CRITERIA = ['Apport personnel de 50 000 à 150 000 €', 'Goût du management et du service', 'Ancrage local, envie de fédérer une communauté', 'Sensibilité santé et bien-être (pas besoin d\'être un athlète)'];
const STEPS = [
  { t: 'Candidature', when: 'J0', d: 'Vous remplissez le formulaire. Rappel sous 72 h ouvrées et envoi du dossier de présentation.' },
  { t: 'Rencontre', when: 'Sem. 2–4', d: "Entretien, visite d'un club pilote, étude de votre zone et de votre plan de financement." },
  { t: 'DIP', when: '≥ 20 jours', d: "Remise du Document d'Information Précontractuelle au moins 20 jours avant toute signature." },
  { t: 'Signature', when: 'Mois 2–3', d: 'Contrat de franchise, validation du local, lancement des travaux et de la formation.' },
  { t: 'Ouverture', when: 'Mois 6–9', d: "Pré-ventes, campagne d'ouverture locale, installation des machines. Premiers adhérents !" },
];

export default function Join() {
  return (
    <section id="rejoindre" aria-labelledby="join-title" className="relative bg-bg py-section">
      <div className="container-apex">
        <SectionHeading id="join-title" eyebrow="Rejoindre le réseau" title={<>Pas besoin d'être un athlète. <Hl tone="accent">Il faut être un bâtisseur.</Hl></>} lead="Nous cherchons des femmes et des hommes qui aiment les gens, savent animer une équipe et veulent s'ancrer dans leur ville." />

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Stagger className="grid gap-4 sm:grid-cols-2">
            {PROFILES.map((p) => (
              <div key={p.t} className="block-card-hover border-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-control bg-primary text-ink"><Icon name={p.icon} size={24} /></span>
                <h3 className="mt-4 text-3xl">{p.t}</h3>
                <p className="mt-1 text-fg-muted">{p.d}</p>
              </div>
            ))}
          </Stagger>
          <Reveal className="rounded-[20px] bg-accent p-7 text-ink shadow-block sm:p-9">
            <span className="inline-block rounded-[4px] bg-ink px-2.5 py-1 font-display text-sm font-bold uppercase tracking-[0.12em] text-accent-soft">Profil idéal</span>
            <ul className="mt-6 flex flex-col gap-5">
              {CRITERIA.map((c) => (
                <li key={c} className="flex gap-3 text-lg font-semibold"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-ink text-accent"><Icon name="check" size={16} /></span>{c}</li>
              ))}
            </ul>
          </Reveal>
        </div>

        <h3 className="mb-8 mt-20 text-5xl">Les 5 étapes vers votre club</h3>
        <Stagger as="ol" className="grid gap-4 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.t} className={`relative flex flex-col rounded-card p-6 ${i === 2 ? 'bg-fg text-ink' : 'border-2 border-line bg-card'}`}>
              <div className="flex items-center justify-between">
                <span className={`num flex h-14 w-14 items-center justify-center rounded-control text-4xl ${i === 2 ? 'bg-ink text-fg' : 'bg-primary text-ink'}`}>{i + 1}</span>
                <span className={`text-sm font-bold uppercase tracking-wider ${i === 2 ? 'text-ink' : 'text-accent-soft'}`}>{s.when}</span>
              </div>
              <h4 className={`mt-5 text-3xl ${i === 2 ? 'text-ink' : ''}`}>{s.t}</h4>
              <p className={`mt-2 ${i === 2 ? 'font-medium' : 'text-fg-muted'}`}>{s.d}</p>
            </li>
          ))}
        </Stagger>
        <p className="mt-5 text-faint"><span className="tag-hyp">Calendrier indicatif</span> Délais d'illustration, sauf celui du DIP qui est légal et impératif.</p>
      </div>
    </section>
  );
}
