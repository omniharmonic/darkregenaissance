'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function MycelialNetwork() {
  const networkRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  // Generate mycelial network paths
  const networkGeometry = useMemo(() => {
    const points = [];
    const numPaths = 12;
    const pathLength = 15;

    for (let i = 0; i < numPaths; i++) {
      const startAngle = (i / numPaths) * Math.PI * 2;
      const startRadius = 2 + Math.random() * 3;
      const startX = Math.cos(startAngle) * startRadius;
      const startZ = Math.sin(startAngle) * startRadius;

      let currentX = startX;
      let currentZ = startZ;
      const y = -0.5; // Slightly below ground

      for (let j = 0; j < pathLength; j++) {
        points.push(new THREE.Vector3(currentX, y, currentZ));

        // Create organic, branching paths
        const angle = startAngle + (Math.random() - 0.5) * 0.5;
        const distance = 0.8 + Math.random() * 0.4;
        currentX += Math.cos(angle) * distance;
        currentZ += Math.sin(angle) * distance;

        // Occasionally branch
        if (Math.random() < 0.1 && j > 5) {
          const branchAngle = angle + (Math.random() - 0.5) * Math.PI;
          const branchLength = 3 + Math.random() * 4;
          let branchX = currentX;
          let branchZ = currentZ;

          for (let k = 0; k < branchLength; k++) {
            points.push(new THREE.Vector3(branchX, y, branchZ));
            branchX += Math.cos(branchAngle) * 0.6;
            branchZ += Math.sin(branchAngle) * 0.6;
          }
        }
      }
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, []);

  // Animate the mycelial glow
  useFrame((state) => {
    if (lightRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.3 + 0.7;
      lightRef.current.intensity = pulse * 0.8;

      // Slowly move the light around
      const time = state.clock.elapsedTime * 0.3;
      lightRef.current.position.x = Math.cos(time) * 3;
      lightRef.current.position.z = Math.sin(time) * 3;
    }
  });

  return (
    <group ref={networkRef}>
      {/* Mycelial network lines */}
      <primitive object={new THREE.Line(networkGeometry, new THREE.LineBasicMaterial({
        color: '#2d5f3f',
        transparent: true,
        opacity: 0.8
      }))} />

      {/* Pulsing light that travels through the network */}
      <pointLight
        ref={lightRef}
        position={[0, -0.3, 0]}
        color="#4a7c4f"
        intensity={0.8}
        distance={8}
        decay={2}
      />

      {/* Additional glow nodes at intersection points */}
      {[...Array(8)].map((_, index) => {
        const angle = (index / 8) * Math.PI * 2;
        const radius = 3 + Math.random() * 6;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        return (
          <mesh key={index} position={[x, -0.4, z]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial
              color="#6bffb8"
              transparent
              opacity={0.6}
            />
          </mesh>
        );
      })}
    </group>
  );
}