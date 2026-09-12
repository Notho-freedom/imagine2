// ========================================
// IMAGINE - Store
// State management with Zustand
// ========================================

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { 
  ImagineNode, 
  Edge, 
  EdgeRelationType,
  Viewport, 
  Project,
  AppMode,
  AISuggestion,
  TextNode,
} from '@/types';
import { generateId } from '@/lib/utils';

// ========================================
// Types
// ========================================

interface CanvasState {
  viewport: Viewport;
  selectedNodeIds: string[];
  hoveredNodeId: string | null;
  isDragging: boolean;
  isPanning: boolean;
  isConnecting: boolean;
  connectionSource: string | null;
}

interface UIState {
  mode: AppMode;
  sidebarOpen: boolean;
  sidebarContent: 'properties' | 'ai' | 'history' | null;
  showGrid: boolean;
  showMinimap: boolean;
  commandPaletteOpen: boolean;
  sparkInputOpen: boolean;
}

interface ImagineState {
  // Project
  project: Project | null;
  
  // Data
  nodes: ImagineNode[];
  edges: Edge[];
  
  // Canvas
  canvas: CanvasState;
  
  // UI
  ui: UIState;
  
  // AI
  suggestions: AISuggestion[];
  
  // Actions - Project
  setProject: (project: Project) => void;
  
  // Actions - Nodes
  addNode: (node: Partial<ImagineNode>) => string;
  updateNode: (id: string, updates: Partial<ImagineNode>) => void;
  deleteNode: (id: string) => void;
  deleteSelectedNodes: () => void;
  
  // Actions - Edges
  addEdge: (edgeData: { fromNodeId: string; toNodeId: string; relationType?: EdgeRelationType; label?: string; confidenceScore?: number }) => string;
  deleteEdge: (id: string) => void;
  
  // Actions - Selection
  selectNode: (id: string, addToSelection?: boolean) => void;
  selectNodes: (ids: string[]) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // Actions - Viewport
  setViewport: (viewport: Partial<Viewport>) => void;
  pan: (deltaX: number, deltaY: number) => void;
  zoom: (delta: number, centerX?: number, centerY?: number) => void;
  resetViewport: () => void;
  fitToContent: () => void;
  
  // Actions - Canvas State
  setDragging: (isDragging: boolean) => void;
  setPanning: (isPanning: boolean) => void;
  setConnecting: (isConnecting: boolean, sourceId?: string) => void;
  setHoveredNode: (id: string | null) => void;
  
  // Actions - UI
  setMode: (mode: AppMode) => void;
  toggleSidebar: () => void;
  setSidebarContent: (content: UIState['sidebarContent']) => void;
  toggleGrid: () => void;
  toggleMinimap: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSparkInputOpen: (open: boolean) => void;
  
  // Actions - AI
  addSuggestion: (suggestion: AISuggestion) => void;
  acceptSuggestion: (id: string) => void;
  dismissSuggestion: (id: string) => void;
  clearSuggestions: () => void;
  
  // Getters
  getNode: (id: string) => ImagineNode | undefined;
  getSelectedNodes: () => ImagineNode[];
  getEdgesForNode: (id: string) => Edge[];
  getConnectedNodes: (id: string) => ImagineNode[];
}

// ========================================
// Initial State
// ========================================

const initialCanvasState: CanvasState = {
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNodeIds: [],
  hoveredNodeId: null,
  isDragging: false,
  isPanning: false,
  isConnecting: false,
  connectionSource: null,
};

const initialUIState: UIState = {
  mode: 'canvas',
  sidebarOpen: false,
  sidebarContent: null,
  showGrid: true,
  showMinimap: false,
  commandPaletteOpen: false,
  sparkInputOpen: false,
};

// ========================================
// Store
// ========================================

export const useImagineStore = create<ImagineState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        project: null,
        nodes: [],
        edges: [],
        canvas: initialCanvasState,
        ui: initialUIState,
        suggestions: [],

        // ========================================
        // Project Actions
        // ========================================

        setProject: (project) => {
          set((state) => {
            state.project = project;
          });
        },

        // ========================================
        // Node Actions
        // ========================================

        addNode: (nodeData) => {
          const id = generateId();
          const now = new Date().toISOString();
          
          const defaultNode: TextNode = {
            id,
            projectId: get().project?.id || 'default',
            type: 'text',
            content: '',
            position: { x: 0, y: 0 },
            metadata: {
              createdAt: now,
              updatedAt: now,
            },
            ...nodeData,
          } as TextNode;

          set((state) => {
            state.nodes.push(defaultNode as ImagineNode);
          });

          return id;
        },

        updateNode: (id, updates) => {
          set((state) => {
            const index = state.nodes.findIndex((n) => n.id === id);
            if (index !== -1) {
              const currentNode = state.nodes[index];
              // Use Object.assign to avoid type issues with immer
              Object.assign(currentNode, updates);
              currentNode.metadata.updatedAt = new Date().toISOString();
            }
          });
        },

        deleteNode: (id) => {
          set((state) => {
            state.nodes = state.nodes.filter((n) => n.id !== id);
            state.edges = state.edges.filter(
              (e) => e.fromNodeId !== id && e.toNodeId !== id
            );
            state.canvas.selectedNodeIds = state.canvas.selectedNodeIds.filter(
              (nid) => nid !== id
            );
          });
        },

        deleteSelectedNodes: () => {
          const selectedIds = get().canvas.selectedNodeIds;
          set((state) => {
            state.nodes = state.nodes.filter(
              (n) => !selectedIds.includes(n.id)
            );
            state.edges = state.edges.filter(
              (e) =>
                !selectedIds.includes(e.fromNodeId) &&
                !selectedIds.includes(e.toNodeId)
            );
            state.canvas.selectedNodeIds = [];
          });
        },

        // ========================================
        // Edge Actions
        // ========================================

        addEdge: (edgeData) => {
          const { fromNodeId, toNodeId, relationType = 'manual', label, confidenceScore } = edgeData;
          
          // Prevent self-loops and duplicates
          if (fromNodeId === toNodeId) return '';
          
          const existing = get().edges.find(
            (e) =>
              (e.fromNodeId === fromNodeId && e.toNodeId === toNodeId) ||
              (e.fromNodeId === toNodeId && e.toNodeId === fromNodeId)
          );
          if (existing) return existing.id;

          const id = generateId();
          const edge: Edge = {
            id,
            projectId: get().project?.id || 'default',
            fromNodeId,
            toNodeId,
            relationType,
            label,
            confidenceScore,
            metadata: {
              createdAt: new Date().toISOString(),
              createdBy: 'user',
            },
          };

          set((state) => {
            state.edges.push(edge);
          });

          return id;
        },

        deleteEdge: (id) => {
          set((state) => {
            state.edges = state.edges.filter((e) => e.id !== id);
          });
        },

        // ========================================
        // Selection Actions
        // ========================================

        selectNode: (id, addToSelection = false) => {
          set((state) => {
            if (addToSelection) {
              if (state.canvas.selectedNodeIds.includes(id)) {
                state.canvas.selectedNodeIds = 
                  state.canvas.selectedNodeIds.filter((nid) => nid !== id);
              } else {
                state.canvas.selectedNodeIds.push(id);
              }
            } else {
              state.canvas.selectedNodeIds = [id];
            }
          });
        },

        selectNodes: (ids) => {
          set((state) => {
            state.canvas.selectedNodeIds = ids;
          });
        },

        selectAll: () => {
          set((state) => {
            state.canvas.selectedNodeIds = state.nodes.map((n) => n.id);
          });
        },

        clearSelection: () => {
          set((state) => {
            state.canvas.selectedNodeIds = [];
          });
        },

        // ========================================
        // Viewport Actions
        // ========================================

        setViewport: (viewport) => {
          set((state) => {
            state.canvas.viewport = { ...state.canvas.viewport, ...viewport };
          });
        },

        pan: (deltaX, deltaY) => {
          set((state) => {
            state.canvas.viewport.x += deltaX;
            state.canvas.viewport.y += deltaY;
          });
        },

        zoom: (delta, centerX, centerY) => {
          set((state) => {
            const { viewport } = state.canvas;
            const newZoom = Math.max(0.1, Math.min(3, viewport.zoom + delta));
            
            if (centerX !== undefined && centerY !== undefined) {
              // Zoom toward cursor position
              const scale = newZoom / viewport.zoom;
              viewport.x = centerX - (centerX - viewport.x) * scale;
              viewport.y = centerY - (centerY - viewport.y) * scale;
            }
            
            viewport.zoom = newZoom;
          });
        },

        resetViewport: () => {
          set((state) => {
            state.canvas.viewport = { x: 0, y: 0, zoom: 1 };
          });
        },

        fitToContent: () => {
          const nodes = get().nodes;
          if (nodes.length === 0) return;

          // Calculate bounding box
          let minX = Infinity, minY = Infinity;
          let maxX = -Infinity, maxY = -Infinity;

          nodes.forEach((node) => {
            const width = node.dimensions?.width || 250;
            const height = node.dimensions?.height || 120;
            minX = Math.min(minX, node.position.x);
            minY = Math.min(minY, node.position.y);
            maxX = Math.max(maxX, node.position.x + width);
            maxY = Math.max(maxY, node.position.y + height);
          });

          const padding = 100;
          const contentWidth = maxX - minX + padding * 2;
          const contentHeight = maxY - minY + padding * 2;

          // Assuming window size (should be dynamic)
          const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
          const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

          const zoom = Math.min(
            windowWidth / contentWidth,
            windowHeight / contentHeight,
            1
          );

          set((state) => {
            state.canvas.viewport = {
              x: -minX * zoom + (windowWidth - contentWidth * zoom) / 2 + padding * zoom,
              y: -minY * zoom + (windowHeight - contentHeight * zoom) / 2 + padding * zoom,
              zoom,
            };
          });
        },

        // ========================================
        // Canvas State Actions
        // ========================================

        setDragging: (isDragging) => {
          set((state) => {
            state.canvas.isDragging = isDragging;
          });
        },

        setPanning: (isPanning) => {
          set((state) => {
            state.canvas.isPanning = isPanning;
          });
        },

        setConnecting: (isConnecting, sourceId) => {
          set((state) => {
            state.canvas.isConnecting = isConnecting;
            state.canvas.connectionSource = sourceId || null;
          });
        },

        setHoveredNode: (id) => {
          set((state) => {
            state.canvas.hoveredNodeId = id;
          });
        },

        // ========================================
        // UI Actions
        // ========================================

        setMode: (mode) => {
          set((state) => {
            state.ui.mode = mode;
          });
        },

        toggleSidebar: () => {
          set((state) => {
            state.ui.sidebarOpen = !state.ui.sidebarOpen;
          });
        },

        setSidebarContent: (content) => {
          set((state) => {
            state.ui.sidebarContent = content;
            if (content) {
              state.ui.sidebarOpen = true;
            }
          });
        },

        toggleGrid: () => {
          set((state) => {
            state.ui.showGrid = !state.ui.showGrid;
          });
        },

        toggleMinimap: () => {
          set((state) => {
            state.ui.showMinimap = !state.ui.showMinimap;
          });
        },

        setCommandPaletteOpen: (open) => {
          set((state) => {
            state.ui.commandPaletteOpen = open;
          });
        },

        setSparkInputOpen: (open) => {
          set((state) => {
            state.ui.sparkInputOpen = open;
          });
        },

        // ========================================
        // AI Actions
        // ========================================

        addSuggestion: (suggestion) => {
          set((state) => {
            state.suggestions.push(suggestion);
          });
        },

        acceptSuggestion: (id) => {
          const state = get();
          const suggestion = state.suggestions.find((s) => s.id === id);
          
          if (!suggestion) return;
          
          // Apply the suggestion based on its type
          switch (suggestion.type) {
            case 'link': {
              // Create a link between source and target nodes
              if (suggestion.sourceNodeIds.length > 0 && suggestion.targetNodeId) {
                const fromNodeId = suggestion.sourceNodeIds[0];
                const toNodeId = suggestion.targetNodeId;
                
                // Check if edge already exists
                const edgeExists = state.edges.some(
                  e => (e.fromNodeId === fromNodeId && e.toNodeId === toNodeId) ||
                       (e.fromNodeId === toNodeId && e.toNodeId === fromNodeId)
                );
                
                if (!edgeExists) {
                  get().addEdge({
                    fromNodeId,
                    toNodeId,
                    relationType: 'semantic',
                    label: suggestion.content,
                  });
                }
              } else if (suggestion.sourceNodeIds.length >= 2) {
                // Link between two source nodes
                const [fromNodeId, toNodeId] = suggestion.sourceNodeIds;
                const edgeExists = state.edges.some(
                  e => (e.fromNodeId === fromNodeId && e.toNodeId === toNodeId) ||
                       (e.fromNodeId === toNodeId && e.toNodeId === fromNodeId)
                );
                
                if (!edgeExists) {
                  get().addEdge({
                    fromNodeId,
                    toNodeId,
                    relationType: 'semantic',
                    label: suggestion.content,
                  });
                }
              }
              break;
            }
            
            case 'reconnect': {
              // Apply all reconnection links
              if (suggestion.reconnectLinks && suggestion.reconnectLinks.length > 0) {
                suggestion.reconnectLinks.forEach(link => {
                  // Check if edge already exists
                  const edgeExists = state.edges.some(
                    e => (e.fromNodeId === link.fromId && e.toNodeId === link.toId) ||
                         (e.fromNodeId === link.toId && e.toNodeId === link.fromId)
                  );
                  
                  if (!edgeExists) {
                    get().addEdge({
                      fromNodeId: link.fromId,
                      toNodeId: link.toId,
                      relationType: 'semantic',
                      label: link.reason,
                    });
                  }
                });
              }
              break;
            }
            
            case 'expansion':
            case 'reformulation':
            case 'theme':
            case 'fork': {
              // Create a new node with the suggestion content
              const sourceNode = suggestion.sourceNodeIds.length > 0
                ? state.nodes.find(n => n.id === suggestion.sourceNodeIds[0])
                : null;
              
              // Position the new node near the source node
              const position = sourceNode
                ? {
                    x: sourceNode.position.x + 320,
                    y: sourceNode.position.y + Math.random() * 100 - 50,
                  }
                : {
                    x: Math.random() * 500 + 100,
                    y: Math.random() * 300 + 100,
                  };
              
              // Add the new node
              const newNodeId = get().addNode({
                type: 'text',
                content: suggestion.content,
                position,
                metadata: {
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  tags: [suggestion.type],
                },
              });
              
              // Create a link from source to the new node
              if (sourceNode && newNodeId) {
                get().addEdge({
                  fromNodeId: sourceNode.id,
                  toNodeId: newNodeId,
                  relationType: 'semantic',
                  label: suggestion.type === 'expansion' ? 'développe' 
                       : suggestion.type === 'reformulation' ? 'reformule'
                       : suggestion.type === 'theme' ? 'thème'
                       : 'fork',
                });
              }
              break;
            }
          }
          
          // Mark as accepted
          set((state) => {
            const index = state.suggestions.findIndex((s) => s.id === id);
            if (index !== -1) {
              state.suggestions[index].accepted = true;
            }
          });
        },

        dismissSuggestion: (id) => {
          set((state) => {
            state.suggestions = state.suggestions.filter((s) => s.id !== id);
          });
        },

        clearSuggestions: () => {
          set((state) => {
            state.suggestions = [];
          });
        },

        // ========================================
        // Getters
        // ========================================

        getNode: (id) => {
          return get().nodes.find((n) => n.id === id);
        },

        getSelectedNodes: () => {
          const { nodes, canvas } = get();
          return nodes.filter((n) => canvas.selectedNodeIds.includes(n.id));
        },

        getEdgesForNode: (id) => {
          return get().edges.filter(
            (e) => e.fromNodeId === id || e.toNodeId === id
          );
        },

        getConnectedNodes: (id) => {
          const edges = get().getEdgesForNode(id);
          const connectedIds = edges.map((e) =>
            e.fromNodeId === id ? e.toNodeId : e.fromNodeId
          );
          return get().nodes.filter((n) => connectedIds.includes(n.id));
        },
      })),
      {
        name: 'imagine-storage',
        partialize: (state) => ({
          project: state.project,
          nodes: state.nodes,
          edges: state.edges,
          ui: {
            showGrid: state.ui.showGrid,
            showMinimap: state.ui.showMinimap,
          },
        }),
      }
    ),
    { name: 'ImagineStore' }
  )
);

export default useImagineStore;
