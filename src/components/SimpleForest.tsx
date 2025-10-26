'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function SimpleForest() {
  const forestRef = useRef<THREE.Group>(null);

  // Gentle rotation animation
  useFrame((state) => {
    if (forestRef.current) {
      forestRef.current.rotation.y = state.clock.elapsedTime * 0.01;
    }
  });

  // Create simple tree geometries
  const trees = [];
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const radius = 5 + Math.random() * 15;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const height = 3 + Math.random() * 4;

    trees.push({
      position: [x, height / 2, z],
      height,
      key: i
    });
  }

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.1} color="#2d5f3f" />
      <directionalLight
        position={[-5, 10, 5]}
        intensity={0.3}
        color="#4a7c4f"
      />
      <pointLight
        position={[0, 5, 0]}
        intensity={0.2}
        color="#6bffb8"
        distance={20}
      />

      {/* Fog */}
      <fog attach="fog" args={['#0a0a12', 10, 50]} />

      {/* Forest group */}
      <group ref={forestRef}>
        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial color="#0f1419" transparent opacity={0.8} />
        </mesh>

        {/* Simple wireframe trees */}
        {trees.map((tree) => (
          <group key={tree.key} position={tree.position as [number, number, number]}>
            {/* Tree trunk */}
            <mesh>
              <cylinderGeometry args={[0.1, 0.15, tree.height, 6]} />
              <meshBasicMaterial color="#2d5f3f" wireframe />
            </mesh>

            {/* Tree canopy */}
            <mesh position={[0, tree.height * 0.3, 0]}>
              <coneGeometry args={[tree.height * 0.4, tree.height * 0.6, 8]} />
              <meshBasicMaterial color="#4a7c4f" wireframe />
            </mesh>
          </group>
        ))}

        {/* Simple mycelial network points */}
        {[...Array(15)].map((_, index) => {
          const angle = (index / 15) * Math.PI * 2;
          const radius = 3 + Math.random() * 8;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;

          return (
            <mesh key={index} position={[x, -0.3, z]}>
              <sphereGeometry args={[0.05, 6, 6]} />
              <meshBasicMaterial
                color="#6bffb8"
                transparent
                opacity={0.6}
              />
            </mesh>
          );
        })}
      </group>
    </>
  );
}