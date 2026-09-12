'use client';

// ========================================
// IMAGINE - Canvas Principal
// Canvas infini avec pan/zoom et richesse cognitive
// ========================================

import React, { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useImagineStore } from '@/store';
import { useCanvasInteraction, useKeyboardShortcuts, useAutoAnalyze } from '@/hooks';
import { cn } from '@/lib/utils';
import Node from './Node';
import Edge from './Edge';
import CanvasGrid from './CanvasGrid';
import ConnectionLine from './ConnectionLine';
import CognitiveBackground from './CognitiveBackground';
import CognitiveOverlay from './CognitiveOverlay';
import ConnectionLabelPicker from './ConnectionLabelPicker';
import type { ImagineNode, EdgeRelationType } from '@/types';

interface CanvasProps {
  className?: string;
}

interface PendingConnection {
  fromNode: ImagineNode;
  toNode: ImagineNode;
  position: { x: number; y: number };
}

export default function Canvas({ className }: CanvasProps) {
  const { 
    nodes, 
    edges, 
    canvas, 
    ui,
    addNode,
    addEdge,
    setConnecting,
    getNode,
  } = useImagineStore();

  // State for cognitive overlays
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [overlayMode, setOverlayMode] = useState<'heatmap' | 'connections' | 'dormant'>('heatmap');
  
  // State for pending connection with label picker
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);

  // Keyboard shortcuts
  useKeyboardShortcuts();
  
  // Auto-analyze nodes for AI suggestions
  useAutoAnalyze(3000);

  // Listen for connection completion
  useEffect(() => {
    const handleConnectionComplete = (event: CustomEvent<{ fromId: string; toId: string; x: number; y: number }>) => {
      const { fromId, toId, x, y } = event.detail;
      const fromNode = getNode(fromId);
      const toNode = getNode(toId);
      
      if (fromNode && toNode) {
        setPendingConnection({
          fromNode,
          toNode,
          position: { x, y },
        });
      }
    };

    window.addEventListener('connection-complete' as any, handleConnectionComplete);
    return () => window.removeEventListener('connection-complete' as any, handleConnectionComplete);
  }, [getNode]);

  // Handle connection label selection
  const handleConnectionLabelSelect = useCallback((label: string, relationType: string) => {
    if (pendingConnection) {
      addEdge({
        fromNodeId: pendingConnection.fromNode.id,
        toNodeId: pendingConnection.toNode.id,
        relationType: relationType as EdgeRelationType,
        label,
      });
      setPendingConnection(null);
      setConnecting(false, undefined);
    }
  }, [pendingConnection, addEdge, setConnecting]);

  // Handle connection cancel
  const handleConnectionCancel = useCallback(() => {
    setPendingConnection(null);
    setConnecting(false, undefined);
  }, [setConnecting]);

  // Handle double click to create node
  const handleDoubleClick = useCallback(
    (x: number, y: number) => {
      addNode({
        type: 'text',
        position: { x: x - 125, y: y - 60 }, // Center the node
        content: '',
      });
    },
    [addNode]
  );

  const { containerRef, isDragging, handlers } = useCanvasInteraction({
    onDoubleClick: handleDoubleClick,
  });

  const { viewport } = canvas;

  return (
    <div
      ref={containerRef}
      className={cn(
        'canvas-container relative overflow-hidden',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
        className
      )}
      {...handlers}
    >
      {/* Cognitive Background - Fond dynamique intelligent */}
      <CognitiveBackground nodes={nodes} />

      {/* Nebula background */}
      <div className="nebula-bg" />

      {/* Grid */}
      {ui.showGrid && <CanvasGrid viewport={viewport} />}

      {/* Cognitive Overlay - Heatmap */}
      <CognitiveOverlay enabled={showHeatmap} mode={overlayMode} />

      {/* Canvas content */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Edges layer */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{
            width: '100%',
            height: '100%',
            overflow: 'visible',
          }}
        >
          <g>
            {edges.map((edge) => (
              <Edge
                key={edge.id}
                edge={edge}
              />
            ))}
          </g>
        </svg>

        {/* Connection line (when creating edge) */}
        <ConnectionLine />

        {/* Nodes layer */}
        <AnimatePresence>
          {nodes.map((node) => (
            <Node
              key={node.id}
              node={node}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Canvas info overlay */}
      <div className="absolute bottom-4 right-4 flex items-center gap-3 text-xs text-imagine-text-subtle">
        <button 
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={cn(
            'px-2 py-1 rounded transition-colors',
            showHeatmap ? 'bg-imagine-projection/20 text-imagine-projection' : 'hover:bg-white/5'
          )}
          title="Toggle heatmap cognitif"
        >
          Heatmap
        </button>
        <span>{Math.round(viewport.zoom * 100)}%</span>
        <span>{nodes.length} nodes</span>
        <span>{edges.length} links</span>
      </div>

      {/* Empty state - invitation silencieuse */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center"
          >
            {/* Foyer central - champ visuel */}
            <motion.div
              className="w-32 h-32 mx-auto mb-8 rounded-full border border-dashed border-imagine-projection/30 flex items-center justify-center"
              animate={{
                borderColor: ['rgba(79, 209, 197, 0.2)', 'rgba(79, 209, 197, 0.4)', 'rgba(79, 209, 197, 0.2)'],
                scale: [1, 1.02, 1],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.div
                className="w-4 h-4 rounded-full bg-imagine-projection/40"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
            
            <p className="text-imagine-text-muted text-lg mb-2">
              Double-cliquez pour créer une idée
            </p>
            <p className="text-imagine-text-subtle text-sm">
              ou appuyez sur <kbd className="px-2 py-1 bg-imagine-bg-elevated rounded text-xs">⌘N</kbd> pour démarrer un Spark
            </p>
          </motion.div>
        </div>
      )}

      {/* Connection Label Picker - Shown when creating a new connection */}
      {pendingConnection && (
        <ConnectionLabelPicker
          fromNode={pendingConnection.fromNode}
          toNode={pendingConnection.toNode}
          position={pendingConnection.position}
          onSelect={handleConnectionLabelSelect}
          onCancel={handleConnectionCancel}
        />
      )}
    </div>
  );
}
