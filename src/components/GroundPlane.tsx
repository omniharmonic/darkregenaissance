'use client';

import { useRef } from 'react';
import * as THREE from 'three';

export function GroundPlane() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create semi-transparent ground material
  const groundMaterial = new THREE.MeshLambertMaterial({
    color: '#1a2b1a',
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.1, 0]}
      receiveShadow
    >
      <planeGeometry args={[40, 40, 32, 32]} />
      <primitive object={groundMaterial} />
    </mesh>
  );
}