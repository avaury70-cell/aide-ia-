/**
 * « Le concept en 3 étapes » — scrollytelling 3D.
 * Desktop + 3D : la section est épinglée (position: sticky) sur 300vh,
 * GSAP ScrollTrigger fournit la progression, la caméra tourne autour de la machine.
 * Mobile faible / reduced-motion / sans WebGL : 3 cartes empilées, sans 3D.
 */
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';
import MachineIllustration from '../components/MachineIllustration';
import { canRender3D, useInView, useMediaQuery, useReducedMotion } from '../hooks/useMedia';

const StoryCanvas = lazy(() => import('../three/StoryCanvas'));

const STEPS = [
  { n: '01', icon: 'scan', title: 'Scanne', text: "Ouvre l'appli APEX et scanne le QR code de la machine. Ton programme du jour s'affiche : exercice, séries, tempo, consignes en vidéo.", data: 'QR · programme · séance 12' },
  { n: '02', icon: 'dial', title: 'Ajuste', text: "La machine règle seule la résistance, la charge et la position du siège selon ton objectif — perte de poids, prise de masse, remise en forme ou rééducation. Rien à toucher.", data: 'résistance · charge · siège' },
  { n: '03', icon: 'chart', title: 'Progresse', text: "Chaque série est enregistrée. Trop facile ? La charge monte à la prochaine séance. Trop dur ? Elle s'adapte. Tu vois ta progression en temps réel, ton coach aussi.", data: 'séries · historique · coach' },
];

export default function HowItWorks() {
  const reduced = useReducedMotion();
  const desktop = useMediaQuery('(min-width: 1024px)');
  const [can3D, setCan3D] = useState(false);
  useEffect(() => setCan3D(canRender3D()), []);
  const immersive = desktop && can3D && !reduced;

  return (
    <section id="concept" aria-labelledby="concept-title" className="relative border-t border-bone/5 pt-[clamp(5rem,10vw,9rem)]">
      <div className="container-apex">
        <SectionHeading
          id="concept-title"
          eyebrow="Le concept en 3 étapes"
          title={<>Scanne. Pousse. <span className="text-signal">La machine s'occupe du reste.</span></>}
          lead="Chaque machine porte un QR code. L'appli APEX contient le programme de l'adhérent ; la machine l'exécute. Voici comment."
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
        start: 'top top+=72',
        end: 'bottom bottom',
        scrub: true,
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
      <div className="sticky top-[72px] h-[calc(100vh-72px)] overflow-hidden">
        <div className="container-apex grid h-full grid-cols-[0.85fr_1.15fr] items-center gap-10">
          <ol className="flex flex-col gap-4" aria-label="Les 3 étapes">
            {STEPS.map((s, i) => (
              <li key={s.n} aria-current={active === i ? 'step' : undefined} className={`rounded-card border p-6 transition-all duration-500 ease-apex ${active === i ? 'glass border-signal/40 opacity-100' : 'border-transparent opacity-75'}`}>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-sm ${active === i ? 'text-signal' : 'text-faint'}`}>{s.n}</span>
                  <h3 className="text-2xl font-semibold">{s.title}</h3>
                </div>
                <p className={`mt-3 text-mute transition-[max-height] duration-500 ${active === i ? 'max-h-48' : 'max-h-0 overflow-hidden lg:max-h-48'}`}>{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="relative h-[78%] overflow-hidden rounded-[28px] border border-bone/10">
            {near && (
              <Suspense fallback={<MachineIllustration className="h-full w-full p-10 opacity-60" />}>
                <StoryCanvas progress={progress} bindInvalidate={bind} instant={false} />
              </Suspense>
            )}
            <StepHud active={active} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Surcouche « appli » qui change selon l'étape. */
function StepHud({ active }: { active: number }) {
  const s = STEPS[active];
  return (
    <div className="glass absolute bottom-5 left-5 right-5 flex items-end justify-between gap-6 p-5">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-data">Étape {s.n} · {s.data}</p>
        <p className="mt-1 font-display text-xl font-semibold">{['QR détecté — programme chargé', 'Réglage terminé — 45 kg, siège 4', 'Série validée — +2,5 kg la prochaine fois'][active]}</p>
      </div>
      {active === 2 && <Sparkline />}
    </div>
  );
}

/** Mini-courbe illustrative (charge par séance), purement démonstrative. */
function Sparkline() {
  const pts = [30, 32.5, 32.5, 35, 37.5, 37.5, 40, 42.5, 45];
  const max = 48, min = 28, w = 150, h = 48;
  const d = pts.map((v, i) => `${i ? 'L' : 'M'}${(i / (pts.length - 1)) * w},${h - ((v - min) / (max - min)) * h}`).join(' ');
  return (
    <figure className="shrink-0" aria-label="Exemple illustratif : charge passée de 30 à 45 kg en 9 séances">
      <svg width={w} height={h + 4} viewBox={`0 -2 ${w} ${h + 4}`} aria-hidden="true">
        <path d={d} fill="none" stroke="#3CE0FF" strokeWidth="2" strokeLinejoin="round" />
        <circle cx={w} cy={h - ((45 - min) / (max - min)) * h} r="4" fill="#B8FF3C" />
      </svg>
      <figcaption className="text-right font-mono text-[10px] uppercase tracking-wider text-faint">exemple illustratif</figcaption>
    </figure>
  );
}

function Stacked() {
  return (
    <div className="container-apex pb-[clamp(5rem,10vw,9rem)]">
      <Reveal className="mb-8 overflow-hidden rounded-[24px] border border-bone/10 bg-carbon">
        <MachineIllustration className="mx-auto h-auto w-full max-w-md p-6" />
      </Reveal>
      <ol className="grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal as="li" key={s.n} delay={i * 100} className="glass flex flex-col gap-3 p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-control bg-signal/10 text-signal"><Icon name={s.icon} /></span>
            <p className="font-mono text-sm text-signal">{s.n}</p>
            <h3 className="text-2xl font-semibold">{s.title}</h3>
            <p className="text-mute">{s.text}</p>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
