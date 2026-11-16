import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import MagneticButton from '../components/MagneticButton';
import Counter from '../components/Counter';
import MachineIllustration from '../components/MachineIllustration';
import Icon from '../components/Icon';
import { canRender3D, useReducedMotion } from '../hooks/useMedia';
import type { HeroPhase } from '../three/HeroCanvas';

const HeroCanvas = lazy(() => import('../three/HeroCanvas'));

const PHASE_TEXT: Record<HeroPhase, { label: string; detail: string }> = {
  idle: { label: 'En attente', detail: 'Scanne le QR code de la machine' },
  scan: { label: 'Lecture du QR…', detail: 'Programme « Remise en forme » · séance 12' },
  adjust: { label: 'Réglage automatique', detail: 'Résistance, charge et siège en cours' },
  ready: { label: 'Prêt', detail: 'Charge 45 kg · siège position 4 · 3 × 12' },
};

export default function Hero() {
  const reduced = useReducedMotion();
  const [use3D, setUse3D] = useState(false);
  const [play, setPlay] = useState(0);
  const [phase, setPhase] = useState<HeroPhase>('idle');

  // La 3D est chargée après le premier affichage (le texte reste prioritaire).
  useEffect(() => {
    if (!canRender3D()) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const start = () => setUse3D(true);
    if (w.requestIdleCallback) w.requestIdleCallback(start, { timeout: 1500 });
    else window.setTimeout(start, 400);
  }, []);
  // lancement automatique de la séquence une fois la scène prête
  useEffect(() => {
    if (!use3D) return;
    const t = window.setTimeout(() => setPlay(1), 700);
    return () => window.clearTimeout(t);
  }, [use3D]);

  const replay = useCallback(() => setPlay((p) => p + 1), []);
  const onPhase = useCallback((p: HeroPhase) => setPhase(p), []);
  const status = PHASE_TEXT[use3D ? phase : 'ready'];

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent)]" />
      <div className="bg-halo pointer-events-none absolute inset-0" />

      <div className="container-apex relative grid items-center gap-10 pb-16 pt-10 lg:min-h-[calc(100vh-72px)] lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-6">
        {/* Texte */}
        <div className="flex flex-col gap-7">
          <span className="eyebrow">Réseau de franchise · Smart Studio</span>
          <h1 id="hero-title" className="text-[2.6rem] font-bold leading-[1.02] sm:text-6xl lg:text-[4.4rem]">
            Le sport qui <span className="text-signal">s'adapte</span> à toi.
          </h1>
          <p className="max-w-[46ch] text-lg text-mute sm:text-xl">
            <span className="font-mono text-bone">Scanne. Pousse.</span> La machine s'occupe du reste. Ouvrez un club APEX FITNESS : des machines qui se règlent seules, une équipe réduite, une plateforme clé en main.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <MagneticButton to="/#candidature">
              Recevoir le dossier <Icon name="arrow" size={18} />
            </MagneticButton>
            <MagneticButton to="/#concept" variant="ghost">
              Voir le concept
            </MagneticButton>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-bone/10 pt-6 sm:gap-6">
            <KeyFigure label="m² de Smart Studio">
              <Counter value={250} />–<Counter value={400} />
            </KeyFigure>
            <KeyFigure label="réglage pour l'adhérent">
              <Counter value={0} />
            </KeyFigure>
            <KeyFigure label="salariés par club">
              <Counter value={2} />–<Counter value={3} />
            </KeyFigure>
          </dl>
          <p className="-mt-3 text-xs text-faint"><span className="tag-hyp">Hypothèses pédagogiques</span> — format et effectif cibles du concept.</p>
        </div>

        {/* Visuel 3D */}
        <div className="relative">
          <div
            className="relative aspect-square w-full overflow-hidden rounded-[28px] border border-bone/10 bg-carbon sm:aspect-[4/3] lg:aspect-[4/4.3]"
            onClick={use3D ? replay : undefined}
          >
            {use3D ? (
              <Suspense fallback={<MachineIllustration className="h-full w-full p-8 opacity-60" />}>
                <HeroCanvas play={play} reduced={reduced} onPhase={onPhase} />
              </Suspense>
            ) : (
              <MachineIllustration className="h-full w-full p-8" />
            )}
            <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-bone/5" />
          </div>

          {/* HUD de l'appli (DOM, lisible par les lecteurs d'écran) */}
          <div className="glass absolute -bottom-6 left-4 right-4 flex items-center justify-between gap-4 p-4 sm:left-auto sm:right-6 sm:w-[380px]">
            <div aria-live="polite" className="min-w-0">
              <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-signal">
                <span className={`h-2 w-2 rounded-full ${phase === 'ready' || !use3D ? 'bg-signal' : 'animate-pulse bg-data'}`} />
                {status.label}
              </p>
              <p className="mt-1 text-sm text-bone">{status.detail}</p>
            </div>
            {use3D && (
              <button type="button" onClick={replay} className="shrink-0 rounded-lg border border-bone/15 px-3 py-2 text-xs font-medium text-bone hover:border-signal hover:text-signal">
                <Icon name="scan" size={16} className="mr-1 inline" /> Rejouer
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function KeyFigure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="order-2 text-xs leading-snug text-mute sm:text-sm">{label}</dt>
      <dd className="order-1 font-mono text-xl font-semibold text-bone sm:text-3xl">{children}</dd>
    </div>
  );
}
