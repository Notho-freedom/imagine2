'use client';

// ========================================
// IMAGINE - Trace Palette
// ⌘K — se déplacer dans le tracé, pas dans un canvas
// ========================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CornerDownLeft,
  Download,
  GitBranch,
  Network,
  ListTree,
  Search,
  Trash2,
} from 'lucide-react';
import { useImagineStore } from '@/store';
import { useTrace } from '@/hooks/useTrace';
import { cn } from '@/lib/utils';
import { TRACE_STEPS, downloadTrace, pathEvidence } from '@/lib/trace';
import { StepMark } from './marks';

interface Command {
  id: string;
  label: string;
  hint?: string;
  kind: 'step' | 'action' | 'path' | 'trace';
  color?: string;
  run: () => void;
  mark?: React.ReactNode;
}

export default function TracePalette() {
  const open = useImagineStore((s) => s.ui.commandPaletteOpen);
  const setOpen = useImagineStore((s) => s.setCommandPaletteOpen);
  const trace = useImagineStore((s) => s.traces.find((t) => t.id === s.activeTraceId));
  const traces = useImagineStore((s) => s.traces);
  const setActiveTrace = useImagineStore((s) => s.setActiveTrace);
  const setTraceStep = useImagineStore((s) => s.setTraceStep);
  const setActivePath = useImagineStore((s) => s.setActivePath);
  const setView = useImagineStore((s) => s.setView);
  const setMapKind = useImagineStore((s) => s.setMapKind);
  const deleteTrace = useImagineStore((s) => s.deleteTrace);
  const createTrace = useImagineStore((s) => s.createTrace);
  const { descend, confront, arbitrate, commit } = useTrace();

  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
    }
  }, [open]);

  const close = useCallback(() => setOpen(false), [setOpen]);

  const commands = useMemo<Command[]>(() => {
    const list: Command[] = [];

    TRACE_STEPS.forEach((s) => {
      list.push({
        id: `step-${s.kind}`,
        kind: 'step',
        label: s.label,
        hint: s.question,
        mark: <StepMark kind={s.kind} size={18} />,
        run: () => {
          if (trace) setTraceStep(s.index);
          close();
        },
      });
    });

    if (trace) {
      list.push(
        {
          id: 'view-flux',
          kind: 'action',
          label: 'Aller au flux',
          hint: 'la carte du tracé',
          mark: <Network className="w-4 h-4" />,
          run: () => {
            setView('map');
            setMapKind('trace');
            close();
          },
        },
        {
          id: 'view-plan',
          kind: 'action',
          label: 'Aller au plan',
          hint: 'lire le tracé',
          mark: <ListTree className="w-4 h-4" />,
          run: () => {
            setView('map');
            setMapKind('board');
            close();
          },
        },
        {
          id: 'export',
          kind: 'action',
          label: 'Exporter le tracé',
          mark: <Download className="w-4 h-4" />,
          run: () => {
            downloadTrace(trace);
            close();
          },
        },
        {
          id: 'new',
          kind: 'action',
          label: 'Nouveau tracé',
          mark: <GitBranch className="w-4 h-4" />,
          run: () => {
            createTrace();
            setView('projection');
            close();
          },
        }
      );

      if (trace.paths.length > 1) {
        list.push({
          id: 'confront',
          kind: 'action',
          label: 'Confronter les trajectoires',
          mark: <StepMark kind="confrontation" size={18} />,
          run: () => {
            setTraceStep(5);
            void confront();
            close();
          },
        });
      }

      if (trace.verdict) {
        list.push({
          id: 'arbitrate',
          kind: 'action',
          label: 'Arbitrer à nouveau',
          mark: <StepMark kind="verdict" size={18} />,
          run: () => {
            setTraceStep(6);
            void arbitrate();
            close();
          },
        });
        if (trace.status !== 'arbitrated') {
          list.push({
            id: 'commit',
            kind: 'action',
            label: 'Valider la décision',
            mark: <StepMark kind="ledger" size={18} />,
            run: () => {
              commit();
              close();
            },
          });
        }
      }

      trace.paths
        .filter((p) => p.status !== 'eliminated')
        .forEach((p) => {
          list.push({
            id: `path-${p.id}`,
            kind: 'path',
            label: p.title,
            hint: `${pathEvidence(p).label} · ${p.timeline.length} passage${p.timeline.length > 1 ? 's' : ''}`,
            color: p.color,
            mark: (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: p.color }}
              />
            ),
            run: () => {
              setActivePath(p.id);
              setTraceStep(4);
              close();
            },
          });
        });
    }

    traces
      .filter((t) => t.id !== trace?.id)
      .forEach((t) => {
        list.push({
          id: `trace-${t.id}`,
          kind: 'trace',
          label: t.title,
          hint: `${t.paths.length} trajectoire${t.paths.length > 1 ? 's' : ''}`,
          mark: <GitBranch className="w-4 h-4" />,
          run: () => {
            setActiveTrace(t.id);
            close();
          },
        });
      });

    if (trace) {
      list.push({
        id: 'delete-trace',
        kind: 'trace',
        label: `Supprimer « ${trace.title} »`,
        color: '#F87171',
        mark: <Trash2 className="w-4 h-4" />,
        run: () => {
          deleteTrace(trace.id);
          close();
        },
      });
    }

    return list;
  }, [
    trace,
    traces,
    setTraceStep,
    setView,
    setMapKind,
    deleteTrace,
    createTrace,
    setActiveTrace,
    setActivePath,
    confront,
    arbitrate,
    commit,
    close,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.hint ?? '').toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(filtered.length - 1, c + 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      filtered[cursor]?.run();
    }
  };

  const grouped: Array<{ label: string; items: Command[] }> = [];
  const labelFor: Record<Command['kind'], string> = {
    step: 'Parcours',
    action: 'Actions',
    path: trace ? 'Trajectoires' : '',
    trace: 'Tracés',
  };
  filtered.forEach((c) => {
    const label = labelFor[c.kind];
    if (!label) {
      grouped.push({ label: '', items: [c] });
      return;
    }
    const last = grouped[grouped.length - 1];
    if (last && last.label === label) last.items.push(c);
    else grouped.push({ label, items: [c] });
  });

  let flat = -1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.14 }}
        className="fixed inset-0 z-50 bg-imagine-bg/70 backdrop-blur-sm flex items-start justify-center pt-[14vh]"
        onClick={close}
      >
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={onKeyDown}
          className="w-[min(620px,calc(100vw-2rem))] rounded-2xl glass overflow-hidden shadow-card-hover"
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
            <Search className="w-4 h-4 text-imagine-text-subtle shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Où veux-tu aller ?"
              className="flex-1 bg-transparent text-imagine-text outline-none placeholder:text-imagine-text-subtle"
            />
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-imagine-text-subtle">
              Échap
            </kbd>
          </div>

          <div className="max-h-[52vh] overflow-y-auto py-2">
            {filtered.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-imagine-text-subtle">
                Rien pour «&nbsp;{query}&nbsp;».
              </p>
            )}

            {grouped.map((group, gi) => (
              <div key={`${group.label}-${gi}`}>
                {group.label && (
                  <div className="px-5 pt-3 pb-1.5 text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle/70">
                    {group.label}
                  </div>
                )}
                {group.items.map((c) => {
                  flat += 1;
                  const idx = flat;
                  const active = idx === cursor;
                  return (
                    <button
                      key={c.id}
                      onMouseEnter={() => setCursor(idx)}
                      onClick={c.run}
                      className={cn(
                        'w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors',
                        active ? 'bg-white/[0.06]' : ''
                      )}
                    >
                      <span
                        className="shrink-0 w-5 flex justify-center"
                        style={{ color: c.color ?? '#8B949E' }}
                      >
                        {c.mark}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span
                          className={cn(
                            'text-sm block truncate',
                            c.color === '#F87171'
                              ? 'text-imagine-forge'
                              : 'text-imagine-text'
                          )}
                        >
                          {c.label}
                        </span>
                        {c.hint && (
                          <span className="text-[11px] text-imagine-text-subtle block truncate">
                            {c.hint}
                          </span>
                        )}
                      </span>
                      {active && (
                        <CornerDownLeft className="w-3.5 h-3.5 text-imagine-text-subtle shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}