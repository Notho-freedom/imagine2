'use client';

// ========================================
// IMAGINE - Node Component
// Carte vivante - objet cognitif riche
// ========================================

import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GripVertical, 
  X, 
  Link, 
  Type,
  Image as ImageIcon,
  Code2,
  Mic,
  Link2,
  Sparkles,
  Star,
  Zap,
  GitBranch,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useImagineStore } from '@/store';
import { useNodeDrag } from '@/hooks';
import { cn } from '@/lib/utils';
import type { ImagineNode, NodeType } from '@/types';

interface NodeProps {
  node: ImagineNode;
}

// ========================================
// Node Type Configuration
// ========================================

const nodeTypeIcons: Record<NodeType, React.ElementType> = {
  text: Type,
  image: ImageIcon,
  code: Code2,
  audio: Mic,
  link: Link2,
  ai: Sparkles,
};

// Visual styles per node type - Cognitive Richness
const nodeTypeStyles: Record<NodeType, {
  border: string;
  glow: string;
  icon: string;
  bg: string;
  surface: 'matte' | 'glow' | 'glass' | 'pulse';
}> = {
  text: {
    border: 'border-imagine-nebula/60',
    glow: '',
    icon: 'text-imagine-nebula-light',
    bg: 'bg-imagine-surface-matte',
    surface: 'matte',
  },
  image: {
    border: 'border-imagine-spark/60',
    glow: 'shadow-halo-mature',
    icon: 'text-imagine-spark',
    bg: 'bg-imagine-surface',
    surface: 'glow',
  },
  code: {
    border: 'border-imagine-projection/40',
    glow: '',
    icon: 'text-imagine-projection',
    bg: 'bg-imagine-bg/80',
    surface: 'matte',
  },
  audio: {
    border: 'border-imagine-drift/60',
    glow: '',
    icon: 'text-imagine-drift',
    bg: 'bg-imagine-surface',
    surface: 'matte',
  },
  link: {
    border: 'border-imagine-intuition/60',
    glow: '',
    icon: 'text-imagine-intuition-light',
    bg: 'bg-imagine-surface',
    surface: 'matte',
  },
  ai: {
    border: 'border-imagine-projection/50',
    glow: 'shadow-halo-ia',
    icon: 'text-imagine-projection',
    bg: 'bg-gradient-to-br from-imagine-surface to-imagine-projection/5',
    surface: 'pulse',
  },
};

// ========================================
// Helper: Calculate node maturity
// ========================================

function getNodeMaturity(node: ImagineNode): {
  level: 'nascent' | 'growing' | 'mature' | 'key';
  color: string;
  icon: React.ElementType | null;
} {
  if (node.type !== 'text') {
    return { level: 'nascent', color: '', icon: null };
  }
  
  const content = (node as any).content || '';
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const hasConnections = false; // Would check edges in real implementation
  const age = Date.now() - new Date(node.metadata.createdAt).getTime();
  const ageHours = age / (1000 * 60 * 60);
  
  // Key idea (marked or highly connected)
  if ((node as any).isKey) {
    return { level: 'key', color: 'text-imagine-mature', icon: Star };
  }
  
  // Mature idea (long content, aged)
  if (wordCount > 50 || ageHours > 24) {
    return { level: 'mature', color: 'text-imagine-mature', icon: CheckCircle2 };
  }
  
  // Growing idea
  if (wordCount > 15) {
    return { level: 'growing', color: 'text-imagine-coherence', icon: GitBranch };
  }
  
  // Nascent idea
  return { level: 'nascent', color: 'text-imagine-text-subtle', icon: null };
}

// ========================================
// Main Node Component
// ========================================

// ========================================
// Semantic Zoom Levels
// ========================================

type ZoomLevel = 'macro' | 'normal' | 'detail';

function getZoomLevel(zoom: number): ZoomLevel {
  if (zoom < 0.5) return 'macro';
  if (zoom > 1.2) return 'detail';
  return 'normal';
}

export default function Node({ node }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(
    node.type === 'text' ? node.content : ''
  );
  const [showActions, setShowActions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    canvas,
    edges,
    deleteNode,
    updateNode,
    setConnecting,
    setHoveredNode,
  } = useImagineStore();

  const isSelected = canvas.selectedNodeIds.includes(node.id);
  const isHovered = canvas.hoveredNodeId === node.id;
  const typeStyle = nodeTypeStyles[node.type];
  const maturity = useMemo(() => getNodeMaturity(node), [node]);
  
  // Semantic zoom level
  const zoomLevel = useMemo(() => getZoomLevel(canvas.viewport.zoom), [canvas.viewport.zoom]);
  
  // Count connections
  const connectionCount = useMemo(() => {
    return edges.filter(e => e.fromNodeId === node.id || e.toNodeId === node.id).length;
  }, [edges, node.id]);

  const { isDragging, handleMouseDown } = useNodeDrag({
    nodeId: node.id,
  });

  // Auto-focus textarea when editing
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Sync content with node
  useEffect(() => {
    if (node.type === 'text' && !isEditing) {
      setContent(node.content);
    }
  }, [node, isEditing]);

  // Start connection
  const handleStartConnection = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setConnecting(true, node.id);
    },
    [node.id, setConnecting]
  );

  // Delete node
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteNode(node.id);
    },
    [node.id, deleteNode]
  );

  // Handle double click to edit
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (node.type === 'text') {
        setIsEditing(true);
      }
    },
    [node.type]
  );

  // Handle blur - save content
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (node.type === 'text') {
      updateNode(node.id, { content } as Partial<ImagineNode>);
    }
  }, [node.id, node.type, content, updateNode]);

  // Handle key down in textarea
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsEditing(false);
        setContent(node.type === 'text' ? node.content : '');
      }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleBlur();
      }
    },
    [node, handleBlur]
  );

  const Icon = nodeTypeIcons[node.type];
  const MaturityIcon = maturity.icon;
  const width = node.dimensions?.width || 280;
  const height = node.dimensions?.height || 140;

  return (
    <motion.div
      data-node-id={node.id}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: 0,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ 
        type: 'spring',
        damping: 25,
        stiffness: 300,
      }}
      className={cn(
        'absolute rounded-2xl border transition-all duration-300',
        typeStyle.border,
        typeStyle.bg,
        typeStyle.surface === 'pulse' && 'animate-node-breathe',
        isSelected && 'ring-2 ring-imagine-projection/60 ring-offset-2 ring-offset-imagine-bg',
        isSelected && typeStyle.glow,
        isDragging && 'opacity-95 scale-[1.02] cursor-grabbing',
        !isDragging && 'cursor-grab',
        'group shadow-card-deep hover:shadow-card-hover'
      )}
      style={{
        left: node.position.x,
        top: node.position.y,
        width,
        minHeight: height,
        zIndex: isDragging ? 100 : isSelected ? 50 : 10,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => {
        setHoveredNode(node.id);
        setShowActions(true);
      }}
      onMouseLeave={() => {
        setHoveredNode(null);
        setShowActions(false);
      }}
    >
      {/* Glow effect for AI nodes */}
      {node.type === 'ai' && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-imagine-projection/10 to-transparent animate-pulse-glow pointer-events-none" />
      )}
      
      {/* Key idea halo */}
      {maturity.level === 'key' && (
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-imagine-mature/20 to-imagine-mature/5 animate-halo-pulse pointer-events-none" />
      )}

      {/* Inner glow border effect */}
      <div className="absolute inset-0 rounded-2xl shadow-inner-depth pointer-events-none" />

      {/* Header - Hidden in macro zoom */}
      {zoomLevel !== 'macro' && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-6 h-6 rounded-lg flex items-center justify-center',
              'bg-white/5 backdrop-blur-sm'
            )}>
              <Icon className={cn('w-3.5 h-3.5', typeStyle.icon)} />
            </div>
            
            {/* Title or type indicator */}
            {node.type === 'text' && (node as any).title ? (
              <span className="text-sm font-semibold text-imagine-text truncate max-w-[150px]">
                {(node as any).title}
              </span>
            ) : (
              <span className="text-xs font-medium text-imagine-text-muted uppercase tracking-wide">
                {node.type === 'ai' ? 'Suggestion IA' : node.type}
              </span>
            )}
            
            {/* Maturity indicator */}
            {MaturityIcon && (
              <MaturityIcon className={cn('w-3.5 h-3.5', maturity.color)} />
            )}
          </div>

          {/* Actions */}
          <AnimatePresence>
            {(showActions || isSelected) && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-1"
              >
                {connectionCount > 0 && (
                  <span className="text-xs text-imagine-text-subtle mr-2 flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    {connectionCount}
                  </span>
                )}
                <button
                  onClick={handleStartConnection}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-imagine-text-muted hover:text-imagine-projection transition-colors"
                  title="Créer un lien"
                >
                  <Link className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-imagine-text-muted hover:text-imagine-forge transition-colors"
                  title="Supprimer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Macro view - simplified representation */}
      {zoomLevel === 'macro' && (
        <div className="flex items-center justify-center h-full min-h-[60px] p-3">
          <div className="flex items-center gap-2">
            <Icon className={cn('w-5 h-5', typeStyle.icon)} />
            {maturity.level !== 'nascent' && (
              <div className={cn(
                'w-2 h-2 rounded-full',
                maturity.level === 'key' && 'bg-imagine-mature',
                maturity.level === 'mature' && 'bg-imagine-coherence',
                maturity.level === 'growing' && 'bg-imagine-nebula',
              )} />
            )}
            {connectionCount > 0 && (
              <span className="text-[10px] text-imagine-text-subtle font-medium">
                {connectionCount}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content - Normal and Detail zoom */}
      {zoomLevel !== 'macro' && (
        <div className="p-4">
          {node.type === 'text' && (
            isEditing ? (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-full min-h-[80px] bg-transparent text-imagine-text text-sm leading-relaxed resize-none outline-none placeholder:text-imagine-text-subtle"
                placeholder="Écrivez votre idée..."
              />
            ) : (
              <>
                <p className={cn(
                  'leading-relaxed whitespace-pre-wrap',
                  zoomLevel === 'detail' ? 'text-sm' : 'text-sm',
                  node.content 
                    ? 'text-imagine-text' 
                    : 'text-imagine-text-subtle italic'
                )}>
                  {zoomLevel === 'normal' 
                    ? (node.content?.slice(0, 150) || 'Double-cliquez pour éditer...') + (node.content && node.content.length > 150 ? '...' : '')
                    : (node.content || 'Double-cliquez pour éditer...')}
                </p>
                
                {/* Detail zoom: show metadata */}
                {zoomLevel === 'detail' && node.content && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-imagine-text-subtle">
                    <span>{node.content.split(/\s+/).filter(Boolean).length} mots</span>
                    <span>Créé {new Date(node.metadata.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </>
            )
          )}

          {node.type === 'ai' && (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-imagine-projection mt-0.5 flex-shrink-0" />
                <p className="text-sm text-imagine-projection leading-relaxed">
                  {zoomLevel === 'normal' 
                    ? ((node as any).prompt?.slice(0, 100) + (((node as any).prompt?.length || 0) > 100 ? '...' : ''))
                    : (node as any).prompt}
                </p>
              </div>
              {(node as any).response && zoomLevel === 'detail' && (
                <p className="text-sm text-imagine-text-muted border-t border-white/5 pt-3 leading-relaxed">
                  {(node as any).response}
                </p>
              )}
            </div>
          )}

          {node.type === 'code' && (
            <pre className="text-sm font-mono text-imagine-text bg-imagine-bg/50 rounded-lg p-3 overflow-x-auto border border-white/5">
              <code>
                {zoomLevel === 'detail' 
                  ? (node as any).content 
                  : ((node as any).content?.slice(0, 100) + (((node as any).content?.length || 0) > 100 ? '...' : ''))}
              </code>
            </pre>
          )}
        </div>
      )}

      {/* Connection handles */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: showActions || isSelected ? 1 : 0 }}
        className={cn(
          'absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5',
          'bg-imagine-projection rounded-full border-2 border-imagine-bg-elevated',
          'cursor-crosshair shadow-glow-sm',
          'hover:scale-125 hover:shadow-glow-md transition-all'
        )}
        onMouseDown={handleStartConnection}
      />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: showActions || isSelected ? 1 : 0 }}
        className={cn(
          'absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5',
          'bg-imagine-intuition rounded-full border-2 border-imagine-bg-elevated',
          'cursor-crosshair shadow-glow-sm'
        )}
      />
      
      {/* Bottom accent line - visual richness */}
      <div className={cn(
        'absolute bottom-0 left-4 right-4 h-0.5 rounded-full opacity-30',
        maturity.level === 'key' && 'bg-imagine-mature',
        maturity.level === 'mature' && 'bg-imagine-coherence',
        maturity.level === 'growing' && 'bg-imagine-nebula',
        maturity.level === 'nascent' && 'bg-white/10',
      )} />
    </motion.div>
  );
}
