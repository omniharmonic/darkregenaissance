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

  // Highly optimized flowing lights (performance critical)
  const veinLights = useMemo(() => {
    const flows = [];
    const numFlows = 4; // Further reduced for performance

    for (let i = 0; i < numFlows; i++) {
      const angle = (i / numFlows) * Math.PI * 2;
      const radius = 4 + Math.random() * 4;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Only 3 lights per flow (12 total instead of 36)
      const flowLights = [];
      for (let j = 0; j < 3; j++) {
        const light = new THREE.PointLight('#4a7c59', 0, 6, 1.2);
        const height = -0.5 + (j / 2) * 4; // Optimized height range
        light.position.set(
          x + (Math.random() - 0.5) * 0.4,
          height,
          z + (Math.random() - 0.5) * 0.4
        );

        // Maximum performance settings
        light.castShadow = false;
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 10;

        flowLights.push({
          light,
          baseHeight: height,
          flowIndex: j,
          baseX: x + (Math.random() - 0.5) * 0.4,
          baseZ: z + (Math.random() - 0.5) * 0.4,
          phase: Math.random() * Math.PI * 2,
          // Pre-calculate color values for performance
          hueBase: 0.28 + (j / 2) * 0.06,
          intensityBase: Math.pow(1 - j / 2, 0.5) * 0.8
        });
      }

      flows.push({
        id: i,
        flowLights,
        phase: (i / numFlows) * Math.PI * 2
      });
    }

    return flows;
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

    // Very gentle scene rotation (only every 3rd frame)
    if (sceneRef.current && frameCountRef.current % 3 === 0) {
      sceneRef.current.rotation.y = time * 0.002;
    }

    // Pulse mycelium (only every 4th frame)
    if (myceliumRef.current && frameCountRef.current % 4 === 0) {
      const pulse = Math.sin(time * 1.2) * 0.08 + 1.0;
      myceliumRef.current.scale.setScalar(pulse);
    }

    // Animate flowing lights (only every 2nd frame for 30fps instead of 60fps)
    if (flowLightsRef.current && frameCountRef.current % 2 === 0) {
      veinLights.forEach((flow) => {
        flow.flowLights.forEach((lightData) => {
          const { light, flowIndex, phase, baseX, baseZ, baseHeight, hueBase, intensityBase } = lightData;

          // Simplified wave calculation
          const waveOffset = time * 1.2 + flow.phase + (flowIndex * 0.5);
          const wave = Math.sin(waveOffset) * 0.5 + 0.5;

          // Use pre-calculated intensity base
          light.intensity = intensityBase * wave;

          // Simplified color using pre-calculated hue
          const saturation = 0.7 + wave * 0.15;
          const lightness = 0.35 + wave * 0.15;
          light.color.setHSL(hueBase, saturation, lightness);

          // Reduced movement calculation
          const movement = Math.sin(time * 0.6 + phase) * 0.06;
          light.position.set(
            baseX + movement,
            baseHeight + movement * 0.3,
            baseZ + movement
          );
        });
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

        {/* Optimized flowing vein lights */}
        <group ref={flowLightsRef}>
          {veinLights.map((flow) => (
            <group key={flow.id}>
              {flow.flowLights.map((lightData, index) => (
                <primitive key={index} object={lightData.light} />
              ))}
            </group>
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