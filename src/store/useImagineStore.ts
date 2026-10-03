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
  ThoughtTrace,
  ThoughtPath,
  IdeaReading,
  ReadingFeedback,
  SeedKind,
  CandidateDecision,
  Confrontation,
  Verdict,
  FalsifierStatus,
DescentEntry,
  BranchPoint,
  ComparisonCriterion,
  PathPayload,
  TraceEvent,
} from '@/types';
import { generateId } from '@/lib/utils';
import {
  nextPathColor,
  DEFAULT_CRITERIA,
  normalizeWeight,
  criterionKey,
  weightedTotal,
} from '@/lib/trace';

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
  view: 'projection' | 'map';
  mapKind: 'trace' | 'board';
  traceStep: number;
  activePathId: string | null;
}

export type TraceStepKind =
  | 'intake'
  | 'reading'
  | 'projection'
  | 'descent'
  | 'confrontation'
  | 'verdict'
  | 'ledger';

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

  // Trace - moteur de décision
  traces: ThoughtTrace[];
  activeTraceId: string | null;
  
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
  setView: (view: UIState['view']) => void;
  setMapKind: (kind: UIState['mapKind']) => void;
  
  // Actions - AI
  addSuggestion: (suggestion: AISuggestion) => void;
  acceptSuggestion: (id: string) => void;
  dismissSuggestion: (id: string) => void;
  clearSuggestions: () => void;

  // Actions - Trace
  createTrace: (seed?: { title?: string; spark?: string; seedKind?: SeedKind }) => string;
  setActiveTrace: (id: string) => void;
  deleteTrace: (id: string) => void;
  setTraceStep: (step: number) => void;
  setActivePath: (id: string | null) => void;
  setDecisions: (traceId: string, decisions: CandidateDecision[]) => void;
  addDecision: (traceId: string, statement: string) => void;
  chooseDecision: (traceId: string, decisionId: string) => void;
  updateTrace: (id: string, updates: Partial<ThoughtTrace>) => void;
  setCriteria: (traceId: string, criteria: ComparisonCriterion[]) => void;
  addCriterion: (traceId: string, label: string) => void;
  updateCriterion: (
    traceId: string,
    key: string,
    updates: Partial<ComparisonCriterion>
  ) => void;
  removeCriterion: (traceId: string, key: string) => void;
  resetCriteria: (traceId: string) => void;
  appendEvent: (event: TraceEvent) => void;
  setReading: (traceId: string, reading: IdeaReading) => void;
  patchReading: (traceId: string, patch: Partial<IdeaReading>) => void;
  setReadingFeedback: (traceId: string, feedback: ReadingFeedback) => void;
  addPaths: (
    traceId: string,
    payloads: PathPayload[],
    parent?: { pathId: string; entryIndex: number; branch: BranchPoint }
  ) => string[];
  updatePath: (traceId: string, pathId: string, updates: Partial<ThoughtPath>) => void;
  setPathStatus: (traceId: string, pathId: string, status: ThoughtPath['status']) => void;
  addDescent: (traceId: string, pathId: string, entry: Omit<DescentEntry, 'id' | 'pathId' | 'createdAt'>) => void;
  removeDescent: (traceId: string, pathId: string, entryId: string) => void;
  deletePath: (traceId: string, pathId: string) => void;
  deleteBranch: (traceId: string, pathId: string, branchId: string) => void;
  setConfrontation: (
    traceId: string,
    confrontation: Confrontation,
    onlyPathIds?: string[]
  ) => void;
  setVerdict: (traceId: string, verdict: Verdict) => void;
  setFalsifierStatus: (
    traceId: string,
    falsifier: string,
    status: FalsifierStatus,
    note?: string
  ) => void;
  reopenVerdict: (traceId: string, reason: string) => void;
  commitVerdict: (traceId: string) => void;
  
  // Getters
  getNode: (id: string) => ImagineNode | undefined;
  getSelectedNodes: () => ImagineNode[];
  getEdgesForNode: (id: string) => Edge[];
  getConnectedNodes: (id: string) => ImagineNode[];

  // Getters - Trace
  getActiveTrace: () => ThoughtTrace | null;
  getActivePath: () => ThoughtPath | null;
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
  view: 'projection',
  mapKind: 'trace',
  traceStep: 1,
  activePathId: null,
};

const touch = () => new Date().toISOString();

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
        traces: [],
        activeTraceId: null,

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

        setView: (view) => {
          set((state) => {
            state.ui.view = view;
          });
        },

        setMapKind: (kind: UIState['mapKind']) => {
          set((state) => {
            state.ui.mapKind = kind;
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
        // Trace Actions
        // ========================================

        createTrace: (seed) => {
          const id = generateId();
          const now = touch();
          const title = seed?.title?.trim() || 'Nouvelle décision';
          const seedKind: SeedKind = seed?.seedKind ?? 'idea';

          const trace: ThoughtTrace = {
            id,
            title,
            spark: seed?.spark ?? '',
            context: '',
            horizon: '',
            seedKind,
            decisions: [],
            chosenDecisionId: null,
            reading: null,
            criteria: DEFAULT_CRITERIA.map((c) => ({ ...c })),
            paths: [],
            confrontation: null,
            verdict: null,
            events: [
              {
                id: generateId(),
                kind: 'statement',
                actor: 'user',
                label: seedKind === 'confusion' ? 'Confusion posée' : 'Tracé ouvert',
                detail: title,
                createdAt: now,
              },
            ],
            status: 'open',
            createdAt: now,
            updatedAt: now,
          };

          set((state) => {
            state.traces.unshift(trace);
            state.activeTraceId = id;
            state.ui.view = 'projection';
            state.ui.traceStep = 1;
            state.ui.activePathId = null;
          });

          return id;
        },

        setDecisions: (traceId, decisions) => {
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            if (!trace) return;
            trace.decisions = decisions;
            if (!trace.chosenDecisionId && decisions.length === 1) {
              trace.chosenDecisionId = decisions[0].id;
            }
            trace.updatedAt = touch();
          });
        },

        addDecision: (traceId, statement) => {
          const clean = statement.trim();
          if (!clean) return;
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            if (!trace) return;
            trace.decisions.push({
              id: generateId(),
              title: clean.length > 44 ? `${clean.slice(0, 41)}…` : clean,
              statement: clean,
              wouldConfirm: '',
              costOfIgnoring: '',
              origin: 'user',
            });
            trace.updatedAt = touch();
          });
        },

        chooseDecision: (traceId, decisionId) => {
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            const d = trace?.decisions.find((x) => x.id === decisionId);
            if (!trace || !d) return;

            const same = trace.chosenDecisionId === decisionId;
            trace.chosenDecisionId = decisionId;
            trace.title = d.title;

            // Changer de question, c'est recommencer une autre conversation :
            // l'arbitrage rendu ne portait pas sur celle-là.
            if (!same && (trace.verdict || trace.status === 'arbitrated')) {
              const chosenId = trace.verdict?.recommendedPathId;
              for (const p of trace.paths) {
                if (p.id === chosenId) {
                  p.status = p.timeline.length ? 'explored' : 'open';
                  p.scores = null;
                }
              }
              trace.confrontation = null;
              trace.verdict = null;
              trace.status = 'open';
            }

            // On saute vers une trajectoire de cette décision si elle en a une
            const mine = trace.paths.find((p) => p.decisionId === decisionId);
            state.ui.activePathId = mine?.id ?? null;

            trace.events.push({
              id: generateId(),
              kind: 'statement',
              actor: 'user',
              label: 'Décision travaillée',
              detail: d.statement,
              createdAt: touch(),
            });

            trace.updatedAt = touch();
          });
        },

        setActiveTrace: (id) => {
          set((state) => {
            state.activeTraceId = id;
            state.ui.traceStep = 1;
            state.ui.activePathId = null;
          });
        },

        deleteTrace: (id) => {
          set((state) => {
            state.traces = state.traces.filter((t) => t.id !== id);
            if (state.activeTraceId === id) {
              state.activeTraceId = state.traces[0]?.id ?? null;
              state.ui.activePathId = null;
              state.ui.traceStep = 1;
            }
          });
        },

        setTraceStep: (step) => {
          set((state) => {
            state.ui.traceStep = step;
          });
        },

        setActivePath: (id) => {
          set((state) => {
            state.ui.activePathId = id;
          });
        },

        updateTrace: (id, updates) => {
          set((state) => {
            const trace = state.traces.find((t) => t.id === id);
            if (!trace) return;
            Object.assign(trace, updates);
            trace.updatedAt = touch();
          });
        },

        appendEvent: (event) => {
          const state = get();
          if (!state.activeTraceId) return;
          set((s) => {
            const trace = s.traces.find((t) => t.id === s.activeTraceId);
            if (!trace) return;
            trace.events.push(event);
            trace.updatedAt = touch();
          });
        },

        setCriteria: (traceId, criteria) => {
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            if (!trace) return;
            trace.criteria = criteria.map((c) => ({
              ...c,
              weight: normalizeWeight(c.weight),
            }));
            trace.updatedAt = touch();
          });
        },

        addCriterion: (traceId, label) => {
          const clean = label.trim();
          if (!clean) return;
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            if (!trace) return;
            if (!trace.criteria) trace.criteria = DEFAULT_CRITERIA.map((c) => ({ ...c }));

            let key = criterionKey(clean);
            if (trace.criteria.some((c) => c.key === key)) {
              key = `${key}_${trace.criteria.length}`;
            }

            trace.criteria.push({
              key,
              label: clean,
              description: '',
              weight: 1,
              enabled: true,
              origin: 'user',
            });
            trace.updatedAt = touch();
          });
        },

        updateCriterion: (traceId, key, updates) => {
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            if (!trace) return;
            const crit = trace.criteria?.find((c) => c.key === key);
            if (!crit) return;
            Object.assign(crit, updates);
            if (typeof crit.weight === 'number') {
              crit.weight = normalizeWeight(crit.weight);
            }
            trace.updatedAt = touch();
          });
        },

        removeCriterion: (traceId, key) => {
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            if (!trace?.criteria) return;
            trace.criteria = trace.criteria.filter((c) => c.key !== key);
            trace.updatedAt = touch();
          });
        },

        resetCriteria: (traceId: string) => {
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            if (!trace) return;
            trace.criteria = DEFAULT_CRITERIA.map((c) => ({ ...c }));
            trace.updatedAt = touch();
          });
        },

        setReading: (traceId, reading) => {
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            if (!trace) return;
            trace.reading = reading;
            trace.updatedAt = touch();
          });
        },

        patchReading: (traceId, patch) => {
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            if (!trace?.reading) return;
            Object.assign(trace.reading, patch);
            trace.reading.revision = (trace.reading.revision ?? 0) + 1;
            trace.updatedAt = touch();
          });
        },

        setReadingFeedback: (traceId, feedback) => {
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            if (!trace?.reading) return;
            trace.reading.feedback = feedback;
            trace.updatedAt = touch();
          });
        },

        addPaths: (traceId, payloads, parent) => {
          const created: string[] = [];
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            if (!trace) return;

            const parentPath = parent
              ? trace.paths.find((p) => p.id === parent.pathId)
              : undefined;

            // Une trajectoire appartient à la décision de sa mère ; une
            // trajectoire racine à la décision actuellement travaillée.
            const decisionId =
              parentPath?.decisionId ?? trace.chosenDecisionId ?? null;

            for (const p of payloads) {
              const now = touch();
              const id = generateId();
              created.push(id);

              trace.paths.push({
                id,
                traceId,
                parentPathId: parentPath?.id ?? null,
                rootPathId: parentPath?.rootPathId ?? parentPath?.id ?? null,
                decisionId,
                color: nextPathColor(trace.paths),
                title: p.title,
                thesis: p.thesis,
                angle: p.angle,
                keyMoves: p.keyMoves,
                risks: p.risks,
                payoff: p.payoff,
                divergence: p.divergence,
                status: 'open',
                depth: parentPath ? parentPath.depth + 1 : 0,
                timeline: [],
                branches: [],
                scores: null,
                createdAt: now,
                updatedAt: now,
                origin: parentPath ? 'user' : 'ai',
              });
            }

            // L'alternative reste attachée au point de bifurcation
            if (parentPath && parent) {
              parentPath.branches.push({
                ...parent.branch,
                id: generateId(),
                childPathId: created[0] ?? null,
                atEntryIndex: parent.entryIndex,
                chosen: parent.branch.chosen || parentPath.title,
                createdAt: touch(),
              });
              parentPath.updatedAt = touch();
            }

            trace.updatedAt = touch();
          });
          return created;
        },

        updatePath: (traceId, pathId, updates) => {
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            if (!trace) return;
            const path = trace.paths.find((p) => p.id === pathId);
            if (!path) return;
            Object.assign(path, updates);
            path.updatedAt = touch();
            trace.updatedAt = touch();
          });
        },

        setPathStatus: (traceId, pathId, status) => {
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            if (!trace) return;
            const path = trace.paths.find((p) => p.id === pathId);
            if (!path) return;
            path.status = status;
            path.updatedAt = touch();
            trace.updatedAt = touch();
          });
        },

        addDescent: (traceId, pathId, entry) => {
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            if (!trace) return;
            const path = trace.paths.find((p) => p.id === pathId);
            if (!path) return;

            const full: DescentEntry = {
              ...entry,
              id: generateId(),
              pathId,
              createdAt: touch(),
            };

            path.timeline.push(full);
            if (path.status === 'open') path.status = 'explored';
            path.updatedAt = touch();
            trace.updatedAt = touch();
          });
        },

        removeDescent: (traceId, pathId, entryId) => {
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            if (!trace) return;
            const path = trace.paths.find((p) => p.id === pathId);
            if (!path) return;
            path.timeline = path.timeline.filter((e) => e.id !== entryId);
            if (path.timeline.length === 0) path.status = 'open';
            path.updatedAt = touch();
            trace.updatedAt = touch();
          });
        },

        /**
         * Suppression réelle. Retire la trajectoire, ses sous-trajectoires,
         * ses descentes, et le point de bifurcation qui y menait chez le
         * parent. La trace reste cohérente, le journal garde la trace de la
         * suppression.
         */
        deletePath: (traceId, pathId) => {
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            if (!trace) return;

            const target = trace.paths.find((p) => p.id === pathId);
            if (!target) return;

            // La trajectoire et toute sa descendance
            const doomed = new Set<string>();
            const collect = (id: string) => {
              doomed.add(id);
              trace.paths.filter((p) => p.parentPathId === id).forEach((c) => collect(c.id));
            };
            collect(pathId);

            const removed = trace.paths.filter((p) => doomed.has(p.id));

            // On détache les branches qui pointaient vers ces trajectoires
            for (const p of trace.paths) {
              p.branches = p.branches.filter(
                (b) => !removed.some((r) => b.chosen.startsWith(r.title))
              );
            }

            trace.paths = trace.paths.filter((p) => !doomed.has(p.id));

            // L'arbitrage ne peut pas désigner une trajectoire disparue
            if (trace.verdict && doomed.has(trace.verdict.recommendedPathId)) {
              trace.verdict = null;
              trace.confrontation = null;
              trace.status = 'open';
            }
            if (trace.confrontation) {
              trace.confrontation.rows = trace.confrontation.rows.filter(
                (r) => !doomed.has(r.pathId)
              );
              for (const p of trace.paths) p.scores = null;
            }

            trace.events.push({
              id: generateId(),
              kind: 'elimination',
              actor: 'user',
              label: `« ${target.title} » supprimée`,
              detail:
                removed.length > 1
                  ? `avec ${removed.length - 1} sous-trajectoire${removed.length > 2 ? 's' : ''}`
                  : undefined,
              color: target.color,
              createdAt: new Date().toISOString(),
            });

            trace.updatedAt = touch();
          });
        },

        deleteBranch: (traceId, pathId, branchId) => {
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            if (!trace) return;
            const path = trace.paths.find((p) => p.id === pathId);
            if (!path) return;
            path.branches = path.branches.filter((b) => b.id !== branchId);
            path.updatedAt = touch();
            trace.updatedAt = touch();
          });
        },

setConfrontation: (traceId, confrontation, onlyPathIds) => {
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            if (!trace) return;

            // Seules les trajectoires réellement confrontées gardent une note.
            // Les autres gardent celle qu'elles avaient pour leur propre décision.
            const keep = onlyPathIds ? new Set(onlyPathIds) : null;

            const ranked = [...confrontation.rows].sort((a, b) => b.total - a.total);
            ranked.forEach((row, i) => {
              const path = trace.paths.find((p) => p.id === row.pathId);
              if (!path || path.status === 'eliminated') return;
              path.scores = {
                values: row.values,
                rationale: row.rationale,
                total: weightedTotal(row.values, trace.criteria ?? []),
              };
              if (i === 0) path.status = 'retained';
            });

            if (keep) {
              for (const p of trace.paths) {
                if (!keep.has(p.id) && p.scores && p.status === 'retained') {
                  p.status = p.timeline.length ? 'explored' : 'open';
                }
              }
            }

            trace.confrontation = confrontation;
            trace.updatedAt = touch();
          });
        },

        setVerdict: (traceId, verdict) => {
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            if (!trace) return;
            // Les vérifications déjà faites survivent à un nouvel arbitrage :
            // un falsificateur confirmé n'a pas besoin d'être revalidé.
            const previous = new Map(
              (trace.verdict?.checks ?? []).map((c) => [c.falsifier, c])
            );

            trace.verdict = {
              ...verdict,
              checks: verdict.falsifiers.map((f) => {
                const kept = previous.get(f);
                if (kept) return { ...kept, falsifier: f };
                return {
                  falsifier: f,
                  status: 'pending' as FalsifierStatus,
                  note: '',
                  checkedAt: null,
                };
              }),
            };
            trace.updatedAt = touch();
          });
        },

        setFalsifierStatus: (traceId, falsifier, status, note) => {
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            const verdict = trace?.verdict;
            if (!trace || !verdict) return;

            const check = verdict.checks.find((c) => c.falsifier === falsifier);
            if (!check) return;

            const wasRefuted = check.status === 'refuted';
            check.status = status;
            if (note !== undefined) check.note = note;
            check.checkedAt = status === 'pending' ? null : new Date().toISOString();

            trace.events.push({
              id: generateId(),
              kind: status === 'refuted' ? 'branch' : 'correction',
              actor: 'user',
              label:
                status === 'verified'
                  ? 'Falsificateur vérifié — la décision tient'
                  : status === 'refuted'
                    ? 'Falsificateur réfuté'
                    : status === 'dropped'
                      ? 'Falsificateur écarté'
                      : 'Falsificateur remis en attente',
              detail: falsifier,
              color: status === 'refuted' ? '#F87171' : '#34D399',
              createdAt: new Date().toISOString(),
            });

            // Un faux prouvé annule la décision : on rouvre plutôt que
            // de laisser un arbitrage invalide afficher « validée ».
            if (wasRefuted !== (status === 'refuted')) {
              if (status === 'refuted') {
                trace.confrontation = null;
                trace.verdict = null;
                trace.status = 'open';
              }
            }
            trace.updatedAt = touch();
          });
        },

        commitVerdict: (traceId) => {
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            if (!trace) return;

            for (const p of trace.paths) {
              if (p.id === trace.verdict?.recommendedPathId) p.status = 'selected';
              else if (p.status !== 'eliminated') p.status = 'eliminated';
            }

            trace.status = 'arbitrated';
            trace.updatedAt = touch();
          });
        },

        /**
         * Une hypothèse est arrivée après la décision : celle-ci a été prise
         * sur un jeu de trajectoires incomplet. Elle redevient une proposition.
         */
        reopenVerdict: (traceId, reason) => {
          set((state) => {
            const trace = state.traces.find((t) => t.id === traceId);
            if (!trace) return;

            const chosenId = trace.verdict?.recommendedPathId;
            for (const p of trace.paths) {
              if (p.id === chosenId) {
                p.status = p.timeline.length ? 'explored' : 'open';
                p.scores = null;
              }
            }

            trace.confrontation = null;
            trace.verdict = null;
            trace.status = 'open';
            trace.updatedAt = touch();

            trace.events.push({
              id: generateId(),
              kind: 'branch',
              actor: 'ai',
              label: 'Décision rouverte',
              detail: reason,
              createdAt: touch(),
            });
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

        getActiveTrace: () => {
          const { traces, activeTraceId } = get();
          return traces.find((t) => t.id === activeTraceId) ?? null;
        },

        getActivePath: () => {
          const { traces, activeTraceId, ui } = get();
          const trace = traces.find((t) => t.id === activeTraceId);
          if (!trace) return null;
          return trace.paths.find((p) => p.id === ui.activePathId) ?? null;
        },
      })),
      {
        name: 'imagine-storage',
        partialize: (state) => ({
          project: state.project,
          nodes: state.nodes,
          edges: state.edges,
          traces: state.traces,
          activeTraceId: state.activeTraceId,
          ui: {
            showGrid: state.ui.showGrid,
            showMinimap: state.ui.showMinimap,
            view: state.ui.view,
          },
        }),
      }
    ),
    { name: 'ImagineStore' }
  )
);

export default useImagineStore;

