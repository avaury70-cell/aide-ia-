import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';

const PROFILES = [
  { t: 'Entrepreneur·e', d: 'Vous voulez créer votre entreprise avec un concept éprouvé et une marque forte.' },
  { t: 'En reconversion', d: 'Cadre ou ex-salarié·e, vous disposez d\'un apport et voulez un métier de terrain qui a du sens.' },
  { t: 'Coach sportif', d: 'Vous connaissez le métier et voulez monter votre salle sans vous noyer dans la technique.' },
  { t: 'Investisseur·se', d: 'Vous envisagez plusieurs clubs avec un·e gérant·e opérationnel·le.' },
];
const CRITERIA = ['Apport personnel de 50 000 à 150 000 €', 'Goût du management et du service', 'Ancrage local, envie de fédérer une communauté', 'Sensibilité santé et bien-être, pas besoin d\'être un athlète'];

const STEPS = [
  { t: 'Candidature', when: 'J0', d: 'Vous remplissez le formulaire. Nous vous rappelons sous 72 h ouvrées et vous envoyons le dossier de présentation.' },
  { t: 'Rencontre', when: 'Semaines 2–4', d: 'Entretien découverte, visite d\'un club pilote, étude de votre zone et de votre plan de financement.' },
  { t: 'DIP', when: '≥ 20 jours avant signature', d: 'Remise du Document d\'Information Précontractuelle. Vous disposez d\'au moins 20 jours pour l\'étudier, avec votre avocat ou expert-comptable.' },
  { t: 'Signature', when: 'Mois 2–3', d: 'Signature du contrat de franchise, validation du local, lancement des travaux et de la formation.' },
  { t: 'Ouverture', when: 'Mois 6–9', d: 'Pré-ventes, campagne d\'ouverture locale, installation des machines connectées. Votre club accueille ses premiers adhérents.' },
];

export default function Join() {
  return (
    <section id="rejoindre" aria-labelledby="join-title" className="section relative border-t border-bone/5">
      <div className="container-apex">
        <SectionHeading id="join-title" eyebrow="Rejoindre le réseau" title={<>Pas besoin d'être un athlète. <span className="text-signal">Il faut être un bâtisseur.</span></>} lead="Nous cherchons des femmes et des hommes qui aiment les gens, savent animer une équipe et veulent s'ancrer dans leur ville." />

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {PROFILES.map((p, i) => (
              <Reveal key={p.t} delay={i * 70} className="rounded-card border border-bone/10 bg-graphite/60 p-6">
                <h3 className="text-xl font-semibold">{p.t}</h3>
                <p className="mt-2 text-mute">{p.d}</p>
              </Reveal>
            ))}
          </div>
          <Reveal delay={150} className="glass p-6 sm:p-8">
            <h3 className="font-mono text-sm uppercase tracking-widest text-signal">Le profil idéal</h3>
            <ul className="mt-5 flex flex-col gap-4">
              {CRITERIA.map((c) => (
                <li key={c} className="flex gap-3"><Icon name="check" className="mt-0.5 shrink-0 text-signal" /> <span>{c}</span></li>
              ))}
            </ul>
          </Reveal>
        </div>

        <h3 className="mb-8 mt-20 text-3xl font-semibold">Les 5 étapes pour ouvrir votre club</h3>
        <ol className="relative grid gap-5 lg:grid-cols-5">
          <div aria-hidden="true" className="absolute left-[22px] top-0 h-full w-px bg-gradient-to-b from-signal via-data to-transparent lg:left-0 lg:top-[22px] lg:h-px lg:w-full lg:bg-gradient-to-r" />
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.t} delay={i * 90} className="relative flex gap-4 lg:flex-col">
              <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-signal/50 bg-carbon font-mono text-sm text-signal">{i + 1}</span>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-data">{s.when}</p>
                <h4 className="mt-1 text-xl font-semibold">{s.t}</h4>
                <p className="mt-2 text-sm text-mute">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </ol>
        <p className="mt-6 text-xs text-faint"><span className="tag-hyp">Calendrier indicatif</span> Délais donnés à titre d'illustration, hors délai légal du DIP qui, lui, est impératif.</p>
      </div>
    </section>
  );
}
