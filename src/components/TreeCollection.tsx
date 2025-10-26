'use client';

import { useMemo } from 'react';
import { WireframeTree } from './WireframeTree';

export function TreeCollection() {
  // Generate random tree positions
  const treePositions = useMemo(() => {
    const positions = [];
    const treeCount = 20;

    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2;
      const radius = 8 + Math.random() * 12; // Trees in a circle, varying distance
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 4;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 4;
      const scale = 0.8 + Math.random() * 0.6; // Varying tree sizes
      const rotation = Math.random() * Math.PI * 2;

      positions.push({ x, z, scale, rotation });
    }

    return positions;
  }, []);

  return (
    <>
      {treePositions.map((pos, index) => (
        <WireframeTree
          key={index}
          position={[pos.x, 0, pos.z]}
          scale={pos.scale}
          rotation={[0, pos.rotation, 0]}
        />
      ))}
    </>
  );
}