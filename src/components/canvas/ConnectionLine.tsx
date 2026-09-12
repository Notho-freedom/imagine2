'use client';

// ========================================
// IMAGINE - Connection Line
// Ligne de connexion pendant la création d'un lien
// ========================================

import React, { useState, useEffect } from 'react';
import { useImagineStore } from '@/store';

export default function ConnectionLine() {
  const { canvas, nodes, setConnecting } = useImagineStore();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const isConnecting = canvas.isConnecting;
  const sourceId = canvas.connectionSource;

  const sourceNode = sourceId ? nodes.find((n) => n.id === sourceId) : null;

  useEffect(() => {
    if (!isConnecting) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { viewport } = canvas;
      setMousePos({
        x: (e.clientX - viewport.x) / viewport.zoom,
        y: (e.clientY - viewport.y) / viewport.zoom,
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Check if mouse is over a node
      const target = e.target as HTMLElement;
      const nodeElement = target.closest('[data-node-id]');
      
      if (nodeElement && sourceId) {
        const targetId = nodeElement.getAttribute('data-node-id');
        if (targetId && targetId !== sourceId) {
          // Emit event for connection completion - let Canvas handle with label picker
          const event = new CustomEvent('connection-complete', {
            detail: {
              fromId: sourceId,
              toId: targetId,
              x: e.clientX,
              y: e.clientY,
            },
          });
          window.dispatchEvent(event);
          // Don't call setConnecting(false) here - Canvas will handle it after label selection
          return;
        }
      }

      setConnecting(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConnecting(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isConnecting, sourceId, canvas, setConnecting]);

  if (!isConnecting || !sourceNode) return null;

  const sourceWidth = sourceNode.dimensions?.width || 250;
  const sourceHeight = sourceNode.dimensions?.height || 120;
  const fromX = sourceNode.position.x + sourceWidth;
  const fromY = sourceNode.position.y + sourceHeight / 2;

  // Calculate control points for bezier curve
  const dx = mousePos.x - fromX;
  const curvature = Math.min(Math.abs(dx) * 0.3, 100);

  const path = `M ${fromX} ${fromY} C ${fromX + curvature} ${fromY}, ${mousePos.x - curvature} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      {/* Glow effect */}
      <path
        d={path}
        fill="none"
        stroke="rgba(79, 209, 197, 0.3)"
        strokeWidth={8}
        strokeLinecap="round"
      />
      
      {/* Main line */}
      <path
        d={path}
        fill="none"
        stroke="#4FD1C5"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="8,4"
        className="animate-pulse"
      />

      {/* End point indicator */}
      <circle
        cx={mousePos.x}
        cy={mousePos.y}
        r={6}
        fill="#4FD1C5"
        className="animate-pulse"
      />
    </svg>
  );
}
