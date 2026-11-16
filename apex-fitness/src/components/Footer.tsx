import { Link } from 'react-router-dom';
import Logo from './Logo';
import Marquee from './Marquee';

export default function Footer() {
  return (
    <footer className="bg-ink">
      <Marquee tone="primary" items={['Scanne', 'Pousse', 'Progresse', 'Le sport qui s\'adapte à toi']} />
      <div className="container-apex grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Logo size={44} />
          <p className="max-w-[34ch] text-fg-muted">Le sport qui s'adapte à toi. Scanne. Pousse. La machine s'occupe du reste.</p>
        </div>
        <FooterCol title="Franchise" links={[['/#modele', 'Le modèle'], ['/#simulateur', 'Simulateur'], ['/#rejoindre', 'Les 5 étapes'], ['/#candidature', 'Candidater']]} />
        <FooterCol title="Découvrir" links={[['/concept', 'Le concept'], ['/presse', 'Espace presse'], ['/charte', 'Charte graphique']]} />
        <FooterCol title="Légal" links={[['/mentions-legales', 'Mentions légales'], ['/mentions-legales#rgpd', 'Données personnelles (RGPD)'], ['/#faq', 'DIP & FAQ']]} />
      </div>
      <div className="border-t border-line">
        <div className="container-apex flex flex-col gap-2 py-6 text-sm text-faint sm:flex-row sm:items-center sm:justify-between">
          <p><strong className="font-semibold text-fg-muted">Projet pédagogique fictif — Cnam Versailles LCVM</strong> · ESC 132, stratégie de communication multicanale.</p>
          <p>Marque, chiffres et réseau fictifs. Aucune offre de franchise réelle.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <nav aria-label={title}>
      <h2 className="mb-4 text-xl text-primary-soft">{title}</h2>
      <ul className="flex flex-col gap-1">
        {links.map(([to, label]) => (
          <li key={to}><Link to={to} className="inline-block py-1.5 text-fg-muted transition-colors duration-200 hover:text-fg hover:underline hover:decoration-primary hover:decoration-2 hover:underline-offset-4">{label}</Link></li>
        ))}
      </ul>
    </nav>
  );
}
