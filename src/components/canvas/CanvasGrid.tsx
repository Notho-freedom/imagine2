'use client';

// ========================================
// IMAGINE - Canvas Grid
// Grille de fond pour le canvas
// ========================================

import React, { useMemo } from 'react';
import type { Viewport } from '@/types';

interface CanvasGridProps {
  viewport: Viewport;
  gridSize?: number;
}

export default function CanvasGrid({ 
  viewport, 
  gridSize = 40 
}: CanvasGridProps) {
  const gridPattern = useMemo(() => {
    const { zoom } = viewport;
    const scaledSize = gridSize * zoom;
    
    // Don't show grid if too small or too large
    if (scaledSize < 10 || scaledSize > 200) return null;

    return {
      size: scaledSize,
      opacity: Math.min(0.3, scaledSize / 100),
    };
  }, [viewport.zoom, gridSize]);

  if (!gridPattern) return null;

  const offsetX = viewport.x % gridPattern.size;
  const offsetY = viewport.y % gridPattern.size;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          radial-gradient(circle at 1px 1px, rgba(72, 79, 88, ${gridPattern.opacity}) 1px, transparent 0)
        `,
        backgroundSize: `${gridPattern.size}px ${gridPattern.size}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
      }}
    />
  );
}
