import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-bone/10 bg-carbon">
      <div className="container-apex grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-[34ch] text-sm text-mute">Le sport qui s'adapte à toi. Scanne. Pousse. La machine s'occupe du reste.</p>
        </div>
        <FooterCol title="Franchise" links={[['/#modele', 'Le modèle'], ['/#simulateur', 'Simulateur'], ['/#rejoindre', 'Les 5 étapes'], ['/#candidature', 'Candidater']]} />
        <FooterCol title="Découvrir" links={[['/concept', 'Le concept'], ['/presse', 'Espace presse'], ['/charte', 'Charte graphique']]} />
        <FooterCol title="Légal" links={[['/mentions-legales', 'Mentions légales'], ['/mentions-legales#rgpd', 'Données personnelles (RGPD)'], ['/#faq', 'DIP & FAQ']]} />
      </div>
      <div className="border-t border-bone/10">
        <div className="container-apex flex flex-col gap-2 py-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            <strong className="font-semibold text-mute">Projet pédagogique fictif — Cnam Versailles LCVM</strong> · ESC 132, stratégie de communication multicanale.
          </p>
          <p>Marque, chiffres et réseau fictifs. Aucune offre de franchise réelle.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <nav aria-label={title}>
      <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-faint">{title}</h2>
      <ul className="flex flex-col gap-2.5">
        {links.map(([to, label]) => (
          <li key={to}>
            <Link to={to} className="text-sm text-mute transition-colors hover:text-signal">{label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
