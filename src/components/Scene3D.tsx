'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { DarkForest } from './DarkForest';
import { LoadingScreen } from './LoadingScreen';

export function Scene3D() {
  return (
    <div className="fixed inset-0 w-full h-full">
      <Canvas
        camera={{
          position: [0, 2, 8],
          fov: 60,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{
          background: '#0a0a12',
        }}
      >
        <Suspense fallback={null}>
          <DarkForest />
        </Suspense>
      </Canvas>
      <Suspense fallback={<LoadingScreen />}>
        <div className="pointer-events-none" />
      </Suspense>
    </div>
  );
}