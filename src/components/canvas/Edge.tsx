'use client';

// ========================================
// IMAGINE - Edge Component
// Liens entre les nœuds
// ========================================

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useImagineStore } from '@/store';
import { getEdgeControlPoints } from '@/lib/utils';
import type { Edge as EdgeType } from '@/types';

interface EdgeProps {
  edge: EdgeType;
}

const relationTypeColors: Record<EdgeType['relationType'], string> = {
  manual: '#5B4B8A',    // intuition
  semantic: '#4FD1C5',  // projection
  temporal: '#8B949E',  // muted
  causal: '#FFB347',    // spark
};

export default function Edge({ edge }: EdgeProps) {
  const { nodes, deleteEdge } = useImagineStore();

  const fromNode = nodes.find((n) => n.id === edge.fromNodeId);
  const toNode = nodes.find((n) => n.id === edge.toNodeId);

  const pathData = useMemo(() => {
    if (!fromNode || !toNode) return null;

    const fromWidth = fromNode.dimensions?.width || 250;
    const fromHeight = fromNode.dimensions?.height || 120;
    const toWidth = toNode.dimensions?.width || 250;
    const toHeight = toNode.dimensions?.height || 120;

    // Calculate edge points from node centers
    const fromX = fromNode.position.x + fromWidth;
    const fromY = fromNode.position.y + fromHeight / 2;
    const toX = toNode.position.x;
    const toY = toNode.position.y + toHeight / 2;

    const { cp1x, cp1y, cp2x, cp2y } = getEdgeControlPoints(
      fromX,
      fromY,
      toX,
      toY
    );

    return {
      path: `M ${fromX} ${fromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toX} ${toY}`,
      fromX,
      fromY,
      toX,
      toY,
      midX: (fromX + toX) / 2,
      midY: (fromY + toY) / 2,
    };
  }, [fromNode, toNode]);

  if (!pathData) return null;

  const color = relationTypeColors[edge.relationType];

  return (
    <g className="edge group">
      {/* Invisible wider path for easier clicking */}
      <path
        d={pathData.path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
        onClick={() => deleteEdge(edge.id)}
      />
      
      {/* Visible path */}
      <motion.path
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.6 }}
        exit={{ pathLength: 0, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        d={pathData.path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        className="transition-all group-hover:opacity-100 group-hover:stroke-[3px]"
      />
      
      {/* Arrow head */}
      <polygon
        points="-6,-4 0,0 -6,4"
        fill={color}
        opacity={0.6}
        className="transition-opacity group-hover:opacity-100"
        transform={`translate(${pathData.toX}, ${pathData.toY}) rotate(${
          Math.atan2(
            pathData.toY - pathData.fromY,
            pathData.toX - pathData.fromX
          ) * (180 / Math.PI)
        })`}
      />

      {/* Label (if exists) */}
      {edge.label && (
        <text
          x={pathData.midX}
          y={pathData.midY - 10}
          textAnchor="middle"
          className="text-xs fill-imagine-text-muted pointer-events-none"
        >
          {edge.label}
        </text>
      )}

      {/* AI confidence indicator */}
      {edge.relationType === 'semantic' && edge.confidenceScore && (
        <circle
          cx={pathData.midX}
          cy={pathData.midY}
          r={4}
          fill={color}
          opacity={edge.confidenceScore}
          className="transition-opacity"
        />
      )}
    </g>
  );
}
