'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function EnhancedForest() {
  const forestRef = useRef<THREE.Group>(null);
  const myceliumRef = useRef<THREE.Group>(null);
  const flowsRef = useRef<THREE.Group>(null);

  // Create mycelial flow network
  const mycelialFlows = useMemo(() => {
    const flows = [];
    const numFlows = 15;

    for (let i = 0; i < numFlows; i++) {
      const points = [];
      const startAngle = (i / numFlows) * Math.PI * 2;
      const radius = 4 + Math.random() * 10;

      // Create flowing path from root to tree
      let x = Math.cos(startAngle) * radius;
      let z = Math.sin(startAngle) * radius;
      let y = -1.2; // Start underground

      for (let j = 0; j < 25; j++) {
        points.push(new THREE.Vector3(x, y, z));

        const progress = j / 24;

        if (progress < 0.6) {
          // Underground horizontal flow
          y = -1.2 + Math.sin(progress * Math.PI * 2) * 0.2;
          x += (Math.random() - 0.5) * 0.6;
          z += (Math.random() - 0.5) * 0.6;
        } else {
          // Rise up to tree trunk
          y += 0.6;
          x += (Math.random() - 0.5) * 0.3;
          z += (Math.random() - 0.5) * 0.3;
        }
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.TubeGeometry(curve, 64, 0.02, 8, false);

      flows.push({
        geometry,
        curve,
        id: i,
        phase: Math.random() * Math.PI * 2
      });
    }

    return flows;
  }, []);

  // Create enhanced trees with visible root systems
  const trees = useMemo(() => {
    const treeData = [];
    const numTrees = 8;

    for (let i = 0; i < numTrees; i++) {
      const angle = (i / numTrees) * Math.PI * 2;
      const radius = 6 + Math.random() * 8;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const height = 4 + Math.random() * 3;

      treeData.push({
        position: [x, height / 2, z],
        height,
        rootSpread: 2 + Math.random() * 2,
        id: i
      });
    }

    return treeData;
  }, []);

  // Shader material for flowing energy
  const flowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        flowColor: { value: new THREE.Color('#4a7c59') },
        glowColor: { value: new THREE.Color('#6bffb8') },
        flowSpeed: { value: 1.5 }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        uniform float time;

        void main() {
          vPosition = position;
          vNormal = normal;

          // Add subtle movement
          vec3 pos = position;
          pos.y += sin(time * 2.0 + position.x * 0.5) * 0.1;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 flowColor;
        uniform vec3 glowColor;
        uniform float flowSpeed;
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          float flow = sin(vPosition.y * 8.0 - time * flowSpeed) * 0.5 + 0.5;
          float pulse = sin(time * 2.0) * 0.3 + 0.7;

          vec3 color = mix(flowColor, glowColor, flow * pulse);
          float alpha = (flow * pulse + 0.3) * 0.8;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
  }, []);

  // Ground glow material
  const groundMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        glowColor: { value: new THREE.Color('#2d5f3f') }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;

        void main() {
          vUv = uv;
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 glowColor;
        varying vec2 vUv;
        varying vec3 vWorldPosition;

        void main() {
          float dist = length(vWorldPosition.xz);
          float ripple = sin(time * 1.5 + dist * 0.3) * 0.5 + 0.5;
          float fade = 1.0 - smoothstep(0.0, 25.0, dist);

          float alpha = ripple * fade * 0.4;
          gl_FragColor = vec4(glowColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
  }, []);

  // Animation
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Update shader uniforms
    if (flowMaterial.uniforms) {
      flowMaterial.uniforms.time.value = time;
    }
    if (groundMaterial.uniforms) {
      groundMaterial.uniforms.time.value = time;
    }

    // Gentle scene rotation
    if (forestRef.current) {
      forestRef.current.rotation.y = time * 0.003;
    }

    // Pulse mycelium network
    if (myceliumRef.current) {
      const pulse = Math.sin(time * 1.2) * 0.05 + 1.0;
      myceliumRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <>
      {/* Atmospheric lighting */}
      <ambientLight intensity={0.08} color="#1a1a2e" />

      <directionalLight
        position={[-8, 15, 8]}
        intensity={0.25}
        color="#4a7c59"
        castShadow
      />

      <pointLight
        position={[0, -2, 0]}
        intensity={0.4}
        color="#2d5f3f"
        distance={30}
      />

      {/* Atmospheric fog */}
      <fog attach="fog" args={['#0a0a12', 12, 45]} />

      {/* Main forest group */}
      <group ref={forestRef}>

        {/* Enhanced ground with mycelial glow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
          <planeGeometry args={[60, 60, 64, 64]} />
          <primitive object={groundMaterial} />
        </mesh>

        {/* Enhanced trees with root systems */}
        {trees.map((tree) => (
          <group key={tree.id} position={tree.position as [number, number, number]}>

            {/* Main tree trunk */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.15, 0.25, tree.height, 12]} />
              <meshBasicMaterial
                color="#3d4f3d"
                wireframe
                transparent
                opacity={0.7}
              />
            </mesh>

            {/* Tree canopy */}
            <mesh position={[0, tree.height * 0.4, 0]}>
              <coneGeometry args={[tree.height * 0.5, tree.height * 0.7, 16]} />
              <meshBasicMaterial
                color="#4a7c4f"
                wireframe
                transparent
                opacity={0.6}
              />
            </mesh>

            {/* Visible root system */}
            {[...Array(6)].map((_, rootIndex) => {
              const rootAngle = (rootIndex / 6) * Math.PI * 2;
              const rootLength = tree.rootSpread;
              const rootX = Math.cos(rootAngle) * rootLength;
              const rootZ = Math.sin(rootAngle) * rootLength;

              return (
                <mesh
                  key={rootIndex}
                  position={[rootX / 2, -tree.height / 2 - 0.3, rootZ / 2]}
                  rotation={[0, rootAngle, Math.PI / 6]}
                >
                  <cylinderGeometry args={[0.05, 0.12, rootLength, 8]} />
                  <meshBasicMaterial
                    color="#5a6b5a"
                    wireframe
                    transparent
                    opacity={0.5}
                  />
                </mesh>
              );
            })}

            {/* Root glow node */}
            <mesh position={[0, -tree.height / 2 - 0.5, 0]}>
              <sphereGeometry args={[0.3, 12, 12]} />
              <meshBasicMaterial
                color="#6bffb8"
                transparent
                opacity={0.4}
              />
            </mesh>
          </group>
        ))}

        {/* Mycelial flow network */}
        <group ref={myceliumRef}>
          {mycelialFlows.map((flow) => (
            <mesh key={flow.id} geometry={flow.geometry}>
              <primitive object={flowMaterial.clone()} />
            </mesh>
          ))}
        </group>

        {/* Additional underground mycelium nodes */}
        <group ref={flowsRef}>
          {[...Array(20)].map((_, index) => {
            const angle = (index / 20) * Math.PI * 2;
            const radius = 2 + Math.random() * 15;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            return (
              <mesh key={index} position={[x, -0.8, z]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshBasicMaterial
                  color="#4a7c59"
                  transparent
                  opacity={0.6}
                />
              </mesh>
            );
          })}
        </group>
      </group>
    </>
  );
}