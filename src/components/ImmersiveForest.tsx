'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

export function ImmersiveForest() {
  const forestRef = useRef<THREE.Group>(null);
  const myceliumRef = useRef<THREE.Group>(null);
  const flowLinesRef = useRef<THREE.Group>(null);

  // Load the main forest model
  const forest = useLoader(GLTFLoader, '/models/scene.gltf');

  // Create flowing light paths for mycelial networks
  const mycelialFlows = useMemo(() => {
    const flows = [];
    const numFlows = 20;

    for (let i = 0; i < numFlows; i++) {
      const points = [];
      const startAngle = (i / numFlows) * Math.PI * 2;
      const radius = 3 + Math.random() * 12;

      // Start from tree root area
      let x = Math.cos(startAngle) * radius;
      let z = Math.sin(startAngle) * radius;
      let y = -0.8;

      // Create organic flowing path
      for (let j = 0; j < 30; j++) {
        points.push(new THREE.Vector3(x, y, z));

        // Flow horizontally underground, then up to another tree
        const progress = j / 29;
        if (progress < 0.7) {
          // Underground horizontal flow
          y = -0.8 + Math.sin(progress * Math.PI) * 0.3;
          x += (Math.random() - 0.5) * 0.8;
          z += (Math.random() - 0.5) * 0.8;
        } else {
          // Rise up to tree trunk/branches
          y += 0.4;
          x += (Math.random() - 0.5) * 0.2;
          z += (Math.random() - 0.5) * 0.2;
        }
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      flows.push({
        geometry,
        id: i,
        phase: Math.random() * Math.PI * 2
      });
    }

    return flows;
  }, []);

  // Create shader material for flowing light
  const flowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        glowColor: { value: new THREE.Color('#4a7c59') },
        flowSpeed: { value: 2.0 }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying float vProgress;
        attribute float progress;

        void main() {
          vPosition = position;
          vProgress = progress;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 glowColor;
        uniform float flowSpeed;
        varying vec3 vPosition;
        varying float vProgress;

        void main() {
          float flow = sin(vProgress * 6.28 - time * flowSpeed) * 0.5 + 0.5;
          float pulse = sin(time * 3.0) * 0.3 + 0.7;
          float alpha = flow * pulse * 0.6;

          gl_FragColor = vec4(glowColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
  }, []);

  // Ground glow material for mycelium visibility
  const groundGlowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        glowColor: { value: new THREE.Color('#2d5f3f') },
        intensity: { value: 0.3 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 glowColor;
        uniform float intensity;
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
          float dist = length(vPosition.xz);
          float pulse = sin(time * 2.0 + dist * 0.5) * 0.5 + 0.5;
          float fade = 1.0 - smoothstep(0.0, 20.0, dist);
          float alpha = pulse * intensity * fade;

          gl_FragColor = vec4(glowColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
  }, []);

  // Animation loop
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Update shader uniforms
    if (flowMaterial.uniforms) {
      flowMaterial.uniforms.time.value = time;
    }
    if (groundGlowMaterial.uniforms) {
      groundGlowMaterial.uniforms.time.value = time;
    }

    // Gentle rotation of entire scene
    if (forestRef.current) {
      forestRef.current.rotation.y = time * 0.005;
    }

    // Pulse mycelium models if available
    if (myceliumRef.current) {
      const pulse = Math.sin(time * 1.5) * 0.1 + 1.0;
      myceliumRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <>
      {/* Enhanced lighting for immersive atmosphere */}
      <ambientLight intensity={0.05} color="#1a1a2e" />

      {/* Moonlight-style directional light */}
      <directionalLight
        position={[-10, 20, 10]}
        intensity={0.2}
        color="#4a7c59"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Soft fill light from below (mycelium glow) */}
      <pointLight
        position={[0, -5, 0]}
        intensity={0.3}
        color="#2d5f3f"
        distance={25}
      />

      {/* Atmospheric fog */}
      <fog attach="fog" args={['#0a0a12', 8, 40]} />

      {/* Main forest group */}
      <group ref={forestRef}>

        {/* Main forest model from GLTF */}
        <primitive
          object={forest.scene.clone()}
          scale={[2, 2, 2]}
          position={[0, -1, 0]}
        />

        {/* Ground plane with subtle mycelium glow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.99, 0]}>
          <planeGeometry args={[50, 50, 32, 32]} />
          <primitive object={groundGlowMaterial} />
        </mesh>

        {/* Mycelium placeholder - can be added later */}
        <group ref={myceliumRef} />

        {/* Flowing mycelial networks */}
        <group ref={flowLinesRef}>
          {mycelialFlows.map((flow) => (
            <line key={flow.id} geometry={flow.geometry}>
              <primitive object={flowMaterial.clone()} />
            </line>
          ))}
        </group>

        {/* Additional glowing nodes at tree bases */}
        {[...Array(12)].map((_, index) => {
          const angle = (index / 12) * Math.PI * 2;
          const radius = 4 + Math.random() * 8;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;

          return (
            <group key={index} position={[x, -0.6, z]}>
              {/* Root glow */}
              <mesh>
                <sphereGeometry args={[0.3, 8, 8]} />
                <meshBasicMaterial
                  color="#4a7c59"
                  transparent
                  opacity={0.4}
                />
              </mesh>

              {/* Upward flow to trunk */}
              <mesh position={[0, 1, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 2, 8]} />
                <meshBasicMaterial
                  color="#6bffb8"
                  transparent
                  opacity={0.6}
                />
              </mesh>
            </group>
          );
        })}
      </group>
    </>
  );
}