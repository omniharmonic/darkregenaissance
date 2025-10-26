'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WireframeTreeProps {
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number];
}

export function WireframeTree({ position, scale, rotation }: WireframeTreeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pulsePhase = useMemo(() => Math.random() * Math.PI * 2, []);

  // Subtle pulsing animation
  useFrame((state) => {
    if (groupRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 0.5 + pulsePhase) * 0.05 + 1;
      groupRef.current.scale.setScalar(scale * pulse);
    }
  });

  // Create tree geometry
  const trunkGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(0.2, 0.4, 4, 8);
  }, []);

  const foliageGeometry = useMemo(() => {
    return new THREE.ConeGeometry(2, 3, 8);
  }, []);

  // Wireframe materials
  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: '#1a2b1a',
    wireframe: true,
    transparent: true,
    opacity: 0.8,
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Tree trunk */}
      <mesh position={[0, 2, 0]} geometry={trunkGeometry}>
        <primitive object={wireframeMaterial} />
      </mesh>

      {/* Tree foliage - multiple layers */}
      <mesh position={[0, 4.5, 0]} geometry={foliageGeometry}>
        <primitive object={wireframeMaterial} />
      </mesh>

      <mesh position={[0, 3.5, 0]} scale={1.2} geometry={foliageGeometry}>
        <primitive object={wireframeMaterial} />
      </mesh>

      <mesh position={[0, 2.5, 0]} scale={1.4} geometry={foliageGeometry}>
        <primitive object={wireframeMaterial} />
      </mesh>
    </group>
  );
}