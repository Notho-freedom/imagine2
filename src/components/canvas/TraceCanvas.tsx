'use client';

// ========================================
// IMAGINE - Trace Canvas
// Le flux du tracé, en arbre qui grandit vers la droite.
// On survole une trajectoire, sa lignée s'allume, le reste s'efface.
// ========================================

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, GitBranch, Minus, Plus, Target } from 'lucide-react';
import { useImagineStore } from '@/store';
import { cn } from '@/lib/utils';
import { traceLayout, type TraceEdge, type TraceNode } from '@/lib/trace';

// ========================================
// Lien
// ========================================

function Flow({
  edge,
  dim,
  selected,
}: {
  edge: TraceEdge;
  dim: boolean;
  selected: boolean;
}) {
  const dx = Math.max(40, (edge.x2 - edge.x1) * 0.55);
  const d = `M ${edge.x1} ${edge.y1} C ${edge.x1 + dx} ${edge.y1}, ${edge.x2 - dx} ${edge.y2}, ${edge.x2} ${edge.y2}`;

  return (
    <g style={{ transition: 'opacity 320ms ease' }} opacity={dim ? 0.1 : selected ? 1 : 0.42}>
      {/* halo */}
      {selected && !dim && (
        <motion.path
          d={d}
          fill="none"
          stroke={edge.color}
          strokeWidth={5}
          strokeOpacity={0.16}
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
        strokeWidth={edge.kind === 'descent' && !edge.solid ? 1.2 : 2}
        strokeOpacity={edge.kind === 'descent' && !edge.solid ? 0.45 : 0.75}
        strokeDasharray={edge.kind === 'descent' && !edge.solid ? '4 5' : undefined}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.75, ease: 'easeOut' }}
      />
      {/* tête */}
      {edge.kind === 'fork' && !dim && (
        <circle cx={edge.x2} cy={edge.y2} r={3} fill={edge.color} opacity={selected ? 0.9 : 0.4} />
      )}
    </g>
  );
}

// ========================================
// Nœud
// ========================================

function Node({
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
  onClick: () => void;
}) {
  const eliminated = node.status === 'eliminated';
  const selected = node.status === 'selected';

  if (node.kind === 'spark') {
    return (
      <g
        style={{ transition: 'opacity 320ms ease' }}
        opacity={dim ? 0.2 : 1}
        onClick={onClick}
        className="cursor-pointer"
      >
        <motion.rect
          x={node.x}
          y={node.y}
          width={node.w}
          height={node.h}
          rx={16}
          fill="rgba(230,237,243,0.05)"
          stroke="rgba(230,237,243,0.32)"
          strokeWidth={1.2}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ transformOrigin: `${node.x + node.w / 2}px ${node.y + node.h / 2}px` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        <text
          x={node.x + 18}
          y={node.y + 28}
          fill="#E6EDF3"
          fontSize={14}
          fontWeight={500}
          className="select-none"
        >
          {node.title.length > 34 ? `${node.title.slice(0, 33)}…` : node.title}
        </text>
        <text
          x={node.x + 18}
          y={node.y + 50}
          fill="rgba(230,237,243,0.42)"
          fontSize={11}
          className="select-none"
        >
          étincelle
        </text>
      </g>
    );
  }

  if (node.kind === 'entry') {
    return (
      <g
        style={{ transition: 'opacity 320ms ease' }}
        opacity={dim ? 0.1 : eliminated ? 0.25 : active ? 1 : 0.66}
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
          rx={11}
          fill={`${node.color}0F`}
          stroke={`${node.color}33`}
          strokeWidth={1}
        />
        <circle cx={node.x + 14} cy={node.y + 15} r={3} fill={node.color} opacity={0.8} />
        <text
          x={node.x + 24}
          y={node.y + 19}
          fill="#C9D1D9"
          fontSize={10.5}
          className="select-none"
        >
          {node.title.length > 26 ? `${node.title.slice(0, 25)}…` : node.title}
        </text>
        {node.subtitle && (
          <text
            x={node.x + 14}
            y={node.y + 35}
            fill="rgba(139,148,158,0.8)"
            fontSize={9.5}
            className="select-none"
          >
            {node.subtitle.length > 30 ? `${node.subtitle.slice(0, 29)}…` : node.subtitle}
          </text>
        )}
      </g>
    );
  }

  return (
    <g
      style={{ transition: 'opacity 320ms ease' }}
      opacity={dim ? 0.12 : eliminated ? 0.3 : 1}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      className="cursor-pointer"
    >
      {selected && !dim && (
        <motion.rect
          x={node.x - 5}
          y={node.y - 5}
          width={node.w + 10}
          height={node.h + 10}
          rx={18}
          fill="none"
          stroke={node.color}
          strokeWidth={1.4}
          strokeOpacity={0.55}
          animate={{ strokeOpacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <motion.rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        rx={14}
        fill={`${node.color}14`}
        stroke={`${node.color}${active ? 'AA' : '55'}`}
        strokeWidth={active ? 1.6 : 1}
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        whileHover={{ x: 3 }}
      />

      {/* bande de couleur */}
      <rect x={node.x} y={node.y + 12} width={3} height={node.h - 24} rx={2} fill={node.color} />

      <text
        x={node.x + 16}
        y={node.y + 25}
        fill="#E6EDF3"
        fontSize={12.5}
        fontWeight={500}
        className="select-none"
      >
        {node.title.length > 26 ? `${node.title.slice(0, 25)}…` : node.title}
      </text>
      <text
        x={node.x + 16}
        y={node.y + 43}
        fill={node.color}
        fontSize={10}
        opacity={0.85}
        className="select-none"
      >
        {node.subtitle}
      </text>

      {selected && (
        <g transform={`translate(${node.x + node.w - 26} ${node.y + 12})`}>
          <Flag className="w-3.5 h-3.5" style={{ color: node.color }} />
        </g>
      )}
    </g>
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

  const [hoverPath, setHoverPath] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.82);
  const [pan, setPan] = useState({ x: 80, y: 0 });
  const dragging = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const layout = useMemo(() => (trace ? traceLayout(trace) : null), [trace]);

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
  const focus = hoverPath ?? activePathId;

  const dimmed = (n: TraceNode) => {
    if (!focus) return false;
    if (n.kind === 'spark') return false;
    return n.rootPathId !== focus;
  };

  const edgeDimmed = (e: TraceEdge) => {
    if (!focus) return false;
    return e.pathId !== focus;
  };

  const edgeSelected = (e: TraceEdge) =>
    chosenId !== null &&
    trace.paths.find((p) => p.id === chosenId)?.rootPathId === e.pathId;

  const handleNodeClick = (node: TraceNode) => {
    if (node.kind === 'spark') {
      setTraceStep(1);
      return;
    }
    if (node.pathId) {
      setActivePath(node.pathId);
      setTraceStep(node.depth === 0 && node.kind === 'path' ? 3 : 4);
    }
  };

  // Pan
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-pan]')) return;
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

  return (
    <div className="relative w-full h-full overflow-hidden bg-imagine-bg nebula-bg">
      <svg
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          {layout.edges.map((e) => (
            <Flow
              key={e.id}
              edge={e}
              dim={edgeDimmed(e)}
              selected={edgeSelected(e)}
            />
          ))}

          {layout.nodes.map((n) => (
            <Node
              key={n.id}
              node={n}
              dim={dimmed(n)}
              active={!!focus && n.rootPathId === focus}
              onEnter={() => setHoverPath(n.rootPathId)}
              onLeave={() => setHoverPath(null)}
              onClick={() => handleNodeClick(n)}
            />
          ))}
        </g>
      </svg>

      {/* Légende */}
      <div className="absolute top-4 left-4 flex items-center gap-3 rounded-xl glass px-3.5 py-2.5">
        <GitBranch className="w-4 h-4 text-imagine-projection" />
        <div className="text-xs text-imagine-text-muted leading-tight">
          <div className="text-imagine-text">{trace.paths.length} trajectoires</div>
          <div className="text-imagine-text-subtle">
            {trace.paths.reduce((n, p) => n + p.timeline.length, 0)} passages
            {trace.paths.some((p) => p.branches.length > 0) &&
              ` · ${trace.paths.reduce((n, p) => n + p.branches.length, 0)} virages`}
          </div>
        </div>
      </div>

      {/* Verdict */}
      {chosenId && (
        <div className="absolute top-4 right-4 flex items-center gap-2 rounded-xl glass px-3.5 py-2.5">
          <Target className="w-4 h-4 text-imagine-mature" />
          <div className="text-xs">
            <div className="text-imagine-text-muted">Retenu</div>
            <div
              className="font-medium"
              style={{
                color: trace.paths.find((p) => p.id === chosenId)?.color,
              }}
            >
              {trace.paths.find((p) => p.id === chosenId)?.title}
            </div>
          </div>
        </div>
      )}

      {/* Zoom */}
      <div
        data-no-pan
        className="absolute bottom-4 left-4 flex items-center gap-1 rounded-xl glass px-1.5 py-1.5"
      >
        <button
          onClick={() => setZoom((z) => Math.max(0.3, z - 0.12))}
          className="p-1.5 rounded-lg text-imagine-text-subtle hover:text-imagine-text hover:bg-white/5 transition-colors"
          title="Dézoomer"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-[11px] text-imagine-text-subtle tabular-nums w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(1.8, z + 0.12))}
          className="p-1.5 rounded-lg text-imagine-text-subtle hover:text-imagine-text hover:bg-white/5 transition-colors"
          title="Zoomer"
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
    </div>
  );
}