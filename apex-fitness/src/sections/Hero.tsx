/**
 * HERO — bloc d'accroche : titre condensé XXL, mot surligné par un bloc orange,
 * machine 3D dans un « bloc » à ombre décalée, HUD gamifié de l'appli,
 * puis rangée de chiffres-blocs et bandeau défilant.
 */
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import MagneticButton from '../components/MagneticButton';
import Counter from '../components/Counter';
import MachineIllustration from '../components/MachineIllustration';
import Marquee from '../components/Marquee';
import Icon from '../components/Icon';
import Stagger from '../components/Stagger';
import { canRender3D, useReducedMotion } from '../hooks/useMedia';
import type { HeroPhase } from '../three/HeroCanvas';

const HeroCanvas = lazy(() => import('../three/HeroCanvas'));

const PHASES: Record<HeroPhase, { label: string; detail: string; pct: number }> = {
  idle: { label: 'En attente du scan', detail: 'Approche ton téléphone du QR code', pct: 0 },
  scan: { label: 'Lecture du QR…', detail: 'Programme « Remise en forme » · séance 12', pct: 35 },
  adjust: { label: 'Réglage automatique', detail: 'Résistance, charge et siège', pct: 75 },
  ready: { label: 'Prêt, à toi de pousser', detail: '45 kg · siège 4 · 3 × 12', pct: 100 },
};

export default function Hero() {
  const reduced = useReducedMotion();
  const [use3D, setUse3D] = useState(false);
  const [play, setPlay] = useState(0);
  const [phase, setPhase] = useState<HeroPhase>('idle');

  // 3D chargée après le premier affichage : le texte (LCP) reste prioritaire.
  useEffect(() => {
    if (!canRender3D()) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const start = () => setUse3D(true);
    if (w.requestIdleCallback) w.requestIdleCallback(start, { timeout: 1500 });
    else window.setTimeout(start, 400);
  }, []);
  useEffect(() => {
    if (!use3D) return;
    const t = window.setTimeout(() => setPlay(1), 700);
    return () => window.clearTimeout(t);
  }, [use3D]);

  const replay = useCallback(() => setPlay((p) => p + 1), []);
  const onPhase = useCallback((p: HeroPhase) => setPhase(p), []);
  const st = PHASES[use3D ? phase : 'ready'];

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0" />
      {/* formes géométriques de fond */}

      <div className="container-apex relative grid items-center gap-12 pb-20 pt-10 lg:grid-cols-[1.08fr_1fr] lg:pb-24 lg:pt-14">
        <div className="flex flex-col gap-7">
          <span className="eyebrow">Réseau de franchise · Smart Studio</span>
          <h1 id="hero-title" className="text-[3.6rem] font-extrabold leading-[0.92] sm:text-[5.5rem] lg:text-[7rem]">
            <span className="block">Le sport qui</span>
            <span className="relative z-0 my-1 inline-block -rotate-2 rounded-[10px] bg-primary px-3 pb-1 text-ink shadow-block">s'adapte</span>
            <span className="relative z-10 mt-3 block">à toi.</span>
          </h1>
          <p className="max-w-[44ch] text-xl text-fg-muted">
            <strong className="font-semibold text-fg">Scanne. Pousse. La machine s'occupe du reste.</strong> Ouvrez un club APEX FITNESS : des machines qui se règlent seules, une petite équipe, une plateforme clé en main.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <MagneticButton to="/#candidature">Recevoir le dossier <Icon name="arrow" size={20} /></MagneticButton>
            <MagneticButton to="/#concept" variant="secondary"><Icon name="play" size={18} /> Voir le concept</MagneticButton>
          </div>
        </div>

        {/* Bloc visuel 3D */}
        <div className="relative pb-10 sm:pb-6">
          <div className="relative aspect-square overflow-hidden rounded-[20px] border-2 border-primary bg-ink shadow-block-primary sm:aspect-[4/3.6]" onClick={use3D ? replay : undefined}>
            {use3D ? (
              <Suspense fallback={<MachineIllustration className="h-full w-full p-8 opacity-60" />}>
                <HeroCanvas play={play} reduced={reduced} onPhase={onPhase} />
              </Suspense>
            ) : (
              <MachineIllustration className="h-full w-full p-8" />
            )}
            <span className="absolute left-4 top-4 rounded-[4px] bg-fg px-2 py-0.5 font-display text-sm font-bold uppercase tracking-wider text-ink">Machine n° 04 · Poussée</span>
          </div>

          {/* HUD de l'appli, gamifié (DOM lisible par les lecteurs d'écran) */}
          <div className="absolute -bottom-2 left-3 right-3 rounded-card border-2 border-line bg-card p-4 shadow-xl sm:left-auto sm:right-[-12px] sm:w-[360px]">
            <div className="flex items-start justify-between gap-3">
              <div aria-live="polite" className="min-w-0">
                <p className="flex items-center gap-2 font-display text-base font-bold uppercase tracking-wide text-accent-soft">
                  <span className={`h-2.5 w-2.5 rounded-[3px] ${st.pct === 100 ? 'bg-accent' : 'animate-pulse bg-primary'}`} /> {st.label}
                </p>
                <p className="mt-0.5 text-fg">{st.detail}</p>
              </div>
              {use3D && (
                <button type="button" onClick={replay} aria-label="Rejouer l'animation du scan" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-muted text-fg transition-colors duration-200 hover:bg-primary hover:text-ink">
                  <Icon name="replay" size={18} />
                </button>
              )}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink" role="progressbar" aria-label="Préparation de la machine" aria-valuenow={st.pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out" style={{ width: `${st.pct}%` }} />
            </div>
            <p className="mt-3 flex items-center gap-4 text-sm text-fg-muted">
              <span className="flex items-center gap-1"><Icon name="flame" size={16} className="text-primary-soft" /> Série de 12 jours</span>
              <span className="flex items-center gap-1"><Icon name="trophy" size={16} className="text-accent-soft" /> Niveau 4</span>
            </p>
          </div>
        </div>
      </div>

      {/* Chiffres-blocs */}
      <div className="container-apex relative pb-16">
        <Stagger as="dl" className="grid gap-4 sm:grid-cols-3">
          <StatBlock tone="primary" label="m² de Smart Studio"><Counter value={250} />–<Counter value={400} /></StatBlock>
          <StatBlock tone="card" label="réglage pour l'adhérent"><Counter value={0} /></StatBlock>
          <StatBlock tone="accent" label="salariés par club"><Counter value={2} />–<Counter value={3} /></StatBlock>
        </Stagger>
        <p className="mt-4 text-sm text-faint"><span className="tag-hyp">Hypothèses pédagogiques</span> Format et effectif cibles du concept.</p>
      </div>
      <Marquee tone="ink" items={['Scanne', 'Pousse', 'Progresse', 'Zéro réglage', 'Programme sur mesure', 'Progression visible']} />
    </section>
  );
}

function StatBlock({ tone, label, children }: { tone: 'primary' | 'accent' | 'card'; label: string; children: React.ReactNode }) {
  const cls = tone === 'primary' ? 'bg-primary text-ink' : tone === 'accent' ? 'bg-accent text-ink' : 'bg-card text-fg border-2 border-line';
  return (
    <div className={`flex flex-col rounded-card p-6 shadow-block ${cls}`}>
      <dt className={`order-2 font-display text-lg font-semibold uppercase tracking-wide ${tone === 'card' ? 'text-fg-muted' : ''}`}>{label}</dt>
      <dd className="num order-1 text-6xl leading-none sm:text-7xl">{children}</dd>
    </div>
  );
}
