import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';

const QA: { q: string; a: React.ReactNode }[] = [
  {
    q: "Qu'est-ce que le DIP et quand vais-je le recevoir ?",
    a: <>Le <strong>Document d'Information Précontractuelle</strong> est imposé par la loi Doubin (articles L330-3 et R330-1 du Code de commerce). Il doit vous être remis <strong>au moins 20 jours avant</strong> la signature du contrat ou le versement de toute somme. Il présente notamment l'entreprise et ses dirigeants, l'état général et local du marché, l'historique et la liste des membres du réseau, les comptes annuels, la durée, les conditions de renouvellement, de résiliation et de cession du contrat, ainsi que la nature et le montant des dépenses et investissements à engager.</>,
  },
  {
    q: 'Le DIP engage-t-il quelque chose ?',
    a: "Non. C'est un document d'information : il vous permet de décider en connaissance de cause. Nous vous recommandons de le faire relire par un avocat spécialisé et un expert-comptable. Une information incomplète ou trompeuse peut entraîner la nullité du contrat.",
  },
  { q: 'Faut-il être coach sportif pour devenir franchisé ?', a: "Non. Le rôle du franchisé est celui d'un chef d'entreprise : animer l'équipe, développer les adhérents et les partenariats locaux. Les coachs sont recrutés et formés avec notre appui." },
  { q: 'Quel apport personnel faut-il prévoir ?', a: "Dans nos hypothèses, 50 000 à 150 000 € selon la taille du club et le financement des machines (achat ou location financière). Nous vous mettons en relation avec des banques et réseaux de prêts d'honneur. Montants illustratifs, à confirmer dans le DIP." },
  { q: 'Que se passe-t-il si une machine tombe en panne ?', a: "Les machines sont supervisées à distance : la plupart des incidents sont détectés avant l'adhérent. Le support technique intervient selon un niveau de service défini au contrat ; en attendant, l'appli réoriente automatiquement le programme vers un autre poste." },
  { q: 'Les données des adhérents sont-elles protégées ?', a: "Oui. La plateforme est conçue selon le RGPD : consentement explicite, données de santé limitées au strict nécessaire, hébergement en Europe, droit d'accès et de suppression depuis l'appli. Le franchisé et la tête de réseau ont des rôles définis (responsable de traitement / sous-traitant)." },
  { q: "Ai-je l'exclusivité sur ma zone ?", a: "Une zone d'exclusivité territoriale peut être définie au contrat, en fonction de la population et de l'accessibilité. Son périmètre exact figure dans le DIP et le contrat." },
  { q: 'Combien de temps entre la candidature et l\'ouverture ?', a: 'Comptez en général 6 à 9 mois après signature (hypothèse), selon les travaux et l\'obtention des financements.' },
];

export default function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="section relative border-t border-bone/5">
      <div className="container-apex grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading id="faq-title" eyebrow="Questions fréquentes" title="Tout ce qu'il faut savoir avant de se lancer." lead="Une question qui n'est pas ici ? Posez-la dans le formulaire : un membre de l'équipe développement vous répond." />
        <Reveal className="flex flex-col gap-3">
          {QA.map((item, i) => (
            <details key={i} className="group glass open:border-signal/30" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-display text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {item.q}
                <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-bone/15 text-signal transition-transform duration-300 group-open:rotate-45">+</span>
              </summary>
              <div className="px-5 pb-5 text-mute">{item.a}</div>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
