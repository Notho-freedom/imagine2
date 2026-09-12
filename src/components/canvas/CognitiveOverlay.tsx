'use client';

// ========================================
// IMAGINE - Cognitive Overlay
// Heatmap et visualisation d'activité cognitive
// ========================================

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useImagineStore } from '@/store';
import type { ImagineNode, Edge } from '@/types';

interface CognitiveOverlayProps {
  enabled?: boolean;
  mode?: 'heatmap' | 'connections' | 'dormant';
}

interface HeatPoint {
  x: number;
  y: number;
  intensity: number;
  radius: number;
}

export default function CognitiveOverlay({ 
  enabled = false, 
  mode = 'heatmap' 
}: CognitiveOverlayProps) {
  const { nodes, edges, canvas } = useImagineStore();
  const { viewport } = canvas;

  // Calculer les points de chaleur basés sur l'activité des nœuds
  const heatPoints = useMemo(() => {
    const points: HeatPoint[] = [];
    
    nodes.forEach(node => {
      // Calculer l'intensité basée sur les connexions et la maturité
      const connectionCount = edges.filter(
        e => e.fromNodeId === node.id || e.toNodeId === node.id
      ).length;
      
      // Plus de connexions = plus chaud
      const intensity = Math.min(connectionCount / 5, 1);
      
      // Calculer le rayon basé sur le contenu
      const contentLength = node.type === 'text' 
        ? ((node as any).content?.length || 0) 
        : 100;
      const radius = Math.min(50 + contentLength * 0.5, 200);
      
      points.push({
        x: node.position.x + (node.dimensions?.width || 200) / 2,
        y: node.position.y + (node.dimensions?.height || 100) / 2,
        intensity,
        radius,
      });
    });
    
    return points;
  }, [nodes, edges]);

  // Calculer les zones dormantes (loin de tout nœud)
  const dormantZones = useMemo(() => {
    if (mode !== 'dormant' || nodes.length === 0) return [];
    
    // Simplification : identifier les coins "vides"
    const zones: Array<{ x: number; y: number; size: number }> = [];
    
    // Trouver les limites du canvas utilisé
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x + (node.dimensions?.width || 200));
      minY = Math.min(minY, node.position.y);
      maxY = Math.max(maxY, node.position.y + (node.dimensions?.height || 100));
    });
    
    // Ajouter des zones dormantes aux extrémités
    const padding = 300;
    zones.push(
      { x: minX - padding, y: minY - padding, size: 200 },
      { x: maxX + padding, y: minY - padding, size: 200 },
      { x: minX - padding, y: maxY + padding, size: 200 },
      { x: maxX + padding, y: maxY + padding, size: 200 },
    );
    
    return zones;
  }, [nodes, mode]);

  // Calculer l'intensité des liens
  const linkIntensities = useMemo(() => {
    if (mode !== 'connections') return [];
    
    return edges.map(edge => {
      const fromNode = nodes.find(n => n.id === edge.fromNodeId);
      const toNode = nodes.find(n => n.id === edge.toNodeId);
      
      if (!fromNode || !toNode) return null;
      
      // Intensité basée sur la "distance" conceptuelle (pour l'instant, distance spatiale)
      const dx = fromNode.position.x - toNode.position.x;
      const dy = fromNode.position.y - toNode.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Plus la distance est grande, plus le lien est "fort" (intentionnel)
      const intensity = Math.min(distance / 500, 1);
      
      return {
        id: edge.id,
        from: {
          x: fromNode.position.x + (fromNode.dimensions?.width || 200) / 2,
          y: fromNode.position.y + (fromNode.dimensions?.height || 100) / 2,
        },
        to: {
          x: toNode.position.x + (toNode.dimensions?.width || 200) / 2,
          y: toNode.position.y + (toNode.dimensions?.height || 100) / 2,
        },
        intensity,
        relationType: edge.relationType,
      };
    }).filter(Boolean);
  }, [nodes, edges, mode]);

  if (!enabled || nodes.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Heatmap Mode */}
        {mode === 'heatmap' && (
          <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
            <defs>
              {heatPoints.map((point, index) => (
                <radialGradient
                  key={`heat-gradient-${index}`}
                  id={`heat-gradient-${index}`}
                  cx="50%"
                  cy="50%"
                  r="50%"
                >
                  <stop
                    offset="0%"
                    stopColor={point.intensity > 0.6 ? '#4FD1C5' : point.intensity > 0.3 ? '#5B4B8A' : '#1E3A5F'}
                    stopOpacity={0.4 * point.intensity + 0.1}
                  />
                  <stop
                    offset="100%"
                    stopColor={point.intensity > 0.6 ? '#4FD1C5' : '#1E3A5F'}
                    stopOpacity="0"
                  />
                </radialGradient>
              ))}
            </defs>
            
            {heatPoints.map((point, index) => (
              <motion.circle
                key={`heat-${index}`}
                cx={point.x}
                cy={point.y}
                r={point.radius}
                fill={`url(#heat-gradient-${index})`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: 1,
                }}
                transition={{
                  scale: {
                    duration: 4 + index * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                  opacity: { duration: 0.5 },
                }}
              />
            ))}
          </svg>
        )}

        {/* Connections Intensity Mode */}
        {mode === 'connections' && (
          <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
            <defs>
              <filter id="connection-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            {linkIntensities.map((link: any) => (
              <motion.line
                key={link.id}
                x1={link.from.x}
                y1={link.from.y}
                x2={link.to.x}
                y2={link.to.y}
                stroke={link.intensity > 0.5 ? '#4FD1C5' : '#5B4B8A'}
                strokeWidth={2 + link.intensity * 4}
                strokeOpacity={0.3 + link.intensity * 0.4}
                filter="url(#connection-glow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            ))}
          </svg>
        )}

        {/* Dormant Zones Mode */}
        {mode === 'dormant' && (
          <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
            {dormantZones.map((zone, index) => (
              <motion.circle
                key={`dormant-${index}`}
                cx={zone.x}
                cy={zone.y}
                r={zone.size}
                fill="none"
                stroke="#3A3A4A"
                strokeWidth="1"
                strokeDasharray="8 4"
                strokeOpacity={0.3}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: [0.2, 0.4, 0.2],
                  scale: 1,
                }}
                transition={{
                  opacity: {
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                  scale: { duration: 0.5 },
                }}
              />
            ))}
            
            {/* Indication textuelle */}
            {dormantZones.slice(0, 1).map((zone, index) => (
              <motion.text
                key={`dormant-text-${index}`}
                x={zone.x}
                y={zone.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#5A5A6A"
                fontSize="12"
                opacity={0.5}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 0.5 }}
              >
                Zone inactive
              </motion.text>
            ))}
          </svg>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
