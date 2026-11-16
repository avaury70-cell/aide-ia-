/**
 * Scène 3D du hero.
 * Séquence : scan du QR (laser) → l'anneau de résistance s'illumine →
 * la charge et le siège se règlent seuls. Rejouable au clic.
 * Parallax léger de la caméra avec la souris. Rendu à la demande.
 */
import { useEffect, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Machine, { initialCtrl, type MachineCtrl } from './Machine';
import Stage from './Stage';

export type HeroPhase = 'idle' | 'scan' | 'adjust' | 'ready';
const BASE = new THREE.Vector3(2.55, 1.75, 3.55);
const TARGET = new THREE.Vector3(0.15, 1.1, 0);
export const TARGET_LOAD = 0.64; // ≈ 9 plaques sur 14 → affiché « 45 kg »

/** Pilote la séquence dans le temps et prévient le DOM des changements de phase. */
function Sequencer({ ctrl, play, reduced, onPhase }: { ctrl: MutableRefObject<MachineCtrl>; play: number; reduced: boolean; onPhase: (p: HeroPhase) => void }) {
  const invalidate = useThree((s) => s.invalidate);
  const t0 = useRef<number | null>(null);
  const phase = useRef<HeroPhase>('idle');

  useEffect(() => {
    if (play === 0) return;
    if (reduced) {
      Object.assign(ctrl.current, { scan: 1, ring: 1, load: TARGET_LOAD, seat: 1 });
      onPhase('ready');
      invalidate();
      return;
    }
    Object.assign(ctrl.current, initialCtrl());
    t0.current = performance.now();
    invalidate();
  }, [play, reduced, ctrl, invalidate, onPhase]);

  useFrame(() => {
    if (t0.current === null) return;
    const s = (performance.now() - t0.current) / 1000;
    const clamp = THREE.MathUtils.clamp;
    ctrl.current.scan = clamp(s / 1.3, 0, 1);
    ctrl.current.ring = clamp((s - 1.4) / 1.3, 0, 1);
    ctrl.current.load = clamp((s - 2.0) / 1.0, 0, 1) * TARGET_LOAD;
    ctrl.current.seat = clamp((s - 2.2) / 0.8, 0, 1);
    const p: HeroPhase = s < 1.35 ? 'scan' : s < 3.0 ? 'adjust' : 'ready';
    if (p !== phase.current) {
      phase.current = p;
      onPhase(p);
    }
    if (s < 3.2) invalidate();
    else t0.current = null;
  });
  return null;
}

/** Parallax caméra amorti, déclenché par le pointeur. */
function Rig({ enabled }: { enabled: boolean }) {
  const { camera, invalidate } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  const tmp = useRef(new THREE.Vector3());

  useEffect(() => {
    camera.position.copy(BASE);
    camera.lookAt(TARGET);
    if (!enabled) return;
    const on = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      invalidate();
    };
    window.addEventListener('pointermove', on, { passive: true });
    return () => window.removeEventListener('pointermove', on);
  }, [enabled, camera, invalidate]);

  useFrame((_, delta) => {
    if (!enabled) return;
    const goal = tmp.current.set(BASE.x + mouse.current.x * 0.45, BASE.y - mouse.current.y * 0.25, BASE.z);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, goal.x, 4, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, goal.y, 4, delta);
    camera.lookAt(TARGET);
    if (camera.position.distanceTo(goal) > 0.002) invalidate();
  });
  return null;
}

export default function HeroCanvas({ play, reduced, onPhase }: { play: number; reduced: boolean; onPhase: (p: HeroPhase) => void }) {
  const ctrl = useRef<MachineCtrl>(initialCtrl());
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ fov: 34, near: 0.1, far: 30, position: BASE.toArray() }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      aria-hidden="true"
    >
      <Stage />
      <group position={[0.2, 0, 0]} rotation-y={-0.18}>
        <Machine ctrl={ctrl} instant={reduced} />
      </group>
      <Sequencer ctrl={ctrl} play={play} reduced={reduced} onPhase={onPhase} />
      <Rig enabled={!reduced} />
    </Canvas>
  );
}
