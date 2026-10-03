'use client';

// ========================================
// IMAGINE - Trace Outline
// Le même tracé, lu au calme : une table des matières.
// On y cherche, on y nettoie, on y corrige.
// ========================================

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Circle,
  EyeOff,
  GitBranch,
  Search,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useImagineStore } from '@/store';
import { cn } from '@/lib/utils';
import { pathEvidence, deliberationOf, formatDuration } from '@/lib/trace';
import { Button } from '@/components/projection/ui';
import type { ThoughtPath } from '@/types';

const STATUS_COLOR: Record<ThoughtPath['status'], string> = {
  open: '#8B949E',
  explored: '#60A5FA',
  eliminated: '#4A5058',
  retained: '#34D399',
  selected: '#34D399',
};

function PathRow({
  path,
  depth,
  all,
  expanded,
  toggle,
  onOpen,
  onEliminate,
  onRestore,
  onDelete,
}: {
  path: ThoughtPath;
  depth: number;
  all: ThoughtPath[];
  expanded: Set<string>;
  toggle: (id: string) => void;
  onOpen: (id: string) => void;
  onEliminate: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const children = all.filter((p) => p.parentPathId === path.id);
  const isOpen = expanded.has(path.id);
  const ev = pathEvidence(path);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="group flex items-start gap-2.5 py-2 pr-2 rounded-lg hover:bg-white/[0.03] transition-colors"
        style={{ paddingLeft: depth * 22 + 8 }}
      >
        {children.length > 0 ? (
          <button
            onClick={() => toggle(path.id)}
            className="mt-0.5 w-4 h-4 shrink-0 flex items-center justify-center text-imagine-text-subtle hover:text-imagine-text transition-colors"
          >
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: path.color }} />
        )}

        <button onClick={() => onOpen(path.id)} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'text-sm',
                path.status === 'eliminated'
                  ? 'text-imagine-text-subtle line-through'
                  : 'text-imagine-text'
              )}
            >
              {path.title}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{
                color: STATUS_COLOR[path.status],
                background: `${STATUS_COLOR[path.status]}18`,
              }}
            >
              {path.status}
            </span>
            {ev.band >= 12 && (
              <span className="text-[10px] text-imagine-text-subtle tabular-nums">
                ±{ev.band}
              </span>
            )}
          </div>

          <p className="text-xs text-imagine-text-subtle mt-0.5 leading-relaxed line-clamp-2">
            {path.thesis}
          </p>

          {path.timeline.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {path.timeline.map((e, i) => (
                <li
                  key={e.id}
                  className="text-[11px] text-imagine-text-subtle/80 flex gap-2 leading-snug"
                >
                  <span className="tabular-nums shrink-0 w-4 text-right opacity-60">
                    {i + 1}
                  </span>
                  <span className="min-w-0">{e.question}</span>
                  {e.wall && (
                    <span className="text-imagine-forge/70 shrink-0" title={e.wall}>
                      ▪ mur
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {path.branches.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {path.branches.map((b) => (
                <li key={b.id} className="text-[11px] text-imagine-drift/80 leading-snug">
                  ↳ {b.question}
                  {b.costOfChoice && (
                    <span className="text-imagine-text-subtle"> — {b.costOfChoice}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </button>

        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {path.status === 'eliminated' ? (
            <button
              onClick={() => onRestore(path.id)}
              title="Rétablir"
              className="p-1 rounded text-imagine-text-subtle hover:text-imagine-text transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => onEliminate(path.id)}
              title="Écarter"
              className="p-1 rounded text-imagine-text-subtle hover:text-imagine-text transition-colors"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onDelete(path.id)}
            title="Supprimer définitivement"
            className="p-1 rounded text-imagine-text-subtle hover:text-imagine-forge transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen &&
          children.map((c) => (
            <PathRow
              key={c.id}
              path={c}
              depth={depth + 1}
              all={all}
              expanded={expanded}
              toggle={toggle}
              onOpen={onOpen}
              onEliminate={onEliminate}
              onRestore={onRestore}
              onDelete={onDelete}
            />
          ))}
      </AnimatePresence>
    </>
  );
}

export default function TraceOutline() {
  const trace = useImagineStore((s) => s.traces.find((t) => t.id === s.activeTraceId));
  const setActivePath = useImagineStore((s) => s.setActivePath);
  const setTraceStep = useImagineStore((s) => s.setTraceStep);
  const setPathStatus = useImagineStore((s) => s.setPathStatus);
  const deletePath = useImagineStore((s) => s.deletePath);
  const deleteTrace = useImagineStore((s) => s.deleteTrace);
  const chooseDecision = useImagineStore((s) => s.chooseDecision);

  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!trace) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-imagine-bg">
        <p className="text-sm text-imagine-text-subtle">Aucun tracé.</p>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const matches = (p: ThoughtPath): boolean =>
    !q ||
    p.title.toLowerCase().includes(q) ||
    p.thesis.toLowerCase().includes(q) ||
    p.timeline.some(
      (e) => e.question.toLowerCase().includes(q) || e.analysis.toLowerCase().includes(q)
    );

  const visible = q
    ? trace.paths.filter(
        (p) =>
          matches(p) ||
          trace.paths.some((c) => c.parentPathId === p.id && matches(c))
      )
    : trace.paths;

  const d = deliberationOf(trace);

  const toggle = (id: string) =>
    setExpanded((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /**
   * Les questions d'un seul tracé, pour ne pas mélanger ce qui répond à
   * des questions différentes dans la même lecture.
   */
  const groups: Array<{ id: string | null; label: string; paths: ThoughtPath[] }> = [];
  const order: Array<string | null> = [];
  trace.decisions.forEach((dec) => {
    if (!order.includes(dec.id)) order.push(dec.id);
  });
  order.forEach((id) => {
    groups.push({
      id,
      label: trace.decisions.find((x) => x.id === id)?.title ?? String(id),
      paths: visible.filter((p) => p.decisionId === id),
    });
  });
  const unassigned = visible.filter((p) => !order.includes(p.decisionId ?? null));
  if (unassigned.length) {
    groups.push({
      id: null,
      label: trace.seedKind === 'confusion' ? 'Non rattachées' : 'Trajectoires',
      paths: unassigned,
    });
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-imagine-bg">
      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* Tête */}
        <div className="flex items-start justify-between gap-6 flex-wrap mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-light text-imagine-text leading-snug">
              {trace.title}
            </h1>
            <p className="text-sm text-imagine-text-subtle mt-1.5 leading-relaxed">
              {trace.spark || 'Idée non posée'}
            </p>
            <div className="flex items-center gap-3 mt-3 text-[11px] text-imagine-text-subtle">
              <span>{formatDuration(d.totalMs)} de réflexion</span>
              <span>·</span>
              <span>{d.descentes} passages</span>
              <span>·</span>
              <span>{d.hypotheses} hypothèses</span>
              {trace.status === 'arbitrated' && (
                <>
                  <span>·</span>
                  <span className="text-imagine-mature">tranché</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setActivePath(null);
                setTraceStep(4);
              }}
              disabled={trace.paths.length === 0}
            >
              <GitBranch className="w-4 h-4" />
              Descendre
            </Button>

            {confirmDelete ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-imagine-forge/40 px-2 py-1">
                <span className="text-[11px] text-imagine-forge">Supprimer&nbsp;?</span>
                <button
                  onClick={() => {
                    deleteTrace(trace.id);
                    setConfirmDelete(false);
                  }}
                  className="px-2 py-1 rounded-md bg-imagine-forge/15 text-imagine-forge text-[11px] hover:bg-imagine-forge/25 transition-colors"
                >
                  Oui
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 rounded-md text-imagine-text-subtle text-[11px] hover:bg-white/5 transition-colors"
                >
                  Non
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-imagine-text-subtle hover:text-imagine-forge hover:bg-imagine-forge/10 transition-colors"
                title="Supprimer ce tracé"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            )}
          </div>
        </div>

        {/* Recherche */}
        <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-imagine-surface/50 px-4 py-2.5 mb-6">
          <Search className="w-4 h-4 text-imagine-text-subtle shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher dans le tracé"
            className="flex-1 bg-transparent text-sm text-imagine-text outline-none placeholder:text-imagine-text-subtle"
          />
          {q && (
            <span className="text-[11px] text-imagine-text-subtle">
              {visible.length} trouvé{visible.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {trace.paths.length === 0 ? (
          <p className="text-sm text-imagine-text-subtle py-10 text-center">
            Aucune trajectoire. Posez une idée, ou pressez H pour une hypothèse.
          </p>
        ) : (
          <div className="space-y-8">
            {groups
              .filter((g) => g.paths.length > 0)
              .map((g) => {
                const roots = g.paths.filter((p) => p.parentPathId === null);
                const isCurrent = g.id === trace.chosenDecisionId;

                return (
                  <section key={g.id ?? 'none'}>
                    {trace.decisions.length > 1 && (
                      <button
                        onClick={() => g.id && chooseDecision(trace.id, g.id)}
                        className="w-full flex items-center gap-2.5 mb-2.5 text-left group"
                      >
                        <span
                          className={cn(
                            'text-[11px] uppercase tracking-[0.16em]',
                            isCurrent ? 'text-imagine-drift' : 'text-imagine-text-subtle'
                          )}
                        >
                          {g.label}
                        </span>
                        <span className="text-[10px] text-imagine-text-subtle/60">
                          {g.paths.length} traj.
                        </span>
                        {!isCurrent && g.id && (
                          <span className="text-[10px] text-imagine-text-subtle/0 group-hover:text-imagine-text-subtle transition-colors">
                            travailler
                          </span>
                        )}
                      </button>
                    )}

                    <div className="space-y-0.5">
                      {roots.map((p) => (
                        <PathRow
                          key={p.id}
                          path={p}
                          depth={0}
                          all={g.paths}
                          expanded={expanded}
                          toggle={toggle}
                          onOpen={(id) => {
                            setActivePath(id);
                            setTraceStep(4);
                          }}
                          onEliminate={(id) => setPathStatus(trace.id, id, 'eliminated')}
                          onRestore={(id) =>
                            setPathStatus(
                              trace.id,
                              id,
                              trace.paths.find((x) => x.id === id)?.timeline.length
                                ? 'explored'
                                : 'open'
                            )
                          }
                          onDelete={(id) => deletePath(trace.id, id)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}

            {visible.length === 0 && q && (
              <p className="text-sm text-imagine-text-subtle py-8 text-center">
                Rien ne correspond à «&nbsp;{query}&nbsp;».
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}