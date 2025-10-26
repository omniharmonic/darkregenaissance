'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { PerformantForest } from './PerformantForest';
import { LoadingScreen } from './LoadingScreen';

export function Scene3D() {
  return (
    <div className="fixed inset-0 w-full h-full">
      <Canvas
        camera={{
          position: [0, 2, 8],
          fov: 60,
          near: 0.1,
          far: 50,
        }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
        style={{
          background: '#0a0a12',
        }}
      >
        <Suspense fallback={null}>
          <PerformantForest />
        </Suspense>
      </Canvas>
      <Suspense fallback={<LoadingScreen />}>
        <div className="pointer-events-none" />
      </Suspense>
    </div>
  );
}