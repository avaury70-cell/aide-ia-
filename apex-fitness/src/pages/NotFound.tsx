import { usePageMeta } from '../hooks/usePageMeta';
import MagneticButton from '../components/MagneticButton';
import { LogoMark } from '../components/Logo';
import { Hl } from '../components/SectionHeading';

export default function NotFound() {
  usePageMeta('Page introuvable — APEX FITNESS', "Cette page n'existe pas.");
  return (
    <div className="relative overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0" />
      <div className="container-apex relative flex min-h-[72vh] flex-col items-center justify-center gap-6 py-20 text-center">
        <LogoMark size={96} tone="block" />
        <p className="num text-9xl leading-none text-primary-soft">404</p>
        <h1 className="text-6xl font-extrabold">QR <Hl>non reconnu</Hl></h1>
        <p className="lead mx-auto">Cette machine n'existe pas. Reviens à l'accueil pour reprendre ton programme.</p>
        <MagneticButton to="/">Retour à l'accueil</MagneticButton>
      </div>
    </div>
  );
}
