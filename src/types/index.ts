// ========================================
// IMAGINE - Types
// Modèle de données
// ========================================

// ========================================
// Core Types
// ========================================

export type NodeType = 'text' | 'image' | 'code' | 'audio' | 'link' | 'ai';

export type EdgeRelationType = 
  | 'manual'      // Créé par l'utilisateur
  | 'semantic'    // Détecté par l'IA
  | 'temporal'    // Basé sur le temps
  | 'causal';     // Relation cause-effet

// ========================================
// Position & Geometry
// ========================================

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ========================================
// Node
// ========================================

export interface NodeMetadata {
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  color?: string;
  locked?: boolean;
  collapsed?: boolean;
}

export interface BaseNode {
  id: string;
  projectId: string;
  type: NodeType;
  position: Position;
  dimensions?: Dimensions;
  metadata: NodeMetadata;
}

export interface TextNode extends BaseNode {
  type: 'text';
  content: string;
  title?: string;
}

export interface ImageNode extends BaseNode {
  type: 'image';
  src: string;
  alt?: string;
}

export interface CodeNode extends BaseNode {
  type: 'code';
  content: string;
  language: string;
}

export interface AudioNode extends BaseNode {
  type: 'audio';
  src: string;
  duration?: number;
  transcript?: string;
}

export interface LinkNode extends BaseNode {
  type: 'link';
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
}

export interface AINode extends BaseNode {
  type: 'ai';
  prompt: string;
  response?: string;
  model?: string;
}

export type ImagineNode = 
  | TextNode 
  | ImageNode 
  | CodeNode 
  | AudioNode 
  | LinkNode 
  | AINode;

// ========================================
// Edge
// ========================================

export interface Edge {
  id: string;
  projectId: string;
  fromNodeId: string;
  toNodeId: string;
  relationType: EdgeRelationType;
  label?: string;
  confidenceScore?: number; // 0-1 pour les liens IA
  metadata: {
    createdAt: string;
    createdBy: 'user' | 'ai';
  };
}

// ========================================
// Project
// ========================================

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  settings: ProjectSettings;
  thumbnail?: string;
}

export interface ProjectSettings {
  gridEnabled: boolean;
  gridSize: number;
  snapToGrid: boolean;
  defaultNodeType: NodeType;
  aiEnabled: boolean;
}

// ========================================
// Spark (Idée initiale)
// ========================================

export type SparkType = 'text' | 'voice' | 'image' | 'keyword';

export interface Spark {
  id: string;
  type: SparkType;
  content: string;
  createdAt: string;
  projectId?: string;
  convertedToNodeId?: string;
}

// ========================================
// AI Types
// ========================================

export interface AISuggestion {
  id: string;
  type: 'link' | 'reformulation' | 'expansion' | 'theme' | 'fork' | 'reconnect';
  content: string;
  confidence: number;
  sourceNodeIds: string[];
  targetNodeId?: string;
  accepted: boolean;
  // For reconnect type: multiple link suggestions
  reconnectLinks?: Array<{ fromId: string; toId: string; reason: string }>;
}

export interface AIContext {
  projectId: string;
  recentNodes: string[];
  activeNode?: string;
  userIntent?: string;
}

// ========================================
// Canvas State
// ========================================

export interface CanvasState {
  viewport: Viewport;
  selectedNodeIds: string[];
  hoveredNodeId: string | null;
  isDragging: boolean;
  isPanning: boolean;
  isConnecting: boolean;
  connectionSource?: string;
}

// ========================================
// UI State
// ========================================

export type AppMode = 'canvas' | 'drift' | 'forge';

export interface UIState {
  mode: AppMode;
  sidebarOpen: boolean;
  sidebarContent: 'properties' | 'ai' | 'history' | null;
  showGrid: boolean;
  showMinimap: boolean;
  isFullscreen: boolean;
}

// ========================================
// Actions & Events
// ========================================

export type CanvasAction =
  | { type: 'CREATE_NODE'; payload: Partial<ImagineNode> }
  | { type: 'UPDATE_NODE'; payload: { id: string; updates: Partial<ImagineNode> } }
  | { type: 'DELETE_NODE'; payload: { id: string } }
  | { type: 'MOVE_NODE'; payload: { id: string; position: Position } }
  | { type: 'CREATE_EDGE'; payload: Partial<Edge> }
  | { type: 'DELETE_EDGE'; payload: { id: string } }
  | { type: 'SELECT_NODES'; payload: { ids: string[] } }
  | { type: 'PAN'; payload: { delta: Position } }
  | { type: 'ZOOM'; payload: { zoom: number; center?: Position } };

// ========================================
// Forge (Transformation)
// ========================================

export type ForgeOutputType = 
  | 'document'
  | 'pitch'
  | 'plan'
  | 'code'
  | 'prompt'
  | 'summary'
  | 'mindmap';

export interface ForgeRequest {
  sourceNodeIds: string[];
  outputType: ForgeOutputType;
  options?: {
    style?: string;
    length?: 'short' | 'medium' | 'long';
    format?: string;
  };
}

export interface ForgeOutput {
  id: string;
  type: ForgeOutputType;
  content: string;
  createdAt: string;
  sourceNodeIds: string[];
}

// ========================================
// History & Undo
// ========================================

export interface HistoryEntry {
  id: string;
  timestamp: string;
  action: CanvasAction;
  prevState: {
    nodes?: ImagineNode[];
    edges?: Edge[];
  };
}

// ========================================
// Export
// ========================================

export interface ExportOptions {
  format: 'json' | 'markdown' | 'nexus' | 'pdf';
  includeMetadata: boolean;
  selectedOnly: boolean;
}
