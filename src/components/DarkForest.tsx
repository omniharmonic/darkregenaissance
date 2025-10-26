'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { TreeCollection } from './TreeCollection';
import { GroundPlane } from './GroundPlane';
import { MycelialNetwork } from './MycelialNetwork';

export function DarkForest() {
  const sceneRef = useRef<THREE.Group>(null);

  // Slow rotation of the entire scene
  useFrame((state) => {
    if (sceneRef.current) {
      sceneRef.current.rotation.y = state.clock.elapsedTime * 0.01; // Very slow rotation (60s full cycle)
    }
  });

  return (
    <>
      {/* Lighting setup */}
      <ambientLight intensity={0.1} color="#2d5f3f" />
      <directionalLight
        position={[-5, 10, 5]}
        intensity={0.3}
        color="#4a7c4f"
        castShadow
      />
      <pointLight
        position={[0, 5, 0]}
        intensity={0.2}
        color="#6bffb8"
        distance={20}
      />

      {/* Fog for atmospheric depth */}
      <fog attach="fog" args={['#0a0a12', 10, 50]} />

      {/* Main scene group that rotates */}
      <group ref={sceneRef}>
        {/* Ground with mycelial network beneath */}
        <GroundPlane />

        {/* Mycelial network visible beneath ground */}
        <MycelialNetwork />

        {/* Forest of wireframe trees */}
        <TreeCollection />
      </group>

      {/* Controls - allow user to look around but disable zoom/pan for now */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableRotate={true}
        autoRotate={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
        minAzimuthAngle={-Math.PI / 3}
        maxAzimuthAngle={Math.PI / 3}
      />
    </>
  );
}