/**
 * Décor commun aux scènes : éclairage studio, environnement de reflets
 * généré localement (Lightformers, aucun fichier HDR téléchargé),
 * sol en grille de points et halo lumineux.
 */
import { useMemo } from 'react';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { tokens } from '../design/tokens';

export default function Stage() {
  const dots = useMemo(() => {
    const pts: number[] = [];
    const step = 0.14;
    for (let x = -3; x <= 3; x += step)
      for (let z = -3; z <= 3; z += step) if (x * x + z * z < 7.5) pts.push(x, 0.002, z);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  return (
    <>
      <color attach="background" args={[tokens.color.carbon]} />
      <fog attach="fog" args={[tokens.color.carbon, 5.5, 11]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} />
      <directionalLight position={[-3, 2.5, -3]} intensity={0.9} color={tokens.color.data} />

      {/* Environnement procédural pour les reflets du métal brossé */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 4, 2]} scale={[6, 1.2, 1]} />
        <Lightformer form="rect" intensity={1.2} color={tokens.color.data} position={[-4, 1.5, 0]} rotation-y={Math.PI / 2} scale={[4, 0.6, 1]} />
        <Lightformer form="rect" intensity={0.8} color={tokens.color.signal} position={[4, 1, -1]} rotation-y={-Math.PI / 2} scale={[3, 0.4, 1]} />
        <Lightformer form="ring" intensity={1.5} position={[0, 2, -4]} scale={2} />
      </Environment>

      {/* Sol : grille de points + anneau lumineux */}
      <points geometry={dots}>
        <pointsMaterial color={tokens.color.data} size={0.018} sizeAttenuation transparent opacity={0.45} />
      </points>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]}>
        <ringGeometry args={[1.05, 1.08, 96]} />
        <meshBasicMaterial color={tokens.color.data} transparent opacity={0.35} toneMapped={false} />
      </mesh>
    </>
  );
}
