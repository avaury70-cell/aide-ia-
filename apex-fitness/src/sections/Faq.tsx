import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';

const QA: { q: string; a: React.ReactNode }[] = [
  {
    q: "Qu'est-ce que le DIP et quand vais-je le recevoir ?",
    a: <>Le <strong className="text-fg">Document d'Information Précontractuelle</strong> est imposé par la loi Doubin (articles L330-3 et R330-1 du Code de commerce). Il doit vous être remis <strong className="text-fg">au moins 20 jours avant</strong> la signature du contrat ou le versement de toute somme. Il présente notamment l'entreprise et ses dirigeants, l'état général et local du marché, l'historique et la liste des membres du réseau, les comptes annuels, la durée et les conditions de renouvellement, de résiliation et de cession du contrat, ainsi que la nature et le montant des investissements à engager.</>,
  },
  { q: 'Le DIP engage-t-il quelque chose ?', a: "Non. C'est un document d'information pour décider en connaissance de cause. Faites-le relire par un avocat spécialisé et un expert-comptable. Une information incomplète ou trompeuse peut entraîner la nullité du contrat." },
  { q: 'Faut-il être coach sportif ?', a: "Non. Le franchisé est un chef d'entreprise : il anime l'équipe, développe les adhérents et les partenariats locaux. Les coachs sont recrutés et formés avec notre appui." },
  { q: 'Quel apport personnel prévoir ?', a: "Dans nos hypothèses, 50 000 à 150 000 € selon la taille du club et le financement des machines (achat ou location financière). Montants illustratifs, à confirmer dans le DIP." },
  { q: 'Et si une machine tombe en panne ?', a: "Les machines sont supervisées à distance : la plupart des incidents sont détectés avant l'adhérent. En attendant l'intervention, l'appli réoriente le programme vers un autre poste." },
  { q: 'Les données des adhérents sont-elles protégées ?', a: "Oui : consentement explicite, données de santé limitées au strict nécessaire, hébergement en Europe, droit d'accès et de suppression depuis l'appli, rôles RGPD définis entre franchisé et tête de réseau." },
  { q: "Ai-je l'exclusivité sur ma zone ?", a: "Une zone d'exclusivité territoriale peut être définie au contrat, selon la population et l'accessibilité. Son périmètre figure dans le DIP et le contrat." },
  { q: "Combien de temps jusqu'à l'ouverture ?", a: "En général 6 à 9 mois après signature (hypothèse), selon les travaux et l'obtention des financements." },
];

export default function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="relative bg-bg py-section">
      <div className="container-apex grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading id="faq-title" eyebrow="FAQ" title="Avant de vous lancer" lead="Une autre question ? Posez-la dans le formulaire : l'équipe développement vous répond." />
        </div>
        <Reveal className="flex flex-col gap-3">
          {QA.map((item, i) => (
            <details key={i} className="group rounded-card border-2 border-line bg-card transition-colors duration-200 open:border-primary hover:border-primary/60" open={i === 0}>
              <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 p-5 font-display text-2xl font-bold uppercase leading-tight [&::-webkit-details-marker]:hidden">
                {item.q}
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary text-ink transition-transform duration-300 group-open:rotate-180"><Icon name="down" size={22} /></span>
              </summary>
              <div className="px-5 pb-6 text-lg text-fg-muted">{item.a}</div>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
