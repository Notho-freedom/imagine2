'use client';

// ========================================
// IMAGINE - Cognitive MiniMap
// Mini-carte intelligente du réseau d'idées
// ========================================

import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map as MapIcon, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useImagineStore } from '@/store';
import { cn } from '@/lib/utils';

// ========================================
// Types
// ========================================

interface NodeCluster {
  id: string;
  x: number;
  y: number;
  size: number;
  intensity: number;
  type: 'active' | 'dormant' | 'isolated';
}

// ========================================
// Main Component
// ========================================

export default function MiniMap() {
  const { nodes, edges, canvas, setViewport, resetViewport } = useImagineStore();
  const viewport = canvas.viewport;
  
  // Helper to change zoom
  const changeZoom = useCallback((delta: number) => {
    const newZoom = Math.max(0.25, Math.min(2, viewport.zoom + delta));
    setViewport({ zoom: newZoom });
  }, [viewport.zoom, setViewport]);
  
  // Calculate viewport and bounds
  const bounds = useMemo(() => {
    if (nodes.length === 0) {
      return { minX: 0, maxX: 1000, minY: 0, maxY: 1000, width: 1000, height: 1000 };
    }
    
    const xs = nodes.map(n => n.position.x);
    const ys = nodes.map(n => n.position.y);
    const minX = Math.min(...xs) - 100;
    const maxX = Math.max(...xs) + 100;
    const minY = Math.min(...ys) - 100;
    const maxY = Math.max(...ys) + 100;
    
    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [nodes]);

  // Calculate node intensity (based on connections)
  const nodeIntensities = useMemo(() => {
    const intensities = new Map<string, number>();
    
    nodes.forEach(node => {
      const connectionCount = edges.filter(
        e => e.fromNodeId === node.id || e.toNodeId === node.id
      ).length;
      
      // Normalize intensity (0-1)
      const maxConnections = 10;
      intensities.set(node.id, Math.min(connectionCount / maxConnections, 1));
    });
    
    return intensities;
  }, [nodes, edges]);

  // Identify clusters/hotspots
  const clusters = useMemo((): NodeCluster[] => {
    if (nodes.length === 0) return [];
    
    return nodes.map(node => {
      const connectionCount = edges.filter(
        e => e.fromNodeId === node.id || e.toNodeId === node.id
      ).length;
      
      let type: 'active' | 'dormant' | 'isolated' = 'dormant';
      if (connectionCount === 0) type = 'isolated';
      else if (connectionCount >= 3) type = 'active';
      
      return {
        id: node.id,
        x: ((node.position.x - bounds.minX) / bounds.width) * 100,
        y: ((node.position.y - bounds.minY) / bounds.height) * 100,
        size: 2 + connectionCount * 0.5,
        intensity: nodeIntensities.get(node.id) || 0,
        type,
      };
    });
  }, [nodes, edges, bounds, nodeIntensities]);

  // Map edges to mini-map coordinates
  const miniEdges = useMemo(() => {
    return edges.map(edge => {
      const fromNode = nodes.find(n => n.id === edge.fromNodeId);
      const toNode = nodes.find(n => n.id === edge.toNodeId);
      
      if (!fromNode || !toNode) return null;
      
      return {
        id: edge.id,
        x1: ((fromNode.position.x - bounds.minX) / bounds.width) * 100,
        y1: ((fromNode.position.y - bounds.minY) / bounds.height) * 100,
        x2: ((toNode.position.x - bounds.minX) / bounds.width) * 100,
        y2: ((toNode.position.y - bounds.minY) / bounds.height) * 100,
        weight: edge.weight || 0.5,
      };
    }).filter(Boolean);
  }, [edges, nodes, bounds]);

  // Viewport rectangle
  const viewportRect = useMemo(() => {
    const viewWidth = (window.innerWidth / viewport.zoom / bounds.width) * 100;
    const viewHeight = (window.innerHeight / viewport.zoom / bounds.height) * 100;
    const viewX = ((-viewport.x / viewport.zoom - bounds.minX) / bounds.width) * 100;
    const viewY = ((-viewport.y / viewport.zoom - bounds.minY) / bounds.height) * 100;
    
    return {
      x: Math.max(0, Math.min(100 - viewWidth, viewX)),
      y: Math.max(0, Math.min(100 - viewHeight, viewY)),
      width: Math.min(100, viewWidth),
      height: Math.min(100, viewHeight),
    };
  }, [viewport.zoom, viewport.x, viewport.y, bounds]);

  // Handle click to navigate
  const handleMapClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Convert to canvas coordinates
    const canvasX = bounds.minX + (x / 100) * bounds.width;
    const canvasY = bounds.minY + (y / 100) * bounds.height;
    
    // Pan to this location (center it)
    const newX = -(canvasX - window.innerWidth / 2 / viewport.zoom) * viewport.zoom;
    const newY = -(canvasY - window.innerHeight / 2 / viewport.zoom) * viewport.zoom;
    setViewport({ x: newX, y: newY });
  }, [bounds, viewport.zoom, setViewport]);

  // Stats
  const stats = useMemo(() => ({
    active: clusters.filter(c => c.type === 'active').length,
    dormant: clusters.filter(c => c.type === 'dormant').length,
    isolated: clusters.filter(c => c.type === 'isolated').length,
  }), [clusters]);

  if (nodes.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-6 right-6 z-30"
    >
      <div className="bg-imagine-bg-elevated/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <MapIcon className="w-3.5 h-3.5 text-imagine-intuition" />
            <span className="text-xs font-medium text-imagine-text">Carte</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => changeZoom(-0.25)}
              className="p-1 rounded hover:bg-white/10 text-imagine-text-muted hover:text-imagine-text transition-colors"
              title="Dézoomer"
              aria-label="Dézoomer"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] text-imagine-text-muted px-1 min-w-[32px] text-center">
              {Math.round(viewport.zoom * 100)}%
            </span>
            <button
              onClick={() => changeZoom(0.25)}
              className="p-1 rounded hover:bg-white/10 text-imagine-text-muted hover:text-imagine-text transition-colors"
              title="Zoomer"
              aria-label="Zoomer"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Map viewport */}
        <div className="p-2">
          <svg
            viewBox="0 0 100 100"
            className="w-44 h-44 cursor-crosshair"
            onClick={handleMapClick}
          >
            {/* Background gradient */}
            <defs>
              <radialGradient id="mapGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(91, 75, 138, 0.1)" />
                <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
              </radialGradient>
              
              {/* Glow filter for active nodes */}
              <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            {/* Background */}
            <rect x="0" y="0" width="100" height="100" fill="url(#mapGradient)" rx="4" />
            
            {/* Edges */}
            {miniEdges.map(edge => edge && (
              <line
                key={edge.id}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke={`rgba(91, 75, 138, ${0.2 + edge.weight * 0.4})`}
                strokeWidth={0.3 + edge.weight * 0.3}
              />
            ))}
            
            {/* Nodes */}
            {clusters.map(cluster => (
              <g key={cluster.id}>
                {/* Halo for active nodes */}
                {cluster.type === 'active' && (
                  <circle
                    cx={cluster.x}
                    cy={cluster.y}
                    r={cluster.size + 2}
                    fill="rgba(79, 209, 197, 0.15)"
                    className="animate-pulse"
                  />
                )}
                
                <circle
                  cx={cluster.x}
                  cy={cluster.y}
                  r={cluster.size}
                  fill={
                    cluster.type === 'active' ? '#4FD1C5' :
                    cluster.type === 'isolated' ? '#6E2B2B' :
                    '#5B4B8A'
                  }
                  opacity={0.6 + cluster.intensity * 0.4}
                  filter={cluster.type === 'active' ? 'url(#nodeGlow)' : undefined}
                  className={cn(
                    'transition-all duration-300',
                    canvas.selectedNodeIds.includes(cluster.id) && 'stroke-white stroke-[0.5]'
                  )}
                />
              </g>
            ))}
            
            {/* Viewport rectangle */}
            <rect
              x={viewportRect.x}
              y={viewportRect.y}
              width={viewportRect.width}
              height={viewportRect.height}
              fill="rgba(255, 255, 255, 0.05)"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="0.5"
              rx="1"
              className="pointer-events-none"
            />
          </svg>
        </div>

        {/* Stats footer */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-white/5 bg-imagine-bg/30">
          <div className="flex items-center gap-3 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-imagine-coherence" />
              <span className="text-imagine-text-muted">{stats.active}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-imagine-nebula" />
              <span className="text-imagine-text-muted">{stats.dormant}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-700" />
              <span className="text-imagine-text-muted">{stats.isolated}</span>
            </div>
          </div>
          <button
            onClick={resetViewport}
            className="p-1 rounded hover:bg-white/10 text-imagine-text-muted hover:text-imagine-text transition-colors"
            title="Réinitialiser la vue"
            aria-label="Réinitialiser la vue"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
