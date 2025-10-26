'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

export function DarkForestScene() {
  const sceneRef = useRef<THREE.Group>(null);
  const myceliumRef = useRef<THREE.Group>(null);
  const lightsRef = useRef<THREE.Group>(null);

  // Load the forest model
  const forest = useLoader(GLTFLoader, '/models/scene.gltf');

  // Create pulsing lights that flow up from mycelium through trees
  const pulsingLights = useMemo(() => {
    const lights = [];
    const numFlows = 8; // Simplified number of flows

    for (let i = 0; i < numFlows; i++) {
      const angle = (i / numFlows) * Math.PI * 2;
      const radius = 4 + Math.random() * 6;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Create a series of lights that will flow up the tree
      const flowLights = [];
      for (let j = 0; j < 12; j++) {
        const light = new THREE.PointLight('#4a7c59', 0, 3, 2);
        const height = -1 + (j / 11) * 6; // From underground to canopy
        light.position.set(
          x + (Math.random() - 0.5) * 0.8,
          height,
          z + (Math.random() - 0.5) * 0.8
        );
        flowLights.push({
          light,
          baseHeight: height,
          flowIndex: j,
          phase: Math.random() * Math.PI * 2
        });
      }

      lights.push({
        id: i,
        position: [x, 0, z],
        flowLights,
        phase: (i / numFlows) * Math.PI * 2
      });
    }

    return lights;
  }, []);

  // Enhanced forest material with emissive capability
  const enhanceForestMaterials = (object: THREE.Object3D) => {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material) {
          // Clone the material and add emissive properties
          const material = child.material as THREE.MeshStandardMaterial;
          const newMaterial = material.clone();

          // Add subtle emissive glow
          newMaterial.emissive = new THREE.Color('#0f1f0f');
          newMaterial.emissiveIntensity = 0.1;

          // Make it respond to our pulsing lights
          newMaterial.transparent = true;
          newMaterial.opacity = 0.9;

          child.material = newMaterial;
        }
      }
    });
  };

  // Apply material enhancements when forest loads
  useEffect(() => {
    if (forest.scene) {
      enhanceForestMaterials(forest.scene);
    }
  }, [forest.scene]);

  // Animation loop
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Gentle scene rotation
    if (sceneRef.current) {
      sceneRef.current.rotation.y = time * 0.002;
    }

    // Pulse mycelium
    if (myceliumRef.current) {
      const pulse = Math.sin(time * 1.5) * 0.1 + 1.0;
      myceliumRef.current.scale.setScalar(pulse);

      // Update mycelium emissive intensity
      myceliumRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material as THREE.MeshBasicMaterial;
          if (material.emissive) {
            material.emissiveIntensity = 0.2 + Math.sin(time * 2) * 0.15;
          }
        }
      });
    }

    // Animate the flowing lights
    if (lightsRef.current) {
      pulsingLights.forEach((flow) => {
        flow.flowLights.forEach((lightData) => {
          const { light, flowIndex: fIndex, phase } = lightData;

          // Create wave effect that flows from bottom to top
          const waveOffset = time * 2 + flow.phase + (fIndex * 0.3);
          const wave = Math.sin(waveOffset) * 0.5 + 0.5;

          // Intensity decreases with height but pulses
          const baseIntensity = (1 - fIndex / 11) * 0.8;
          const pulsedIntensity = baseIntensity * wave;

          light.intensity = pulsedIntensity;

          // Color shifts slightly as it flows up
          const hue = 0.3 + (fIndex / 11) * 0.1; // Green to slightly more yellow-green
          light.color.setHSL(hue, 0.7, 0.4 + wave * 0.3);

          // Slight movement for organic feel
          const movement = Math.sin(time + phase) * 0.1;
          light.position.y = lightData.baseHeight + movement;
        });
      });
    }
  });

  return (
    <>
      {/* Minimal atmospheric lighting */}
      <ambientLight intensity={0.05} color="#0a0a12" />

      {/* Subtle directional light */}
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.1}
        color="#1a2f1a"
      />

      {/* Deep atmospheric fog */}
      <fog attach="fog" args={['#0a0a12', 8, 35]} />

      {/* Main scene group */}
      <group ref={sceneRef}>

        {/* Forest model */}
        <primitive
          object={forest.scene.clone()}
          scale={[1.5, 1.5, 1.5]}
          position={[0, -1, 0]}
        />

        {/* Mycelium placeholder - can be added later */}
        <group ref={myceliumRef} />

        {/* Pulsing light flows */}
        <group ref={lightsRef}>
          {pulsingLights.map((flow) => (
            <group key={flow.id} position={flow.position as [number, number, number]}>
              {flow.flowLights.map((lightData, index) => (
                <primitive key={index} object={lightData.light} />
              ))}
            </group>
          ))}
        </group>

        {/* Subtle ground glow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]}>
          <planeGeometry args={[40, 40]} />
          <meshBasicMaterial
            color="#1a2f1a"
            transparent
            opacity={0.3}
          />
        </mesh>
      </group>
    </>
  );
}