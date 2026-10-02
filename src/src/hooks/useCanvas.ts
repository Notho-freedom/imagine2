// ========================================
// IMAGINE - Canvas Hooks
// Hooks pour la gestion du canvas
// ========================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useImagineStore } from '@/store';
import { screenToCanvas, clamp, throttle } from '@/lib/utils';
import { canvas as canvasConfig } from '@/lib/theme';

// ========================================
// useCanvasInteraction
// Gère pan, zoom et interactions canvas
// ========================================

interface UseCanvasInteractionOptions {
  onDoubleClick?: (x: number, y: number) => void;
}

export function useCanvasInteraction(options: UseCanvasInteractionOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const { 
    canvas, 
    pan, 
    zoom, 
    setPanning,
    clearSelection,
  } = useImagineStore();

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      
      const delta = -e.deltaY * 0.001;
      const rect = containerRef.current?.getBoundingClientRect();
      
      if (rect) {
        zoom(delta, e.clientX, e.clientY);
      }
    },
    [zoom]
  );

  // Handle mouse down for panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle mouse or space + left click for panning
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault();
        setIsDragging(true);
        setPanning(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      } else if (e.button === 0 && e.target === containerRef.current) {
        // Left click on canvas background
        clearSelection();
      }
    },
    [setPanning, clearSelection]
  );

  // Handle mouse move for panning
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - lastMousePos.current.x;
        const deltaY = e.clientY - lastMousePos.current.y;
        pan(deltaX, deltaY);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    },
    [isDragging, pan]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setPanning(false);
    }
  }, [isDragging, setPanning]);

  // Handle double click to create node
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== containerRef.current) return;
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const canvasPos = screenToCanvas(
        e.clientX - rect.left,
        e.clientY - rect.top,
        canvas.viewport
      );

      options.onDoubleClick?.(canvasPos.x, canvasPos.y);
    },
    [canvas.viewport, options]
  );

  // Add wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setPanning(false);
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, setPanning]);

  return {
    containerRef,
    isDragging,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onDoubleClick: handleDoubleClick,
    },
  };
}

// ========================================
// useNodeDrag
// Gère le drag des nœuds
// ========================================

interface UseNodeDragOptions {
  nodeId: string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function useNodeDrag({ nodeId, onDragStart, onDragEnd }: UseNodeDragOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const nodeStartPos = useRef({ x: 0, y: 0 });

  const { 
    getNode, 
    updateNode, 
    setDragging,
    canvas,
    selectNode,
  } = useImagineStore();

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      
      if (e.button !== 0) return;

      const node = getNode(nodeId);
      if (!node) return;

      // Select node on click
      selectNode(nodeId, e.shiftKey || e.ctrlKey || e.metaKey);

      setIsDragging(true);
      setDragging(true);
      startPos.current = { x: e.clientX, y: e.clientY };
      nodeStartPos.current = { ...node.position };
      onDragStart?.();
    },
    [nodeId, getNode, selectNode, setDragging, onDragStart]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - startPos.current.x) / canvas.viewport.zoom;
      const deltaY = (e.clientY - startPos.current.y) / canvas.viewport.zoom;

      updateNode(nodeId, {
        position: {
          x: nodeStartPos.current.x + deltaX,
          y: nodeStartPos.current.y + deltaY,
        },
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragging(false);
      onDragEnd?.();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, nodeId, canvas.viewport.zoom, updateNode, setDragging, onDragEnd]);

  return {
    isDragging,
    handleMouseDown,
  };
}

// ========================================
// useKeyboardShortcuts
// Raccourcis clavier
// ========================================

export function useKeyboardShortcuts() {
  const {
    deleteSelectedNodes,
    selectAll,
    clearSelection,
    resetViewport,
    fitToContent,
    setCommandPaletteOpen,
    setSparkInputOpen,
    toggleGrid,
    canvas,
  } = useImagineStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;

      // Delete selected nodes
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (canvas.selectedNodeIds.length > 0) {
          e.preventDefault();
          deleteSelectedNodes();
        }
      }

      // Select all (Cmd/Ctrl + A)
      if (isMod && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }

      // Escape - clear selection
      if (e.key === 'Escape') {
        clearSelection();
        setCommandPaletteOpen(false);
        setSparkInputOpen(false);
      }

      // Cmd/Ctrl + K - Command palette
      if (isMod && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }

      // Cmd/Ctrl + N - New spark
      if (isMod && e.key === 'n') {
        e.preventDefault();
        setSparkInputOpen(true);
      }

      // Reset view (0)
      if (e.key === '0' && !isMod) {
        resetViewport();
      }

      // Fit to content (1)
      if (e.key === '1' && !isMod) {
        fitToContent();
      }

      // Toggle grid (G)
      if (e.key === 'g' && !isMod) {
        toggleGrid();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    deleteSelectedNodes,
    selectAll,
    clearSelection,
    resetViewport,
    fitToContent,
    setCommandPaletteOpen,
    setSparkInputOpen,
    toggleGrid,
    canvas.selectedNodeIds,
  ]);
}

// ========================================
// useAutoSave
// Sauvegarde automatique
// ========================================

export function useAutoSave(interval = 30000) {
  const { nodes, edges, project } = useImagineStore();

  useEffect(() => {
    const timer = setInterval(() => {
      // Auto-save logic would go here
      console.log('[IMAGINE] Auto-saving...', { 
        nodesCount: nodes.length, 
        edgesCount: edges.length 
      });
    }, interval);

    return () => clearInterval(timer);
  }, [nodes, edges, project, interval]);
}

// ========================================
// useWindowSize
// ========================================

export function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
