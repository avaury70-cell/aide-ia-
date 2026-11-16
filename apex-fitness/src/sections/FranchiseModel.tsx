/** Le modèle franchise — grille « bento » d'atouts + conditions en chiffres-blocs. */
import SectionHeading, { Hl } from '../components/SectionHeading';
import Stagger from '../components/Stagger';
import Icon from '../components/Icon';
import { franchise as f, eur } from '../data/franchise';

const k = (v: number) => `${Math.round(v / 1000)} k€`;

export default function FranchiseModel() {
  return (
    <section id="modele" aria-labelledby="modele-title" className="relative bg-ink py-section">
      <div className="bg-grid pointer-events-none absolute inset-0" />
      <div className="container-apex relative">
        <SectionHeading id="modele-title" eyebrow="Le modèle franchise" title={<>Un business <Hl>simple à piloter</Hl></>} lead="La technologie fait le travail répétitif. Vous vous concentrez sur ce qui compte : vos adhérents, votre équipe, votre ville." />

        {/* Bento : tailles variées 2×1 / 1×1 */}
        <Stagger className="grid gap-4 md:grid-cols-4 md:grid-rows-[auto_auto]">
          <div className="relative overflow-hidden rounded-[20px] bg-primary p-7 text-ink shadow-block md:col-span-2 md:row-span-2">
            <Icon name="building" size={36} />
            <p className="num mt-6 text-8xl leading-none">{f.surfaceMin}–{f.surfaceMax}<span className="text-4xl"> m²</span></p>
            <h3 className="mt-4 text-4xl text-ink">Smart Studio compact</h3>
            <p className="mt-2 max-w-[40ch] text-lg font-medium">En centre-ville ou zone commerciale. Moins de surface, moins de loyer, des machines connectées qui rentabilisent chaque mètre carré.</p>
            <div aria-hidden="true" className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full border-[16px] border-ink/15" />
          </div>
          <Asset icon="users" big={`${f.staffMin}–${f.staffMax}`} title="Salariés" text="L'appli guide, les machines se règlent, vos coachs coachent." />
          <Asset icon="layers" big="1" title="Plateforme centralisée" text="Appli, pilotage des machines, tableau de bord coach : fournis et maintenus." />
          <div className="rounded-[20px] bg-accent p-6 text-ink shadow-block md:col-span-2">
            <Icon name="euro" size={30} />
            <h3 className="mt-3 text-3xl text-ink">4 sources de revenus</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {['Abonnements', 'Coaching augmenté', 'Offres entreprises (B2B)', 'Partenariats kinés / santé'].map((r) => (
                <li key={r} className="rounded-[6px] bg-ink px-3 py-1.5 font-semibold text-fg">{r}</li>
              ))}
            </ul>
          </div>
        </Stagger>

        {/* Conditions financières */}
        <div className="mt-14 flex flex-wrap items-end justify-between gap-4">
          <h3 className="text-4xl sm:text-5xl">Conditions financières</h3>
          <span className="tag-hyp">Hypothèses pédagogiques, non contractuelles</span>
        </div>
        <Stagger as="dl" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Term label="Droit d'entrée" value={k(f.entryFee)} sub="HT" highlight />
          <Term label="Investissement global" value={`${k(f.investMin)}–${k(f.investMax)}`} sub="HT, machines incluses" />
          <Term label="Apport personnel" value={`${k(f.contributionMin)}–${k(f.contributionMax)}`} sub="selon le financement" />
          <Term label="Durée du contrat" value={`${f.contractYears} ans`} sub="renouvelable" />
          <Term label="Redevance d'exploitation" value={`${f.royaltyRate * 100} %`} sub="du CA HT" />
          <Term label="Redevance marketing" value={`${f.marketingRate * 100} %`} sub="du CA HT" />
          <Term label="Plateforme technologique" value={eur(f.platformFee)} sub="HT / mois" />
          <Term label="Formation initiale" value={`${f.trainingWeeks} sem.`} sub={`ouverture ${f.openingMonths} mois après signature`} />
        </Stagger>
        <p className="mt-5 text-faint">Les machines connectées peuvent être financées en location financière. Les montants exacts figureront dans le Document d'Information Précontractuelle (DIP).</p>
      </div>
    </section>
  );
}

function Asset({ icon, big, title, text }: { icon: string; big: string; title: string; text: string }) {
  return (
    <div className="block-card-hover border-2">
      <div className="flex items-start justify-between">
        <span className="num text-6xl leading-none text-primary-soft">{big}</span>
        <Icon name={icon} size={28} className="text-fg-muted" />
      </div>
      <h3 className="mt-4 text-2xl">{title}</h3>
      <p className="mt-1 text-fg-muted">{text}</p>
    </div>
  );
}

function Term({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className={`flex flex-col rounded-card p-5 ${highlight ? 'bg-fg text-ink' : 'border-2 border-line bg-bg'}`}>
      <dt className={`order-1 text-sm font-semibold uppercase tracking-wider ${highlight ? 'text-ink' : 'text-fg-muted'}`}>{label}</dt>
      <dd className="order-2 mt-2">
        <span className="num block text-4xl leading-none">{value}</span>
        <span className={`mt-1 block text-sm ${highlight ? 'text-ink/80' : 'text-faint'}`}>{sub}</span>
      </dd>
    </div>
  );
}
