import { usePageMeta } from '../hooks/usePageMeta';

export default function Mentions() {
  usePageMeta('Mentions légales et données personnelles — APEX FITNESS', 'Mentions légales et politique de protection des données du site APEX FITNESS (projet pédagogique fictif).');
  return (
    <div className="container-apex max-w-3xl py-16 lg:py-24">
      <span className="eyebrow">Informations légales</span>
      <h1 className="mt-4 text-5xl font-bold">Mentions légales</h1>
      <div className="mt-10 flex flex-col gap-8 text-mute [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold">
        <section>
          <h2>Nature du site</h2>
          <p><strong className="text-bone">Projet pédagogique fictif — Cnam Versailles, LCVM, cours ESC 132 (stratégie de communication multicanale).</strong> APEX FITNESS est une marque imaginaire. Aucune offre de franchise n'est proposée, aucun club n'existe et tous les chiffres sont des hypothèses d'illustration.</p>
        </section>
        <section>
          <h2>Éditeur</h2>
          <p>[NOM DE L'ÉTUDIANT·E OU DU GROUPE] — Cnam Versailles. Directeur·rice de la publication : [À COMPLÉTER].</p>
        </section>
        <section>
          <h2>Hébergement</h2>
          <p>[NOM, ADRESSE ET TÉLÉPHONE DE L'HÉBERGEUR À COMPLÉTER].</p>
        </section>
        <section>
          <h2>Propriété intellectuelle</h2>
          <p>Logo, charte et contenus créés pour ce projet. Les visuels 3D sont générés par le code (géométrie procédurale). Typographies Space Grotesk, Inter et JetBrains Mono sous licence SIL Open Font License.</p>
        </section>
        <section id="rgpd">
          <h2>Données personnelles (RGPD)</h2>
          <p>Dans ce prototype, <strong className="text-bone">le formulaire n'envoie et ne stocke aucune donnée</strong>. Dans une version réelle, la politique serait la suivante :</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Finalité : traiter votre demande de dossier de candidature et vous recontacter.</li>
            <li>Base légale : votre consentement (article 6.1.a du RGPD).</li>
            <li>Données : identité, coordonnées, zone, apport indicatif, profil, message.</li>
            <li>Durée de conservation : 3 ans à compter du dernier contact.</li>
            <li>Destinataires : équipe développement de la tête de réseau uniquement.</li>
            <li>Vos droits : accès, rectification, effacement, opposition, limitation, portabilité, retrait du consentement, en écrivant à dpo@apex-fitness.example. Réclamation possible auprès de la CNIL.</li>
          </ul>
        </section>
        <section>
          <h2>Cookies</h2>
          <p>Ce site ne dépose aucun cookie de mesure d'audience ni publicitaire. Les polices sont chargées depuis Google Fonts.</p>
        </section>
      </div>
    </div>
  );
}
