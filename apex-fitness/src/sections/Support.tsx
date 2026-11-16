import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';
import PhotoSlot from '../components/PhotoSlot';

const ITEMS = [
  { icon: 'grad', t: 'Formation', d: '4 semaines avant l\'ouverture : gestion du club, management, vente, pilotage de la plateforme et premiers secours. Puis des modules continus chaque trimestre.', tag: 'Académie APEX' },
  { icon: 'tools', t: 'Outils clés en main', d: 'Appli adhérent à vos couleurs locales, tableau de bord coach, logiciel de gestion, planning, paiements et reporting mensuel.', tag: 'Plateforme' },
  { icon: 'megaphone', t: 'Marketing', d: 'Campagnes nationales, kit d\'ouverture local (affichage, réseaux sociaux, partenariats), templates prêts à publier et conseil en ciblage.', tag: 'National + local' },
  { icon: 'wrench', t: 'Support technique', d: 'Supervision des machines à distance, maintenance préventive, hotline dédiée et intervention sur site selon un niveau de service défini au contrat.', tag: 'Supervision 7 j / 7' },
];

export default function Support() {
  return (
    <section aria-labelledby="support-title" className="section relative border-t border-bone/5">
      <div className="container-apex">
        <SectionHeading id="support-title" eyebrow="L'accompagnement" title={<>Vous n'êtes <span className="text-signal">jamais seul</span> derrière le comptoir.</>} lead="La tête de réseau prend en charge la technologie et la marque. Vous gardez la main sur votre club." />
        <div className="grid gap-5 md:grid-cols-2">
          {ITEMS.map((it, i) => (
            <Reveal key={it.t} delay={i * 80} className="glass group flex gap-5 p-6 sm:p-8">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-signal/10 text-signal transition-transform duration-300 group-hover:scale-110"><Icon name={it.icon} size={24} /></span>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-data">{it.tag}</p>
                <h3 className="mt-1 text-2xl font-semibold">{it.t}</h3>
                <p className="mt-2 text-mute">{it.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <PhotoSlot label="Session de formation à l'Académie APEX" ratio="aspect-[16/9]" />
          <PhotoSlot label="Tableau de bord coach sur tablette" ratio="aspect-[16/9]" />
        </div>
      </div>
    </section>
  );
}
