import { useEffect, useRef } from "react";

import type { OrbState } from "./Orb";

/**
 * Noyau holographique doré : des milliers d'éclats lumineux disposés sur des anneaux
 * inclinés qui tournent à des vitesses différentes, un tourbillon incandescent au centre
 * et des étincelles. Dessiné en temps réel (Canvas 2D, mélange additif).
 *
 * L'état de l'assistant module l'animation : repos (lent), écoute (réagit au micro),
 * réflexion (rapide, plus d'étincelles), parole (pulsation du cœur).
 */

interface Shard {
  ring: number;
  angle: number;
  radius: number; // rayon relatif 0–1
  len: number; // longueur angulaire (0 = point)
  width: number;
  alpha: number;
  hue: number; // 0 = or pâle … 1 = orange profond
  flicker: number;
}

interface Ring {
  tilt: number; // aplatissement vertical (inclinaison simulée)
  rotation: number; // orientation de l'ellipse
  speed: number; // radians / s
  phase: number;
}

interface Spark {
  angle: number;
  radius: number;
  speed: number;
  life: number;
}

// Générateur pseudo-aléatoire déterministe : le motif est identique à chaque lancement.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildScene() {
  const rand = rng(7);
  // Coque quasi sphérique (anneaux peu inclinés) + quelques orbites intérieures inclinées.
  const rings: Ring[] = Array.from({ length: 10 }, (_, i) => ({
    tilt: i < 7 ? 0.86 + rand() * 0.14 : 0.3 + rand() * 0.35,
    rotation: rand() * Math.PI,
    speed: (0.05 + rand() * 0.22) * (i % 2 ? -1 : 1),
    phase: rand() * Math.PI * 2,
  }));
  const shards: Shard[] = [];
  for (let i = 0; i < 2600; i++) {
    // La plupart des éclats forment une coque épaisse et lumineuse, le reste flotte à l'intérieur.
    const shell = rand() < 0.78;
    const ring = shell ? Math.floor(rand() * 7) : 7 + Math.floor(rand() * 3);
    const radius = shell ? 0.8 + Math.pow(rand(), 0.7) * 0.19 : 0.32 + rand() * 0.42;
    // Les éclats se regroupent en « fragments » : densité modulée par l'angle.
    let angle = rand() * Math.PI * 2;
    if (rand() < 0.6) angle = Math.round(angle / 0.21) * 0.21 + (rand() - 0.5) * 0.12;
    shards.push({
      ring,
      angle,
      radius,
      len: rand() < 0.5 ? 0.012 + rand() * 0.06 : 0,
      width: 0.8 + rand() * 1.8,
      alpha: 0.35 + rand() * 0.65,
      hue: rand(),
      flicker: rand() * Math.PI * 2,
    });
  }
  return { rings, shards };
}

const SPEED: Record<OrbState, number> = { idle: 1, listening: 1.8, thinking: 4.2, speaking: 1.6 };

function color(hue: number, alpha: number) {
  // or pâle (255,226,160) → ambre (255,166,48) → orange (255,104,24)
  const r = 255;
  const g = hue < 0.5 ? 226 - (226 - 166) * (hue / 0.5) : 166 - (166 - 104) * ((hue - 0.5) / 0.5);
  const b = hue < 0.5 ? 160 - (160 - 48) * (hue / 0.5) : 48 - (48 - 24) * ((hue - 0.5) / 0.5);
  return `rgba(${r},${g | 0},${b | 0},${alpha.toFixed(3)})`;
}

export function HoloOrb({ state, level = 0, size = 360, onClick }: {
  state: OrbState;
  level?: number;
  size?: number;
  onClick?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useRef({ state, level });
  live.current = { state, level };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { rings, shards } = buildScene();
    const sparks: Spark[] = [];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const C = size / 2;
    const R = size * 0.42;
    let t = 0;
    let speedNow = 1;
    let energy = 0;
    let last = performance.now();
    let raf = 0;

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { state: st, level: lv } = live.current;
      // Transitions douces entre états.
      speedNow += (SPEED[st] - speedNow) * Math.min(1, dt * 3);
      const targetEnergy = st === "listening" ? 0.35 + lv * 1.4 : st === "speaking" ? 0.55 + 0.35 * Math.sin(now / 140) : st === "thinking" ? 0.8 : 0.25;
      energy += (targetEnergy - energy) * Math.min(1, dt * 6);
      t += dt * speedNow;

      ctx.clearRect(0, 0, size, size);

      // Disque sombre translucide derrière la sphère (comme une lentille).
      const disc = ctx.createRadialGradient(C, C, R * 0.2, C, C, R * 1.08);
      disc.addColorStop(0, "rgba(40,22,6,0.55)");
      disc.addColorStop(0.75, "rgba(22,12,4,0.35)");
      disc.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = disc;
      ctx.beginPath();
      ctx.arc(C, C, R * 1.08, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = "lighter";

      // Halo extérieur.
      const halo = ctx.createRadialGradient(C, C, R * 0.6, C, C, R * 1.25);
      halo.addColorStop(0, `rgba(255,140,30,${0.05 + energy * 0.08})`);
      halo.addColorStop(1, "rgba(255,120,20,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, size, size);

      // Arcs-guides fins (structure de la sphère).
      for (const ring of rings) {
        ctx.save();
        ctx.translate(C, C);
        ctx.rotate(ring.rotation);
        ctx.scale(1, ring.tilt);
        ctx.strokeStyle = "rgba(255,170,70,0.07)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.9, ring.phase + t * ring.speed, ring.phase + t * ring.speed + Math.PI * 1.2);
        ctx.stroke();
        ctx.restore();
      }

      // Éclats.
      const cosR = rings.map((r) => Math.cos(r.rotation));
      const sinR = rings.map((r) => Math.sin(r.rotation));
      for (const s of shards) {
        const ring = rings[s.ring];
        const a = s.angle + ring.phase + t * ring.speed;
        const rr = R * s.radius * (1 + energy * 0.04 * Math.sin(a * 3 + t * 2));
        const flick = 0.65 + 0.35 * Math.sin(now / 260 + s.flicker);
        const alpha = Math.min(1, s.alpha * flick * (0.85 + energy * 0.5));
        // Profondeur : la moitié « arrière » de l'anneau est plus sombre.
        const depth = 0.6 + 0.4 * Math.sin(a);
        const project = (ang: number) => {
          const x = Math.cos(ang) * rr;
          const y = Math.sin(ang) * rr * ring.tilt;
          return [C + x * cosR[s.ring] - y * sinR[s.ring], C + x * sinR[s.ring] + y * cosR[s.ring]];
        };
        ctx.strokeStyle = ctx.fillStyle = color(s.hue, alpha * depth);
        if (s.len > 0) {
          const [x1, y1] = project(a);
          const [x2, y2] = project(a + s.len);
          ctx.lineWidth = s.width;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        } else {
          const [x, y] = project(a);
          ctx.fillRect(x - s.width / 2, y - s.width / 2, s.width, s.width);
        }
      }

      // Grand arc intérieur (le « C » lumineux de la sphère) et cercle extérieur fin.
      ctx.lineCap = "round";
      for (const [r, w, al, sp, span] of [
        [0.5, 3, 0.4, 0.35, 1.45],
        [0.5, 9, 0.08, 0.35, 1.45],
        [0.62, 1.4, 0.3, -0.22, 0.9],
      ] as const) {
        ctx.strokeStyle = `rgba(255,190,90,${al + energy * 0.15})`;
        ctx.lineWidth = w;
        ctx.beginPath();
        const a0 = t * sp + 2.2;
        ctx.ellipse(C, C, R * r, R * r * 0.94, 0.3, a0, a0 + Math.PI * span);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,170,70,0.16)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(C, C, R * 1.06, 0, Math.PI * 2);
      ctx.stroke();

      // Tourbillon incandescent du cœur.
      ctx.lineCap = "round";
      for (let k = 0; k < 7; k++) {
        const base = t * (1.2 + k * 0.15) + k * 0.9;
        const r0 = R * (0.08 + k * 0.025);
        const r1 = R * (0.22 + k * 0.03) * (1 + energy * 0.25);
        ctx.strokeStyle = color(0.15 + k * 0.08, 0.35 + energy * 0.3);
        ctx.lineWidth = 1.2 + (6 - k) * 0.35;
        ctx.beginPath();
        for (let u = 0; u <= 1.001; u += 0.05) {
          const ang = base + u * Math.PI * 1.4;
          const rad = r0 + (r1 - r0) * u;
          const x = C + Math.cos(ang) * rad * 1.15;
          const y = C + Math.sin(ang) * rad * 0.62;
          if (u === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Cœur lumineux.
      const coreR = R * (0.2 + energy * 0.08);
      const core = ctx.createRadialGradient(C, C, 0, C, C, coreR);
      core.addColorStop(0, "rgba(255,250,235,0.95)");
      core.addColorStop(0.25, "rgba(255,214,140,0.75)");
      core.addColorStop(0.6, "rgba(255,150,40,0.25)");
      core.addColorStop(1, "rgba(255,120,20,0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(C, C, coreR, 0, Math.PI * 2);
      ctx.fill();

      // Étincelles qui s'échappent du noyau.
      const rate = st === "thinking" ? 40 : st === "listening" ? 10 + lv * 60 : 6;
      if (!reduced && Math.random() < rate * dt) {
        sparks.push({ angle: Math.random() * Math.PI * 2, radius: R * 0.25, speed: R * (0.4 + Math.random() * 0.8), life: 1 });
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.radius += sp.speed * dt;
        sp.life -= dt * 0.9;
        if (sp.life <= 0 || sp.radius > R * 1.15) {
          sparks.splice(i, 1);
          continue;
        }
        const x = C + Math.cos(sp.angle) * sp.radius;
        const y = C + Math.sin(sp.angle) * sp.radius * 0.8;
        ctx.fillStyle = color(0.2, sp.life * 0.9);
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }

      ctx.globalCompositeOperation = "source-over";
      if (!reduced) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <div
      className="holo-orb"
      style={{ width: size, height: size }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      aria-label={onClick ? "Parler à Aide" : undefined}
    >
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
      <span className="holo-frame tl" />
      <span className="holo-frame br" />
    </div>
  );
}
