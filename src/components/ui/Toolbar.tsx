'use client';

// ========================================
// IMAGINE - Toolbar
// Barre d'outils principale
// ========================================

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Hand,
  MousePointer,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Compass,
  Hammer,
  Sparkles,
  Menu,
  Settings,
  Eye,
  Layers,
  Focus,
} from 'lucide-react';
import { useImagineStore } from '@/store';
import { cn } from '@/lib/utils';

// Zoom level labels
function getZoomLevel(zoom: number): { level: 'macro' | 'normal' | 'detail'; label: string; icon: React.ElementType } {
  if (zoom < 0.5) return { level: 'macro', label: 'Vue macro', icon: Layers };
  if (zoom > 1.2) return { level: 'detail', label: 'Détails', icon: Focus };
  return { level: 'normal', label: 'Normal', icon: Eye };
}

export default function Toolbar() {
  const {
    ui,
    canvas,
    setMode,
    toggleGrid,
    toggleSidebar,
    setSparkInputOpen,
    zoom,
    resetViewport,
    fitToContent,
    addNode,
  } = useImagineStore();

  // Semantic zoom level
  const zoomInfo = useMemo(() => getZoomLevel(canvas.viewport.zoom), [canvas.viewport.zoom]);
  const ZoomIcon = zoomInfo.icon;

  const handleAddNode = () => {
    const viewportCenterX = typeof window !== 'undefined'
      ? (window.innerWidth / 2 - canvas.viewport.x) / canvas.viewport.zoom
      : 0;
    const viewportCenterY = typeof window !== 'undefined'
      ? (window.innerHeight / 2 - canvas.viewport.y) / canvas.viewport.zoom
      : 0;

    addNode({
      type: 'text',
      content: '',
      position: {
        x: viewportCenterX - 125,
        y: viewportCenterY - 60,
      },
    });
  };

  return (
    <>
      {/* Top toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-40"
      >
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl glass">
          {/* Menu */}
          <ToolbarButton
            icon={Menu}
            onClick={toggleSidebar}
            active={ui.sidebarOpen}
            tooltip="Menu"
          />

          <ToolbarDivider />

          {/* Add node */}
          <ToolbarButton
            icon={Plus}
            onClick={handleAddNode}
            tooltip="Ajouter un nœud"
          />

          {/* Spark */}
          <ToolbarButton
            icon={Sparkles}
            onClick={() => setSparkInputOpen(true)}
            tooltip="Nouveau Spark"
            accent
          />

          <ToolbarDivider />

          {/* Modes */}
          <ToolbarButton
            icon={MousePointer}
            onClick={() => setMode('canvas')}
            active={ui.mode === 'canvas'}
            tooltip="Mode Canvas"
          />
          <ToolbarButton
            icon={Compass}
            onClick={() => setMode('drift')}
            active={ui.mode === 'drift'}
            tooltip="Mode Drift"
          />
          <ToolbarButton
            icon={Hammer}
            onClick={() => setMode('forge')}
            active={ui.mode === 'forge'}
            tooltip="Mode Forge"
          />

          <ToolbarDivider />

          {/* Grid toggle */}
          <ToolbarButton
            icon={Grid3X3}
            onClick={toggleGrid}
            active={ui.showGrid}
            tooltip="Grille"
          />
        </div>
      </motion.div>

      {/* Bottom right - Zoom controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="fixed bottom-4 right-4 z-40"
      >
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl glass">
          {/* Semantic zoom indicator */}
          <div className={cn(
            'flex items-center gap-1.5 px-2 py-1 mr-1 rounded-lg text-xs font-medium transition-colors',
            zoomInfo.level === 'macro' && 'bg-imagine-nebula/20 text-imagine-nebula-light',
            zoomInfo.level === 'normal' && 'bg-white/5 text-imagine-text-muted',
            zoomInfo.level === 'detail' && 'bg-imagine-projection/20 text-imagine-projection',
          )}>
            <ZoomIcon className="w-3 h-3" />
            <span className="hidden sm:inline">{zoomInfo.label}</span>
          </div>

          <ToolbarDivider />

          <ToolbarButton
            icon={ZoomOut}
            onClick={() => zoom(-0.1)}
            tooltip="Zoom arrière"
          />
          
          <button
            onClick={resetViewport}
            className="px-2 py-1 text-xs text-imagine-text-muted hover:text-imagine-text transition-colors min-w-[48px]"
          >
            {Math.round(canvas.viewport.zoom * 100)}%
          </button>

          <ToolbarButton
            icon={ZoomIn}
            onClick={() => zoom(0.1)}
            tooltip="Zoom avant"
          />

          <ToolbarDivider />

          <ToolbarButton
            icon={Maximize2}
            onClick={fitToContent}
            tooltip="Ajuster à l'écran"
          />
        </div>
      </motion.div>

      {/* Mode indicator */}
      {ui.mode !== 'canvas' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed top-4 right-4 z-40"
        >
          <div className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm',
            ui.mode === 'drift' && 'bg-imagine-drift/20 text-imagine-drift',
            ui.mode === 'forge' && 'bg-imagine-forge/20 text-imagine-forge'
          )}>
            {ui.mode === 'drift' && <Compass className="w-4 h-4" />}
            {ui.mode === 'forge' && <Hammer className="w-4 h-4" />}
            <span className="capitalize">{ui.mode}</span>
          </div>
        </motion.div>
      )}
    </>
  );
}

// ========================================
// Sub-components
// ========================================

interface ToolbarButtonProps {
  icon: React.ElementType;
  onClick: () => void;
  active?: boolean;
  accent?: boolean;
  tooltip?: string;
}

function ToolbarButton({
  icon: Icon,
  onClick,
  active = false,
  accent = false,
  tooltip,
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={cn(
        'p-2 rounded-lg transition-all',
        active && 'bg-white/10 text-imagine-text',
        accent && !active && 'text-imagine-projection hover:bg-imagine-projection/10',
        !active && !accent && 'text-imagine-text-muted hover:text-imagine-text hover:bg-white/5'
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-4 bg-white/10 mx-1" />;
}
