'use client';

// ========================================
// IMAGINE - Trace Canvas
// Le flux du tracé, en arbre qui grandit vers la droite.
// Ce n'est pas une image : chaque nœud se travaille.
// ========================================

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  EyeOff,
  Flag,
  GitBranch,
  Minus,
  Plus,
  RotateCcw,
  Target,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useImagineStore } from '@/store';
import { useTrace } from '@/hooks/useTrace';
import { cn } from '@/lib/utils';
import { traceLayout, pathEvidence, type TraceEdge, type TraceNode } from '@/lib/trace';
import { ThoughtField } from './ThoughtField';
import { EliminateLayer, useEliminate } from '@/components/projection/Eliminate';

// ========================================
// Lien
// ========================================

function Flow({ edge, dim, lit }: { edge: TraceEdge; dim: boolean; lit: boolean }) {
  const dx = Math.max(40, (edge.x2 - edge.x1) * 0.55);
  const d = `M ${edge.x1} ${edge.y1} C ${edge.x1 + dx} ${edge.y1}, ${edge.x2 - dx} ${edge.y2}, ${edge.x2} ${edge.y2}`;
  const thin = edge.kind === 'descent' && !edge.solid;

  return (
    <g style={{ transition: 'opacity 320ms ease' }} opacity={dim ? 0.08 : lit ? 1 : 0.4}>
      {lit && !dim && (
        <motion.path
          d={d}
          fill="none"
          stroke={edge.color}
          strokeWidth={6}
          strokeOpacity={0.14}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        />
      )}
      <motion.path
        d={d}
        fill="none"
        stroke={edge.color}
        strokeWidth={thin ? 1.2 : 2.2}
        strokeOpacity={thin ? 0.4 : 0.8}
        strokeDasharray={thin ? '4 5' : undefined}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.75, ease: 'easeOut' }}
      />
    </g>
  );
}

// ========================================
// Nœuds
// ========================================

function SparkNode({ node, onClick }: { node: TraceNode; onClick: () => void }) {
  return (
    <g onClick={onClick} className="cursor-pointer">
      <motion.rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        rx={18}
        fill="rgba(230,237,243,0.055)"
        stroke="rgba(230,237,243,0.34)"
        strokeWidth={1.2}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ transformOrigin: `${node.x + node.w / 2}px ${node.y + node.h / 2}px` }}
        transition={{ duration: 0.5 }}
        whileHover={{ fill: 'rgba(230,237,243,0.09)' }}
      />
      <text x={node.x + 20} y={node.y + 30} fill="#E6EDF3" fontSize={15} fontWeight={500} className="select-none">
        {node.title.length > 32 ? `${node.title.slice(0, 31)}…` : node.title}
      </text>
      <text x={node.x + 20} y={node.y + 53} fill="rgba(230,237,243,0.44)" fontSize={11.5} className="select-none">
        {node.subtitle.length > 46 ? `${node.subtitle.slice(0, 45)}…` : node.subtitle}
      </text>
    </g>
  );
}

function EntryNode({
  node,
  dim,
  active,
  onEnter,
  onLeave,
  onClick,
}: {
  node: TraceNode;
  dim: boolean;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: (e?: React.MouseEvent) => void;
}) {
  const blind = node.subtitle === '' && node.title !== '';
  return (
    <g
      style={{ transition: 'opacity 320ms ease' }}
      opacity={dim ? 0.08 : active ? 1 : 0.62}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      className="cursor-pointer"
    >
      <rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        rx={12}
        fill={active ? `${node.color}1A` : `${node.color}0D`}
        stroke={active ? `${node.color}77` : `${node.color}2E`}
        strokeWidth={active ? 1.4 : 1}
      />
      <circle cx={node.x + 14} cy={node.y + 16} r={3.2} fill={node.color} opacity={0.85} />
      <text x={node.x + 25} y={node.y + 20} fill="#C9D1D9" fontSize={10.5} className="select-none">
        {node.title.length > 24 ? `${node.title.slice(0, 23)}…` : node.title}
      </text>
      {node.subtitle && (
        <text x={node.x + 14} y={node.y + 36} fill="rgba(139,148,158,0.82)" fontSize={9.5} className="select-none">
          {node.subtitle.length > 28 ? `${node.subtitle.slice(0, 27)}…` : node.subtitle}
        </text>
      )}
      {blind && <circle cx={node.x + node.w - 14} cy={node.y + 16} r={3} fill="#8B949E" opacity={0.5} />}
    </g>
  );
}

function PathNode({
  node,
  dim,
  active,
  selected,
  hasChildren,
  collapsed,
  onEnter,
  onLeave,
  onClick,
  onToggle,
}: {
  node: TraceNode;
  dim: boolean;
  active: boolean;
  selected: boolean;
  hasChildren: boolean;
  collapsed: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: (e?: React.MouseEvent) => void;
  onToggle: () => void;
}) {
  const eliminated = node.status === 'eliminated';
  const chosen = node.status === 'selected';
  const ev = node.pathId ? pathEvidence(tracePathCache[node.pathId]!) : null;

  return (
    <g
      style={{ transition: 'opacity 320ms ease' }}
      opacity={dim ? 0.1 : eliminated ? 0.32 : 1}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {chosen && !dim && (
        <motion.rect
          x={node.x - 6}
          y={node.y - 6}
          width={node.w + 12}
          height={node.h + 12}
          rx={20}
          fill="none"
          stroke={node.color}
          strokeWidth={1.4}
          strokeOpacity={0.5}
          animate={{ strokeOpacity: [0.25, 0.7, 0.25] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        />
      )}
      {selected && (
        <rect
          x={node.x - 3}
          y={node.y - 3}
          width={node.w + 6}
          height={node.h + 6}
          rx={17}
          fill="none"
          stroke="#E6EDF3"
          strokeWidth={1.4}
          strokeOpacity={0.85}
          strokeDasharray="5 4"
        />
      )}

      <motion.rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        rx={15}
        fill={active ? `${node.color}20` : `${node.color}12`}
        stroke={`${node.color}${active || selected ? 'AA' : '4D'}`}
        strokeWidth={active || selected ? 1.6 : 1}
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45 }}
        className="cursor-pointer"
        onClick={onClick}
      />

      <rect x={node.x} y={node.y + 13} width={3} height={node.h - 26} rx={2} fill={node.color} />

      <text x={node.x + 16} y={node.y + 26} fill="#E6EDF3" fontSize={12.5} fontWeight={500} className="select-none">
        {node.title.length > 24 ? `${node.title.slice(0, 23)}…` : node.title}
      </text>
      <text x={node.x + 16} y={node.y + 44} fill={node.color} fontSize={10} opacity={0.9} className="select-none">
        {node.subtitle}
        {ev && ev.band >= 12 ? ` · ±${ev.band}` : ''}
      </text>

      {chosen && (
        <g transform={`translate(${node.x + node.w - 24} ${node.y + 11})`}>
          <Flag className="w-3.5 h-3.5" style={{ color: node.color }} />
        </g>
      )}

      {hasChildren && (
        <g
          transform={`translate(${node.x + node.w + 13} ${node.y + node.h / 2 - 9})`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="cursor-pointer"
        >
          <rect width={18} height={18} rx={5} fill="#151B23" stroke={`${node.color}55`} />
          {collapsed ? (
            <ChevronRight className="w-3 h-3" style={{ color: node.color }} />
          ) : (
            <ChevronDown className="w-3 h-3" style={{ color: node.color }} />
          )}
        </g>
      )}

      {collapsed && hasChildren && (
        <text
          x={node.x + node.w + 38}
          y={node.y + node.h / 2 + 4}
          fill={node.color}
          fontSize={10}
          opacity={0.7}
          className="select-none"
        >
          replié
        </text>
      )}
    </g>
  );
}

// Rempli à chaque rendu pour éviter de propager la trajectoire entière
let tracePathCache: Record<string, any> = {};

// ========================================
// Barre d'action
// ========================================

function ActionBar({
  onHypothesize,
  onDescend,
  onEliminate,
  onRestore,
  onDelete,
  eliminated,
}: {
  onHypothesize: () => void;
  onDescend: () => void;
  onEliminate: () => void;
  onRestore: () => void;
  onDelete: () => void;
  eliminated: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-xl glass px-1.5 py-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onDescend}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-imagine-text hover:bg-white/10 transition-colors"
        title="Ouvrir cette trajectoire dans le parcours"
      >
        <ChevronDown className="w-3.5 h-3.5" />
        Explorer
      </button>
      <button
        onClick={onHypothesize}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-imagine-text hover:bg-white/10 transition-colors"
        title="Ouvrir une hypothèse depuis ce point"
      >
        <GitBranch className="w-3.5 h-3.5 text-imagine-drift" />
        Et si…
      </button>
      {eliminated ? (
        <button
          onClick={onRestore}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-imagine-text-muted hover:text-imagine-text hover:bg-white/10 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Rétablir
        </button>
      ) : (
        <button
          onClick={onEliminate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-imagine-text-muted hover:text-imagine-text hover:bg-white/10 transition-colors"
        >
          <EyeOff className="w-3.5 h-3.5" />
          Écarter
        </button>
      )}
      <button
        onClick={onDelete}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-imagine-text-subtle hover:text-imagine-forge hover:bg-imagine-forge/10 transition-colors"
        title="Supprimer définitivement, avec ses sous-trajectoires"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Supprimer
      </button>
    </motion.div>
  );
}

// ========================================
// Canvas
// ========================================

export default function TraceCanvas() {
  const trace = useImagineStore((s) => s.traces.find((t) => t.id === s.activeTraceId));
  const activePathId = useImagineStore((s) => s.ui.activePathId);
  const setActivePath = useImagineStore((s) => s.setActivePath);
  const setTraceStep = useImagineStore((s) => s.setTraceStep);
  const setPathStatus = useImagineStore((s) => s.setPathStatus);
  const deletePath = useImagineStore((s) => s.deletePath);
  const { eliminate } = useTrace();
  const { target, ask, clear } = useEliminate();

  const [hoverPath, setHoverPath] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(0.82);
  const [pan, setPan] = useState({ x: 80, y: 0 });
  const dragging = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const layout = useMemo(() => {
    tracePathCache = {};
    if (!trace) return null;
    trace.paths.forEach((p) => {
      tracePathCache[p.id] = p;
    });

    const full = traceLayout(trace);
    if (collapsed.size === 0) return full;

    // Repli : on retire la descendance repliée, pas le nœud lui-même
    const hidden = new Set<string>();
    const isHidden = (id: string): boolean => {
      const p = trace.paths.find((x) => x.id === id);
      if (!p) return false;
      if (p.parentPathId && hidden.has(p.parentPathId)) return true;
      return collapsed.has(id) || isHidden(p.parentPathId ?? '');
    };

    trace.paths.forEach((p) => {
      if (collapsed.has(p.id) || (p.parentPathId && hidden.has(p.parentPathId))) {
        hidden.add(p.id);
      }
    });

    const kept = full.nodes.filter(
      (n) => !n.pathId || !hidden.has(n.pathId)
    );
    const keptIds = new Set(kept.map((n) => n.id));
    const keptEdges = full.edges.filter(
      (e) => keptIds.has(e.fromNodeId) && keptIds.has(e.toNodeId)
    );

    return { ...full, nodes: kept, edges: keptEdges };
  }, [trace, collapsed]);

  useEffect(() => {
    if (layout && trace) {
      const center = layout.height / 2;
      setPan({ x: 90, y: Math.max(0, center - 260) });
      setZoom(Math.min(1, Math.max(0.45, 1200 / Math.max(layout.width, 1))));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trace?.id]);

  if (!trace || !layout) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-imagine-bg">
        <p className="text-sm text-imagine-text-subtle">Aucun tracé à cartographier.</p>
      </div>
    );
  }

  const chosenId = trace.verdict?.recommendedPathId ?? null;
  const focus = hoverPath ?? selected ?? activePathId;
  const selectedPath = selected ? trace.paths.find((p) => p.id === selected) ?? null : null;

  // Deux questions différentes ne se mélangent pas à l'écran : on montre la
  // décision travaillée, avec le sélecteur pour passer à l'autre.
  const scopedIds = new Set(
    trace.paths
      .filter((p) => (p.decisionId ?? null) === trace.chosenDecisionId)
      .map((p) => p.id)
  );
  const scoped = {
    ...layout,
    nodes: layout.nodes.filter(
      (n) => n.kind === 'spark' || !n.pathId || scopedIds.has(n.pathId)
    ),
  };
  const nodeIds = new Set(scoped.nodes.map((n) => n.id));
  scoped.edges = scoped.edges.filter(
    (e) => nodeIds.has(e.fromNodeId) && nodeIds.has(e.toNodeId)
  );
  const others = trace.paths.length - scopedIds.size;

  const dimmed = (n: TraceNode) => {
    if (!focus) return false;
    if (n.kind === 'spark') return false;
    return n.rootPathId !== focus;
  };

  const edgeDimmed = (e: TraceEdge) => (focus ? e.pathId !== focus : false);
  const edgeLit = (e: TraceEdge) =>
    chosenId !== null &&
    trace.paths.find((p) => p.id === chosenId)?.rootPathId === e.pathId;

  const childrenOf = (id: string) => trace.paths.filter((p) => p.parentPathId === id).length;

  const onNodeClick = (node: TraceNode) => {
    if (node.kind === 'spark') {
      setSelected(null);
      setTraceStep(1);
      return;
    }
    if (!node.pathId) return;
    setSelected((cur) => (cur === node.pathId ? null : node.pathId));
  };

  const onToggleCollapse = (pathId: string) => {
    setCollapsed((cur) => {
      const next = new Set(cur);
      if (next.has(pathId)) next.delete(pathId);
      else next.add(pathId);
      return next;
    });
  };

  // Pan
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-pan]')) return;
    if ((e.target as HTMLElement).closest('g[class*="cursor-pointer"]')) return;
    dragging.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setPan({
      x: dragging.current.px + (e.clientX - dragging.current.x),
      y: dragging.current.py + (e.clientY - dragging.current.y),
    });
  };
  const onPointerUp = () => {
    dragging.current = null;
  };

  // Champ de pensée
  const live = scopedIds.size
    ? trace.paths.filter(
        (p) => scopedIds.has(p.id) && p.status !== 'eliminated'
      )
    : [];
  const attractors = live.map((p) => {
    const n = scoped.nodes.find((x) => x.id === `p:${p.id}`);
    return n ? { x: n.x + n.w / 2, y: n.y + n.h / 2, color: p.color, weight: 1 + p.timeline.length * 0.4 } : null;
  }).filter(Boolean) as Array<{ x: number; y: number; color: string; weight: number }>;

  return (
    <div className="relative w-full h-full overflow-hidden bg-imagine-bg">
      <ThoughtField attractors={attractors} pan={pan} zoom={zoom} />

      <svg
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClick={() => setSelected(null)}
      >
        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          {scoped.edges.map((e) => (
            <Flow key={e.id} edge={e} dim={edgeDimmed(e)} lit={edgeLit(e)} />
          ))}

          {scoped.nodes.map((n) => {
            if (n.kind === 'spark') {
              return <SparkNode key={n.id} node={n} onClick={() => onNodeClick(n)} />;
            }
            if (n.kind === 'entry') {
              return (
                <EntryNode
                  key={n.id}
                  node={n}
                  dim={dimmed(n)}
                  active={!!focus && n.rootPathId === focus}
                  onEnter={() => setHoverPath(n.rootPathId)}
                  onLeave={() => setHoverPath(null)}
                  onClick={(e) => {
                    e?.stopPropagation();
                    onNodeClick(n);
                  }}
                />
              );
            }
            return (
              <PathNode
                key={n.id}
                node={n}
                dim={dimmed(n)}
                active={!!focus && n.rootPathId === focus}
                selected={selected === n.pathId}
                hasChildren={n.pathId ? childrenOf(n.pathId) > 0 : false}
                collapsed={n.pathId ? collapsed.has(n.pathId) : false}
                onEnter={() => setHoverPath(n.rootPathId)}
                onLeave={() => setHoverPath(null)}
                onClick={(e) => {
                  e?.stopPropagation();
                  onNodeClick(n);
                }}
                onToggle={() => n.pathId && onToggleCollapse(n.pathId)}
              />
            );
          })}
        </g>
      </svg>

      {/* Barre d'action sur la trajectoire sélectionnée */}
      <AnimatePresence>
        {selectedPath && (
          <ActionBar
            eliminated={selectedPath.status === 'eliminated'}
            onDescend={() => {
              setActivePath(selectedPath.id);
              setTraceStep(4);
              setSelected(null);
            }}
            onHypothesize={() => {
              setActivePath(selectedPath.id);
              setTraceStep(4);
              setSelected(null);
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
            }}
            onEliminate={() => ask(selectedPath)}
            onRestore={() =>
              setPathStatus(
                trace.id,
                selectedPath.id,
                selectedPath.timeline.length ? 'explored' : 'open'
              )
            }
            onDelete={() => {
              if (selectedPath.id === activePathId) setActivePath(null);
              deletePath(trace.id, selectedPath.id);
              setSelected(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Légende */}
      <div className="absolute top-4 left-4 rounded-xl glass px-3.5 py-2.5 pointer-events-none max-w-xs">
        <div className="flex items-center gap-3">
          <GitBranch className="w-4 h-4 text-imagine-projection shrink-0" />
          <div className="text-xs text-imagine-text-muted leading-tight">
            <div className="text-imagine-text">{scopedIds.size} trajectoires</div>
            <div className="text-imagine-text-subtle">
              {trace.paths.reduce((n, p) => n + p.timeline.length, 0)} passages
              {trace.paths.some((p) => p.branches.length > 0) &&
                ` · ${trace.paths.reduce((n, p) => n + p.branches.length, 0)} virages`}
            </div>
          </div>
        </div>

        {others > 0 && (
          <p className="text-[10px] text-imagine-text-subtle/70 mt-1.5 pt-1.5 border-t border-white/5 leading-snug">
            {others} trajectoire{others > 1 ? 's' : ''} appartiennent à une autre
            décision — change de question dans le parcours.
          </p>
        )}
      </div>

      {chosenId && (
        <div className="absolute top-4 right-4 flex items-center gap-2 rounded-xl glass px-3.5 py-2.5 pointer-events-none">
          <Target className="w-4 h-4 text-imagine-mature" />
          <div className="text-xs">
            <div className="text-imagine-text-muted">Retenu</div>
            <div
              className="font-medium"
              style={{ color: trace.paths.find((p) => p.id === chosenId)?.color }}
            >
              {trace.paths.find((p) => p.id === chosenId)?.title}
            </div>
          </div>
        </div>
      )}

      {/* Zoom */}
      <div
        data-no-pan
        className="absolute bottom-4 left-4 flex items-center gap-1 rounded-xl glass px-1.5 py-1.5 z-30"
      >
        <button
          onClick={() => setZoom((z) => Math.max(0.3, z - 0.12))}
          className="p-1.5 rounded-lg text-imagine-text-subtle hover:text-imagine-text hover:bg-white/5 transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-[11px] text-imagine-text-subtle tabular-nums w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(1.8, z + 0.12))}
          className="p-1.5 rounded-lg text-imagine-text-subtle hover:text-imagine-text hover:bg-white/5 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(0.82);
            setPan({ x: 80, y: 0 });
          }}
          className="px-2 py-1.5 rounded-lg text-[11px] text-imagine-text-subtle hover:text-imagine-text hover:bg-white/5 transition-colors"
        >
          recentrer
        </button>
      </div>

      <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[11px] text-imagine-text-subtle/60 pointer-events-none">
        Clique une trajectoire pour la travailler
      </p>

      <EliminateLayer
        target={target}
        onConfirm={(because) => {
          if (target) eliminate(target, because);
          clear();
        }}
        onCancel={clear}
      />
    </div>
  );
}