'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

export function OptimizedForest() {
  const sceneRef = useRef<THREE.Group>(null);
  const veinsRef = useRef<THREE.Group>(null);

  // Load forest with error handling and optimization
  let forest: any = null;
  try {
    forest = useLoader(GLTFLoader, '/models/scene.gltf');
  } catch (error) {
    console.log('Forest model loading...');
  }

  // Create vein effect using simple geometry + shaders (much more performant)
  const veinMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color('#2d5f3f') },
        color2: { value: new THREE.Color('#4a7c59') },
        glowColor: { value: new THREE.Color('#6bffb8') }
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
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 glowColor;
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
          // Create flowing vein effect
          float flow = sin(vPosition.y * 4.0 - time * 2.0) * 0.5 + 0.5;
          float pulse = sin(time * 1.5) * 0.3 + 0.7;

          // Mix colors based on flow
          vec3 color = mix(color1, color2, flow);
          color = mix(color, glowColor, flow * pulse * 0.3);

          // Create vein-like alpha pattern
          float veinPattern = smoothstep(0.3, 0.7, flow * pulse);
          float alpha = veinPattern * 0.6;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
  }, []);

  // Simple mycelium ground glow (performance optimized)
  const myceliumMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        glowColor: { value: new THREE.Color('#2d5f3f') }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 glowColor;
        varying vec2 vUv;

        void main() {
          vec2 center = vec2(0.5, 0.5);
          float dist = length(vUv - center);

          // Create organic pulsing pattern
          float pulse = sin(time * 2.0 + dist * 8.0) * 0.5 + 0.5;
          float fade = 1.0 - smoothstep(0.0, 0.5, dist);

          float alpha = pulse * fade * 0.4;
          gl_FragColor = vec4(glowColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
  }, []);

  // Create simple vein geometry (just a few key paths)
  const veinGeometry = useMemo(() => {
    const veins = [];
    const numVeins = 4; // Much fewer for performance

    for (let i = 0; i < numVeins; i++) {
      const angle = (i / numVeins) * Math.PI * 2;
      const radius = 3 + Math.random() * 4;

      const points = [
        new THREE.Vector3(Math.cos(angle) * radius, -1, Math.sin(angle) * radius),
        new THREE.Vector3(Math.cos(angle) * radius * 0.8, 0, Math.sin(angle) * radius * 0.8),
        new THREE.Vector3(Math.cos(angle) * radius * 0.6, 2, Math.sin(angle) * radius * 0.6),
        new THREE.Vector3(Math.cos(angle) * radius * 0.4, 4, Math.sin(angle) * radius * 0.4)
      ];

      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.TubeGeometry(curve, 20, 0.05, 8, false);

      veins.push(geometry);
    }

    return veins;
  }, []);

  // Animation (optimized - fewer updates)
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Very gentle scene rotation
    if (sceneRef.current) {
      sceneRef.current.rotation.y = time * 0.001;
    }

    // Update shader uniforms (efficient)
    if (veinMaterial.uniforms) {
      veinMaterial.uniforms.time.value = time;
    }
    if (myceliumMaterial.uniforms) {
      myceliumMaterial.uniforms.time.value = time;
    }
  });

  return (
    <>
      {/* Enhanced lighting setup for better camera-area visibility */}
      <ambientLight intensity={0.2} color="#1a1a2e" />

      {/* Main moonlight positioned for better camera-area illumination */}
      <directionalLight
        position={[5, 15, 8]}
        intensity={0.4}
        color="#4a5a6a"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Camera-area rim light for depth and detail */}
      <pointLight
        position={[0, 5, 5]}
        intensity={0.3}
        color="#6a7a8a"
        distance={12}
      />

      {/* Soft ground fill light near camera */}
      <pointLight
        position={[0, 1, 3]}
        intensity={0.25}
        color="#2d5f3f"
        distance={8}
      />

      {/* Background depth light */}
      <pointLight
        position={[0, -1, -5]}
        intensity={0.15}
        color="#1a3f2f"
        distance={20}
      />

      {/* Atmospheric fog */}
      <fog attach="fog" args={['#0a0a12', 5, 25]} />

      <group ref={sceneRef}>

        {/* Forest model (if loaded) */}
        {forest && (
          <primitive
            object={forest.scene.clone()}
            scale={[1, 1, 1]}
            position={[0, -1, 0]}
          />
        )}

        {/* Fallback simple trees if model doesn't load */}
        {!forest && (
          <group>
            {[...Array(6)].map((_, i) => {
              const angle = (i / 6) * Math.PI * 2;
              const radius = 4 + Math.random() * 3;
              const x = Math.cos(angle) * radius;
              const z = Math.sin(angle) * radius;
              const height = 3 + Math.random() * 2;

              return (
                <group key={i} position={[x, height/2 - 1, z]}>
                  <mesh>
                    <cylinderGeometry args={[0.1, 0.15, height, 8]} />
                    <meshStandardMaterial color="#2d3d2d" />
                  </mesh>
                  <mesh position={[0, height * 0.3, 0]}>
                    <coneGeometry args={[height * 0.4, height * 0.6, 8]} />
                    <meshStandardMaterial color="#3d4d3d" />
                  </mesh>
                </group>
              );
            })}
          </group>
        )}

        {/* Mycelium ground glow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.95, 0]}>
          <planeGeometry args={[20, 20, 32, 32]} />
          <primitive object={myceliumMaterial} />
        </mesh>

        {/* Vein effects (performance optimized) */}
        <group ref={veinsRef}>
          {veinGeometry.map((geometry, index) => (
            <mesh key={index} geometry={geometry}>
              <primitive object={veinMaterial.clone()} />
            </mesh>
          ))}
        </group>

        {/* Simple ground plane for depth */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#0a0f0a" />
        </mesh>

      </group>
    </>
  );
}