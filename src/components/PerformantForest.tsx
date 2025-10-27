'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

export function PerformantForest() {
  const sceneRef = useRef<THREE.Group>(null);
  const myceliumRef = useRef<THREE.Group>(null);
  const flowLightsRef = useRef<THREE.Group>(null);

  // Load the actual forest model
  const forest = useLoader(GLTFLoader, '/models/scene.gltf');

  // Strategically placed lights for optimal performance
  const veinLights = useMemo(() => {
    const lights: Array<{
      light: THREE.PointLight;
      baseHeight: number;
      baseX: number;
      baseZ: number;
      phase: number;
      hueBase: number;
      intensityBase: number;
      zoneIndex: number;
    }> = [];

    // Strategic placement: Close, Mid, Far distances from camera (at 0,2,8)
    const zones = [
      { distance: 2, count: 2, intensity: 0.6 },  // Close to camera
      { distance: 5, count: 2, intensity: 0.4 },  // Mid distance
      { distance: 8, count: 1, intensity: 0.3 }   // Far distance
    ];

    zones.forEach((zone, zoneIndex) => {
      for (let i = 0; i < zone.count; i++) {
        const angle = (i / zone.count) * Math.PI * 2 + (zoneIndex * 0.5);
        const x = Math.cos(angle) * zone.distance;
        const z = Math.sin(angle) * zone.distance;
        const height = -0.5 + Math.random() * 3;

        const light = new THREE.PointLight('#4a7c59', 0, 6, 1.2);
        light.position.set(x, height, z);
        light.castShadow = false;

        lights.push({
          light,
          baseHeight: height,
          baseX: x,
          baseZ: z,
          phase: Math.random() * Math.PI * 2,
          hueBase: 0.28 + (zoneIndex * 0.04),
          intensityBase: zone.intensity,
          zoneIndex
        });
      }
    });

    return lights;
  }, []);

  // Aggressively optimize forest materials for maximum performance
  const optimizeForestMaterials = (object: THREE.Object3D) => {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Set shadow properties on the mesh
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          const material = child.material as THREE.MeshStandardMaterial;

          // Reduce material complexity for performance
          material.roughness = Math.max(material.roughness || 0.8, 0.7);
          material.metalness = Math.min(material.metalness || 0.1, 0.2);

          // Disable expensive material features if present
          if (material.normalMap) {
            material.normalScale.setScalar(0.5); // Reduce normal map intensity
          }

          // Add subtle emissive for mycelium interaction
          if (!material.emissive) {
            material.emissive = new THREE.Color('#0a1a0f');
            material.emissiveIntensity = 0.05;
          }
        }
      }
    });
  };

  // Apply optimizations when forest loads
  useEffect(() => {
    if (forest.scene) {
      optimizeForestMaterials(forest.scene);
    }
  }, [forest.scene]);

  // Highly optimized animation with frame skipping and pre-computed values
  const frameCountRef = useRef(0);
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    frameCountRef.current++;

    // Very subtle camera movement - gradual push into forest
    if (state.camera && frameCountRef.current % 5 === 0) {
      // Extremely slow forward movement into the densely populated forest area
      const forwardPush = Math.sin(time * 0.008) * 0.5; // Very slow push in/out
      const lateralSway = Math.sin(time * 0.006) * 0.3; // Gentle side-to-side
      const verticalFloat = Math.sin(time * 0.005) * 0.2; // Subtle up/down

      // Position in the densest part of the forest model
      state.camera.position.x = lateralSway;
      state.camera.position.y = 2 + verticalFloat;
      state.camera.position.z = 8 - forwardPush; // Gradually move into forest

      // Look slightly ahead into the forest
      state.camera.lookAt(0, 0, 0);
    }

    // Very gentle scene rotation (only every 3rd frame)
    if (sceneRef.current && frameCountRef.current % 3 === 0) {
      sceneRef.current.rotation.y = time * 0.002;
    }

    // Pulse mycelium (only every 4th frame)
    if (myceliumRef.current && frameCountRef.current % 4 === 0) {
      const pulse = Math.sin(time * 1.2) * 0.08 + 1.0;
      myceliumRef.current.scale.setScalar(pulse);
    }

    // Animate flowing lights (only every 4th frame for better performance)
    if (flowLightsRef.current && frameCountRef.current % 4 === 0) {
      veinLights.forEach((lightData) => {
        const { light, phase, baseX, baseZ, baseHeight, hueBase, intensityBase, zoneIndex } = lightData;

        // Slower wave calculation based on zone
        const waveSpeed = 0.8 - (zoneIndex * 0.1); // Closer lights pulse faster
        const waveOffset = time * waveSpeed + phase;
        const wave = Math.sin(waveOffset) * 0.5 + 0.5;

        // Use pre-calculated intensity base
        light.intensity = intensityBase * wave;

        // Simplified color using pre-calculated hue
        const saturation = 0.7 + wave * 0.1;
        const lightness = 0.35 + wave * 0.1;
        light.color.setHSL(hueBase, saturation, lightness);

        // Minimal movement - just slight vertical float
        const movement = Math.sin(time * 0.4 + phase) * 0.04;
        light.position.set(
          baseX,
          baseHeight + movement,
          baseZ
        );
      });
    }
  });

  return (
    <>
      {/* Proper moonlight lighting setup */}
      <ambientLight intensity={0.12} color="#1a1a2e" />

      {/* Optimized moonlight with reduced shadow quality for performance */}
      <directionalLight
        position={[8, 18, 12]}
        intensity={0.4}
        color="#4a5a6a"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0001}
      />

      {/* Camera area fill light */}
      <pointLight
        position={[0, 3, 6]}
        intensity={0.25}
        color="#5a6a7a"
        distance={15}
        decay={2}
      />

      {/* Mycelium ground glow */}
      <pointLight
        position={[0, -0.5, 0]}
        intensity={0.2}
        color="#2d5f3f"
        distance={12}
        decay={1.5}
      />

      {/* Atmospheric fog */}
      <fog attach="fog" args={['#0a0a12', 6, 30]} />

      <group ref={sceneRef}>

        {/* Optimized forest model */}
        <primitive
          object={forest.scene.clone()}
          scale={[1, 1, 1]}
          position={[0, -1, 0]}
        />

        {/* Mycelium placeholder - can be added later */}
        <group ref={myceliumRef} />

        {/* Optimized strategically placed lights */}
        <group ref={flowLightsRef}>
          {veinLights.map((lightData, index) => (
            <primitive key={index} object={lightData.light} />
          ))}
        </group>

        {/* Subtle ground plane for depth */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial
            color="#0a0f0a"
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>

      </group>
    </>
  );
}