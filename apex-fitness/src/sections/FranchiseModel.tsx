import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';
import { franchise as f, eur } from '../data/franchise';

const ASSETS = [
  { icon: 'building', t: 'Smart Studio compact', d: `${f.surfaceMin} à ${f.surfaceMax} m², en centre-ville ou zone commerciale. Moins de surface, moins de loyer.` },
  { icon: 'user', t: 'Peu de personnel', d: `${f.staffMin} à ${f.staffMax} salariés : l'appli guide, les machines se règlent, vos coachs coachent.` },
  { icon: 'layers', t: 'Plateforme centralisée', d: "Appli adhérent, pilotage des machines et tableau de bord coach, fournis et maintenus par la tête de réseau." },
  { icon: 'euro', t: 'Revenus multiples', d: 'Abonnements, coaching augmenté, offres entreprises (B2B) et partenariats kinés / santé.' },
];

const TERMS = [
  ['Droit d\'entrée', eur(f.entryFee) + ' HT'],
  ['Investissement global', `${eur(f.investMin)} – ${eur(f.investMax)} HT`],
  ['Apport personnel', `${eur(f.contributionMin)} – ${eur(f.contributionMax)}`],
  ['Redevance d\'exploitation', `${(f.royaltyRate * 100).toLocaleString('fr-FR')} % du CA HT`],
  ['Redevance marketing', `${(f.marketingRate * 100).toLocaleString('fr-FR')} % du CA HT`],
  ['Plateforme technologique', `${eur(f.platformFee)} HT / mois`],
  ['Durée du contrat', `${f.contractYears} ans renouvelables`],
  ['Formation initiale', `${f.trainingWeeks} semaines`],
  ['Délai d\'ouverture', `${f.openingMonths} mois après signature`],
];

export default function FranchiseModel() {
  return (
    <section id="modele" aria-labelledby="modele-title" className="section relative border-t border-bone/5">
      <div className="bg-halo pointer-events-none absolute inset-0 opacity-60" />
      <div className="container-apex relative">
        <SectionHeading
          id="modele-title"
          eyebrow="Le modèle franchise"
          title={<>Un business <span className="text-signal">simple à piloter</span>, pensé pour durer.</>}
          lead="La technologie fait le travail répétitif. Vous vous concentrez sur ce qui compte : vos adhérents, votre équipe, votre ville."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ASSETS.map((a, i) => (
            <Reveal key={a.t} delay={i * 80} className="glass flex flex-col gap-3 p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-control bg-data/10 text-data"><Icon name={a.icon} /></span>
              <h3 className="text-xl font-semibold">{a.t}</h3>
              <p className="text-mute">{a.d}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 overflow-hidden rounded-card border border-bone/10 bg-graphite/70">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bone/10 px-6 py-4">
            <h3 className="text-xl font-semibold">Conditions financières</h3>
            <span className="tag-hyp">Hypothèses pédagogiques — non contractuelles</span>
          </div>
          <dl className="grid sm:grid-cols-2 lg:grid-cols-3">
            {TERMS.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1 border-b border-bone/5 px-6 py-5 sm:border-r">
                <dt className="text-sm text-mute">{k}</dt>
                <dd className="font-mono text-lg font-semibold text-bone">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="px-6 py-4 text-sm text-faint">
            Les machines connectées peuvent être financées en location financière. Les montants exacts figureront dans le Document d'Information Précontractuelle (DIP).
          </p>
        </Reveal>
      </div>
    </section>
  );
}
