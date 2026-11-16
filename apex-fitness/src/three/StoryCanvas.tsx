/**
 * Scène du scrollytelling « Comment ça marche ».
 * La progression (0→1) vient du scroll (GSAP ScrollTrigger) ; la caméra
 * interpole entre 3 points de vue et la machine suit l'histoire :
 *   1. Scanne   — gros plan sur le QR code
 *   2. Ajuste   — vue latérale sur l'anneau et la pile de poids
 *   3. Progresse — plan large, la machine est prête
 */
import { useEffect, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Machine, { initialCtrl, type MachineCtrl } from './Machine';
import Stage from './Stage';

const KEYS = [
  { pos: new THREE.Vector3(2.3, 1.55, 1.9), look: new THREE.Vector3(0.9, 1.35, 0.25) },
  { pos: new THREE.Vector3(-2.6, 1.6, 1.6), look: new THREE.Vector3(0, 1.05, -0.3) },
  { pos: new THREE.Vector3(0.6, 2.6, 4.1), look: new THREE.Vector3(0.1, 0.95, 0) },
];
const ss = THREE.MathUtils.smoothstep;

function Director({ progress, ctrl, bindInvalidate, instant }: { progress: MutableRefObject<number>; ctrl: MutableRefObject<MachineCtrl>; bindInvalidate: (fn: () => void) => void; instant: boolean }) {
  const { camera, invalidate } = useThree();
  const p = useRef(progress.current);
  const pos = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());

  useEffect(() => bindInvalidate(invalidate), [bindInvalidate, invalidate]);

  useFrame((_, delta) => {
    p.current = instant ? progress.current : THREE.MathUtils.damp(p.current, progress.current, 5, delta);
    const v = p.current;
    // segment de caméra : 0→0.5 entre clé 1 et 2, 0.5→1 entre clé 2 et 3
    const a = v < 0.5 ? 0 : 1;
    const local = ss(v < 0.5 ? v / 0.5 : (v - 0.5) / 0.5, 0.15, 0.85);
    pos.current.lerpVectors(KEYS[a].pos, KEYS[a + 1].pos, local);
    look.current.lerpVectors(KEYS[a].look, KEYS[a + 1].look, local);
    camera.position.copy(pos.current);
    camera.lookAt(look.current);

    // état de la machine selon l'étape
    ctrl.current.scan = ss(v, 0.04, 0.26);
    ctrl.current.ring = ss(v, 0.36, 0.6);
    ctrl.current.load = ss(v, 0.44, 0.64) * 0.64;
    ctrl.current.seat = ss(v, 0.5, 0.66);

    if (Math.abs(p.current - progress.current) > 0.0005) invalidate();
  });
  return null;
}

export default function StoryCanvas({ progress, bindInvalidate, instant }: { progress: MutableRefObject<number>; bindInvalidate: (fn: () => void) => void; instant: boolean }) {
  const ctrl = useRef<MachineCtrl>(initialCtrl());
  return (
    <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ fov: 36, near: 0.1, far: 30, position: KEYS[0].pos.toArray() }} gl={{ antialias: true, powerPreference: 'high-performance' }} aria-hidden="true">
      <Stage />
      <Machine ctrl={ctrl} instant={instant} />
      <Director progress={progress} ctrl={ctrl} bindInvalidate={bindInvalidate} instant={instant} />
    </Canvas>
  );
}
