import { usePageMeta } from '../hooks/usePageMeta';
import MagneticButton from '../components/MagneticButton';
import { LogoMark } from '../components/Logo';

export default function NotFound() {
  usePageMeta('Page introuvable — APEX FITNESS', 'Cette page n\'existe pas.');
  return (
    <div className="container-apex flex min-h-[70vh] flex-col items-center justify-center gap-6 py-20 text-center">
      <LogoMark size={80} />
      <p className="font-mono text-signal">ERREUR 404 · QR NON RECONNU</p>
      <h1 className="text-4xl font-bold sm:text-5xl">Cette machine n'existe pas.</h1>
      <p className="lead mx-auto">La page demandée est introuvable. Revenez à l'accueil pour reprendre votre programme.</p>
      <MagneticButton to="/">Retour à l'accueil</MagneticButton>
    </div>
  );
}
