/** L'accompagnement — bento : un grand bloc orange + trois blocs. */
import SectionHeading, { Hl } from '../components/SectionHeading';
import Stagger from '../components/Stagger';
import Icon from '../components/Icon';
import PhotoSlot from '../components/PhotoSlot';

const ITEMS = [
  { icon: 'tools', t: 'Outils clés en main', d: "Appli adhérent, tableau de bord coach, logiciel de gestion, planning, paiements, reporting mensuel." },
  { icon: 'megaphone', t: 'Marketing', d: "Campagnes nationales, kit d'ouverture local, templates réseaux sociaux prêts à publier." },
  { icon: 'wrench', t: 'Support technique', d: 'Supervision des machines à distance, maintenance préventive, hotline dédiée 7 j / 7.' },
];

export default function Support() {
  return (
    <section aria-labelledby="support-title" className="relative bg-ink py-section">
      <div className="container-apex">
        <SectionHeading id="support-title" eyebrow="L'accompagnement" title={<>Vous n'êtes <Hl>jamais seul</Hl></>} lead="La tête de réseau prend en charge la technologie et la marque. Vous gardez la main sur votre club." />
        <Stagger className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[20px] bg-primary p-8 text-ink shadow-block md:row-span-2">
            <Icon name="grad" size={40} />
            <p className="num mt-6 text-8xl leading-none">4</p>
            <p className="font-display text-2xl font-bold uppercase">semaines de formation</p>
            <h3 className="mt-6 text-4xl text-ink">Académie APEX</h3>
            <p className="mt-2 text-lg font-medium">Gestion du club, management, vente, pilotage de la plateforme, premiers secours. Puis des modules chaque trimestre.</p>
          </div>
          {ITEMS.map((it) => (
            <div key={it.t} className="block-card-hover border-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-control bg-ink text-primary-soft"><Icon name={it.icon} size={24} /></span>
              <h3 className="mt-4 text-3xl">{it.t}</h3>
              <p className="mt-1 text-fg-muted">{it.d}</p>
            </div>
          ))}
          <PhotoSlot label="Session de formation à l'Académie APEX" ratio="aspect-[16/9] md:aspect-auto md:h-full" />
        </Stagger>
      </div>
    </section>
  );
}
