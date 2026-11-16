/**
 * « Le concept en 3 étapes » — scrollytelling 3D (une seule section épinglée,
 * conformément au skill : pas plus de 1–2 pins par page).
 * Desktop + 3D : position sticky sur 320vh, progression fournie par GSAP ScrollTrigger (scrub).
 * Mobile / reduced-motion / sans WebGL : 3 blocs empilés, sans 3D.
 */
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import SectionHeading, { Hl } from '../components/SectionHeading';
import Stagger from '../components/Stagger';
import Icon from '../components/Icon';
import MachineIllustration from '../components/MachineIllustration';
import { canRender3D, useInView, useMediaQuery, useReducedMotion } from '../hooks/useMedia';

const StoryCanvas = lazy(() => import('../three/StoryCanvas'));

const STEPS = [
  { n: '01', icon: 'scan', title: 'Scanne', text: "Ouvre l'appli APEX et scanne le QR code de la machine. Ton programme du jour s'affiche : exercice, séries, tempo, consignes en vidéo.", hud: 'QR détecté, programme chargé' },
  { n: '02', icon: 'dial', title: 'Ajuste', text: 'La machine règle seule la résistance, la charge et la position du siège selon ton objectif : perte de poids, prise de masse, remise en forme ou rééducation.', hud: 'Réglage terminé : 45 kg, siège 4' },
  { n: '03', icon: 'chart', title: 'Progresse', text: 'Chaque série est enregistrée. Trop facile ? La charge monte à la prochaine séance. Trop dur ? Elle baisse. Tu vois tes progrès en temps réel, ton coach aussi.', hud: 'Série validée : +2,5 kg la prochaine fois' },
];

export default function HowItWorks() {
  const reduced = useReducedMotion();
  const desktop = useMediaQuery('(min-width: 1024px)');
  const [can3D, setCan3D] = useState(false);
  useEffect(() => setCan3D(canRender3D()), []);
  const immersive = desktop && can3D && !reduced;

  return (
    <section id="concept" aria-labelledby="concept-title" className="relative bg-ink pt-section">
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-50" />
      <div className="container-apex relative">
        <SectionHeading
          id="concept-title"
          eyebrow="Le concept en 3 étapes"
          title={<>Scanne. Pousse. <Hl tone="accent">C'est réglé.</Hl></>}
          lead="Chaque machine porte un QR code. L'appli APEX contient le programme de l'adhérent ; la machine l'exécute."
        />
      </div>
      {immersive ? <Immersive /> : <Stacked />}
    </section>
  );
}

function Immersive() {
  const outer = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const invalidate = useRef<() => void>(() => {});
  const [active, setActive] = useState(0);
  const near = useInView(outer, '600px 0px');
  const bind = useCallback((fn: () => void) => (invalidate.current = fn), []);

  useEffect(() => {
    let kill = () => {};
    let cancelled = false;
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
      if (cancelled || !outer.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const st = ScrollTrigger.create({
        trigger: outer.current,
        start: 'top top+=75',
        end: 'bottom bottom',
        scrub: 1, // skill : scrub 0.5–1.5 pour un lien naturel avec la barre de défilement
        onUpdate: (self) => {
          progress.current = self.progress;
          setActive(Math.min(2, Math.floor(self.progress * 3)));
          invalidate.current();
        },
      });
      kill = () => st.kill();
    })();
    return () => {
      cancelled = true;
      kill();
    };
  }, []);

  return (
    <div ref={outer} className="relative h-[320vh]">
      <div className="sticky top-[75px] h-[calc(100vh-75px)] overflow-hidden">
        <div className="container-apex grid h-full grid-cols-[0.8fr_1.2fr] items-center gap-10">
          <ol className="flex flex-col gap-3" aria-label="Les 3 étapes">
            {STEPS.map((s, i) => {
              const on = active === i;
              return (
                <li key={s.n} aria-current={on ? 'step' : undefined} className={`rounded-card border-2 p-6 transition-[background-color,border-color,color] duration-300 ${on ? 'border-primary bg-primary text-ink shadow-block' : 'border-line bg-bg text-fg'}`}>
                  <div className="flex items-center gap-4">
                    <span className={`num text-5xl leading-none ${on ? 'text-ink' : 'text-primary-soft'}`}>{s.n}</span>
                    <h3 className={`text-4xl ${on ? 'text-ink' : ''}`}>{s.title}</h3>
                  </div>
                  <p className={`mt-3 ${on ? 'font-medium text-ink' : 'text-fg-muted'}`}>{s.text}</p>
                </li>
              );
            })}
          </ol>
          <div className="relative h-[80%] overflow-hidden rounded-[20px] border-2 border-line">
            {near && (
              <Suspense fallback={<MachineIllustration className="h-full w-full p-10 opacity-60" />}>
                <StoryCanvas progress={progress} bindInvalidate={bind} instant={false} />
              </Suspense>
            )}
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-6 rounded-card border-2 border-line bg-card p-5 shadow-xl">
              <div>
                <p className="font-display text-base font-bold uppercase tracking-wider text-accent-soft">Étape {STEPS[active].n} · appli APEX</p>
                <p className="mt-1 font-display text-2xl font-bold uppercase">{STEPS[active].hud}</p>
              </div>
              {active === 2 && <Sparkline />}
            </div>
            {/* indicateur d'étape */}
            <div className="absolute right-5 top-5 flex gap-1.5" aria-hidden="true">
              {STEPS.map((_, i) => <span key={i} className={`h-2 rounded-full transition-all duration-300 ${i === active ? 'w-8 bg-primary' : 'w-2 bg-fg/30'}`} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mini-courbe illustrative (charge par séance). */
function Sparkline() {
  const pts = [30, 32.5, 32.5, 35, 37.5, 37.5, 40, 42.5, 45];
  const max = 48, min = 28, w = 150, h = 48;
  const y = (v: number) => h - ((v - min) / (max - min)) * h;
  const d = pts.map((v, i) => `${i ? 'L' : 'M'}${(i / (pts.length - 1)) * w},${y(v)}`).join(' ');
  return (
    <figure className="shrink-0" aria-label="Exemple illustratif : charge passée de 30 à 45 kg en 9 séances">
      <svg width={w} height={h + 8} viewBox={`0 -4 ${w} ${h + 8}`} aria-hidden="true">
        <path d={d} fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx={w - 4} cy={y(45)} r="5" fill="#22C55E" stroke="#313742" strokeWidth="2" />
      </svg>
      <figcaption className="text-right text-xs font-semibold uppercase tracking-wider text-fg-muted">Exemple illustratif</figcaption>
    </figure>
  );
}

function Stacked() {
  return (
    <div className="container-apex relative pb-section">
      <div className="mb-8 overflow-hidden rounded-[20px] border-2 border-line bg-bg">
        <MachineIllustration className="mx-auto h-auto w-full max-w-md p-6" />
      </div>
      <Stagger as="ol" className="grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.n} className={`flex flex-col gap-3 rounded-card p-6 shadow-block ${i === 1 ? 'bg-primary text-ink' : 'border-2 border-line bg-bg'}`}>
            <div className="flex items-center justify-between">
              <span className={`num text-6xl leading-none ${i === 1 ? '' : 'text-primary-soft'}`}>{s.n}</span>
              <Icon name={s.icon} size={28} />
            </div>
            <h3 className={`text-4xl ${i === 1 ? 'text-ink' : ''}`}>{s.title}</h3>
            <p className={i === 1 ? 'font-medium' : 'text-fg-muted'}>{s.text}</p>
          </li>
        ))}
      </Stagger>
    </div>
  );
}
