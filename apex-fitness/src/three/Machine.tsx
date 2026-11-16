/**
 * Machine de musculation 100 % procédurale (aucun modèle externe).
 * Pilotée par un objet de contrôle mutable (pas de re-render React) :
 *   scan  0→1 : la ligne laser parcourt le QR code
 *   ring  0→1 : l'anneau de résistance s'illumine segment par segment
 *   load  0→1 : la barre de charge et la goupille se règlent
 *   seat  0→1 : le siège monte à la bonne hauteur
 * Les valeurs affichées sont amorties (damp) vers la cible ; tant qu'elles
 * bougent, on demande une nouvelle image (frameloop="demand").
 */
import { useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { tokens } from '../design/tokens';

export type MachineCtrl = { scan: number; ring: number; load: number; seat: number };
export const initialCtrl = (): MachineCtrl => ({ scan: 0, ring: 0, load: 0, seat: 0 });

const C = tokens.color;
const SIGNAL = new THREE.Color(C.primary); // anneau, charge : Orange Énergie
const GO = new THREE.Color(C.accent); // scan validé : Vert Go
const DATA = new THREE.Color(C.accent);
const DIM = new THREE.Color('#2a3240');
const PLATES = 14;
const RING_SEGMENTS = 30;
const RING_ARC = (300 / 360) * Math.PI * 2; // anneau ouvert (comme le logo)

/** QR code procédural déterministe (repères aux 3 coins), dessiné dans un canvas. */
function makeQrTexture() {
  const n = 25;
  const px = 10;
  const cv = document.createElement('canvas');
  cv.width = cv.height = (n + 4) * px;
  const g = cv.getContext('2d')!;
  g.fillStyle = C.fg;
  g.fillRect(0, 0, cv.width, cv.height);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const finder = (x: number, y: number) => x < 8 && y < 8;
  const isFinder = (x: number, y: number) => finder(x, y) || finder(n - 1 - x, y) || finder(x, n - 1 - y);
  g.fillStyle = C.ink;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) if (!isFinder(x, y) && rnd() > 0.52) g.fillRect((x + 2) * px, (y + 2) * px, px, px);
  const drawFinder = (fx: number, fy: number) => {
    const o = (v: number) => (v + 2) * px;
    g.fillStyle = C.ink;
    g.fillRect(o(fx), o(fy), 7 * px, 7 * px);
    g.fillStyle = C.fg;
    g.fillRect(o(fx + 1), o(fy + 1), 5 * px, 5 * px);
    g.fillStyle = C.ink;
    g.fillRect(o(fx + 2), o(fy + 2), 3 * px, 3 * px);
  };
  drawFinder(0, 0);
  drawFinder(n - 7, 0);
  drawFinder(0, n - 7);
  const tex = new THREE.CanvasTexture(cv);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function Machine({ ctrl, instant = false }: { ctrl: MutableRefObject<MachineCtrl>; instant?: boolean }) {
  const cur = useRef<MachineCtrl>(instant ? { ...ctrl.current } : initialCtrl());

  // --- Matériaux partagés -------------------------------------------------
  const mat = useMemo(
    () => ({
      matte: new THREE.MeshStandardMaterial({ color: '#12161c', roughness: 0.72, metalness: 0.25 }),
      brushed: new THREE.MeshStandardMaterial({ color: '#b9c2cc', roughness: 0.32, metalness: 1 }),
      darkMetal: new THREE.MeshStandardMaterial({ color: '#3a434f', roughness: 0.45, metalness: 0.9 }),
      cushion: new THREE.MeshStandardMaterial({ color: '#1b212b', roughness: 0.95, metalness: 0 }),
      plate: new THREE.MeshStandardMaterial({ color: '#171c23', roughness: 0.55, metalness: 0.5 }),
      signal: new THREE.MeshBasicMaterial({ color: SIGNAL, toneMapped: false }),
      laser: new THREE.MeshBasicMaterial({ color: DATA, toneMapped: false, transparent: true, opacity: 1 }),
      laserGlow: new THREE.MeshBasicMaterial({ color: DATA, toneMapped: false, transparent: true, opacity: 0.18, depthWrite: false }),
      qrFrame: new THREE.MeshBasicMaterial({ color: DIM.clone(), toneMapped: false }),
      link: new THREE.LineBasicMaterial({ color: DATA, transparent: true, opacity: 0, toneMapped: false }),
      loadFill: new THREE.MeshBasicMaterial({ color: SIGNAL, toneMapped: false }),
      track: new THREE.MeshBasicMaterial({ color: '#1f2630', toneMapped: false }),
    }),
    [],
  );
  const qrTex = useMemo(makeQrTexture, []);

  // --- Géométries procédurales ---------------------------------------------
  const arms = useMemo(
    () =>
      [-1, 1].map((s) => {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.36 * s, 1.88, -0.42),
          new THREE.Vector3(0.44 * s, 1.75, -0.1),
          new THREE.Vector3(0.46 * s, 1.42, 0.3),
          new THREE.Vector3(0.44 * s, 1.18, 0.46),
        ]);
        return new THREE.TubeGeometry(curve, 40, 0.032, 12, false);
      }),
    [],
  );
  const ringSegGeo = useMemo(() => new THREE.TorusGeometry(0.64, 0.024, 10, 8, (RING_ARC / RING_SEGMENTS) * 0.82), []);
  const ringTrack = useMemo(() => new THREE.TorusGeometry(0.64, 0.008, 6, 120, RING_ARC), []);
  const link = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0.95, 1.3, 0.3), new THREE.Vector3(0.95, 0.9, 0.0), new THREE.Vector3(0.55, 0.95, -0.28));
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)), mat.link);
  }, [mat]);

  // --- Références animées --------------------------------------------------
  const laser = useRef<THREE.Group>(null);
  const pin = useRef<THREE.Mesh>(null);
  const fill = useRef<THREE.Mesh>(null);
  const seat = useRef<THREE.Group>(null);
  const ringLight = useRef<THREE.PointLight>(null);

  const segMats = useMemo(() => Array.from({ length: RING_SEGMENTS }, () => new THREE.MeshBasicMaterial({ color: DIM.clone(), toneMapped: false })), []);

  useFrame((state, delta) => {
    const t = ctrl.current;
    const c = cur.current;
    let moving = false;
    (Object.keys(t) as (keyof MachineCtrl)[]).forEach((k) => {
      if (instant) c[k] = t[k];
      else c[k] = THREE.MathUtils.damp(c[k], t[k], k === 'scan' ? 14 : 6, Math.min(delta, 0.05));
      if (Math.abs(c[k] - t[k]) > 0.0008) moving = true;
      else c[k] = t[k];
    });

    // Laser : balaye le QR du haut vers le bas
    if (laser.current) {
      laser.current.visible = c.scan > 0.001 && c.scan < 0.999;
      laser.current.position.y = 0.22 - c.scan * 0.44;
    }
    mat.qrFrame.color.copy(DIM).lerp(GO, THREE.MathUtils.smoothstep(c.scan, 0.85, 1));
    mat.link.opacity = THREE.MathUtils.smoothstep(c.scan, 0.9, 1) * 0.9 * (1 - c.ring * 0.4);

    // Anneau : allumage progressif des segments
    const lit = c.ring * RING_SEGMENTS;
    segMats.forEach((m, i) => m.color.copy(DIM).lerp(SIGNAL, THREE.MathUtils.clamp(lit - i, 0, 1)));
    if (ringLight.current) ringLight.current.intensity = c.ring * 2.2;

    // Charge et siège
    if (fill.current) {
      fill.current.scale.y = Math.max(0.001, c.load);
      fill.current.position.y = 0.25 + (c.load * 1.5) / 2;
    }
    // plus la charge est élevée, plus la goupille descend dans la pile
    if (pin.current) pin.current.position.y = 0.12 + Math.round((1 - c.load) * (PLATES - 1)) * 0.062;
    if (seat.current) seat.current.position.y = c.seat * 0.12;

    if (moving) state.invalidate();
  });

  return (
    <group>
      {/* Socle */}
      <RoundedBox args={[1.4, 0.07, 1.45]} radius={0.02} position={[0, 0.035, 0]} material={mat.matte} />

      {/* Tour arrière : montants, traverses */}
      {[-0.36, 0.36].map((x) => (
        <mesh key={x} position={[x, 1.1, -0.45]} material={mat.matte}>
          <boxGeometry args={[0.09, 2.1, 0.09]} />
        </mesh>
      ))}
      <mesh position={[0, 2.15, -0.45]} material={mat.matte}>
        <boxGeometry args={[0.85, 0.09, 0.14]} />
      </mesh>
      <mesh position={[0, 2.15, -0.37]} material={mat.signal}>
        <boxGeometry args={[0.5, 0.012, 0.004]} />
      </mesh>

      {/* Guides et pile de poids */}
      {[-0.16, 0.16].map((x) => (
        <mesh key={x} position={[x, 1.05, -0.45]} material={mat.brushed}>
          <cylinderGeometry args={[0.012, 0.012, 1.9, 10]} />
        </mesh>
      ))}
      {Array.from({ length: PLATES }, (_, i) => (
        <mesh key={i} position={[0, 0.12 + i * 0.062, -0.45]} material={i % 2 ? mat.plate : mat.darkMetal}>
          <boxGeometry args={[0.42, 0.054, 0.22]} />
        </mesh>
      ))}
      {/* Goupille de sélection (se place seule) */}
      <mesh ref={pin} position={[0.12, 0.12, -0.45]} rotation={[Math.PI / 2, 0, 0]} material={mat.signal}>
        <cylinderGeometry args={[0.016, 0.016, 0.3, 10]} />
      </mesh>

      {/* Jauge de charge latérale */}
      <mesh position={[0.43, 1.0, -0.4]} material={mat.track}>
        <boxGeometry args={[0.03, 1.5, 0.03]} />
      </mesh>
      <mesh ref={fill} position={[0.43, 0.25, -0.395]} material={mat.loadFill}>
        <boxGeometry args={[0.034, 1.5, 0.034]} />
      </mesh>

      {/* Siège réglable + dossier */}
      <mesh position={[0, 0.3, 0.16]} material={mat.brushed}>
        <cylinderGeometry args={[0.04, 0.05, 0.52, 16]} />
      </mesh>
      <group ref={seat}>
        <RoundedBox args={[0.52, 0.1, 0.44]} radius={0.04} smoothness={4} position={[0, 0.6, 0.18]} material={mat.cushion} />
      </group>
      <mesh position={[0, 0.62, -0.25]} rotation={[0.35, 0, 0]} material={mat.matte}>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
      </mesh>
      <RoundedBox args={[0.5, 0.78, 0.1]} radius={0.04} smoothness={4} position={[0, 1.1, -0.18]} rotation={[-0.12, 0, 0]} material={mat.cushion} />

      {/* Bras de poussée et poignées */}
      {arms.map((g, i) => (
        <mesh key={i} geometry={g} material={mat.brushed} />
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.44 * s, 1.14, 0.48]} material={mat.cushion}>
          <cylinderGeometry args={[0.034, 0.034, 0.2, 14]} />
        </mesh>
      ))}

      {/* Anneau de résistance ouvert (ouverture au sommet, comme le logo) */}
      <group position={[0, 1.22, -0.32]} rotation={[0, 0, Math.PI / 2 + (Math.PI * 2 - RING_ARC) / 2]}>
        <mesh geometry={ringTrack} material={mat.track} />
        {segMats.map((m, i) => (
          <mesh key={i} geometry={ringSegGeo} material={m} rotation={[0, 0, (i / RING_SEGMENTS) * RING_ARC]} />
        ))}
      </group>
      <pointLight ref={ringLight} position={[0, 1.25, -0.1]} color={C.primary} intensity={0} distance={2.2} decay={2} />

      {/* QR code flottant + ligne laser */}
      <group position={[0.98, 1.42, 0.32]} rotation={[0, -0.55, 0]}>
        <mesh position={[0, 0, -0.006]} material={mat.qrFrame}>
          <planeGeometry args={[0.54, 0.54]} />
        </mesh>
        <mesh>
          <planeGeometry args={[0.48, 0.48]} />
          <meshBasicMaterial map={qrTex} toneMapped={false} />
        </mesh>
        <group ref={laser} position={[0, 0.22, 0.01]} visible={false}>
          <mesh material={mat.laser}>
            <planeGeometry args={[0.6, 0.008]} />
          </mesh>
          <mesh position={[0, 0.05, 0]} material={mat.laserGlow}>
            <planeGeometry args={[0.6, 0.1]} />
          </mesh>
        </group>
      </group>
      {/* Ligne de connexion QR → machine */}
      <primitive object={link} />
    </group>
  );
}
