'use client';

// ========================================
// IMAGINE - Decision Switcher
// Plusieurs questions emmêlées. On en travaille une à la fois.
// On ne résout pas des questions différentes dans la même confrontation.
// ========================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Plus, Split } from 'lucide-react';
import { useImagineStore } from '@/store';
import { cn } from '@/lib/utils';
import { pathsOfDecision, weakestEvidence } from '@/lib/trace';

export default function DecisionSwitcher() {
  const trace = useImagineStore((s) => s.traces.find((t) => t.id === s.activeTraceId));
  const chooseDecision = useImagineStore((s) => s.chooseDecision);
  const addDecision = useImagineStore((s) => s.addDecision);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  if (!trace || trace.seedKind !== 'confusion' || trace.decisions.length === 0) {
    return null;
  }

  const current = trace.chosenDecisionId;
  const chosen = trace.decisions.find((d) => d.id === current) ?? null;

  const countFor = (id: string | null) => pathsOfDecision(trace, id).length;

  if (!chosen) return null;

  return (
    <div className="relative z-30">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-left hover:bg-white/[0.04] transition-colors"
      >
        <Split className="w-3.5 h-3.5 text-imagine-drift shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle">
            Décision travaillée
          </div>
          <div className="text-sm text-imagine-text truncate mt-0.5">
            {chosen.title}
          </div>
        </div>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-imagine-text-subtle shrink-0 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="absolute left-2 right-2 top-full mt-1 rounded-lg border border-white/10 bg-imagine-bg-elevated/95 backdrop-blur-md shadow-card-hover overflow-hidden z-40"
          >
            <div className="max-h-[320px] overflow-y-auto py-1">
              {trace.decisions.map((d) => {
                const active = d.id === current;
                const paths = countFor(d.id);
                const weak = paths > 0 ? weakestEvidence(pathsOfDecision(trace, d.id)) : null;

                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      chooseDecision(trace.id, d.id);
                      setOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2.5 transition-colors',
                      active ? 'bg-imagine-drift/10' : 'hover:bg-white/[0.04]'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span className="w-3.5 h-3.5 shrink-0 mt-0.5 flex items-center justify-center">
                        {active && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-1.5 h-1.5 rounded-full bg-imagine-drift"
                          />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            'text-sm leading-snug truncate',
                            active ? 'text-imagine-text' : 'text-imagine-text-muted'
                          )}
                        >
                          {d.title}
                        </div>
                        <div className="text-[10px] text-imagine-text-subtle mt-0.5">
                          {paths === 0
                            ? 'aucune trajectoire'
                            : `${paths} trajectoire${paths > 1 ? 's' : ''}${
                                weak ? ` · ${weak.label}` : ''
                              }`}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-white/5 p-1.5">
              {adding ? (
                <div className="flex gap-1.5">
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && draft.trim()) {
                        addDecision(trace.id, draft);
                        setDraft('');
                        setAdding(false);
                      }
                      if (e.key === 'Escape') setAdding(false);
                    }}
                    placeholder="Une question que le moteur n'a pas vue"
                    className="flex-1 bg-imagine-bg/60 border border-white/10 rounded-md px-2 py-1.5 text-xs text-imagine-text outline-none focus:border-imagine-drift/50"
                  />
                  <button
                    onClick={() => {
                      if (draft.trim()) {
                        addDecision(trace.id, draft);
                        setDraft('');
                      }
                      setAdding(false);
                    }}
                    className="px-2 py-1.5 rounded-md bg-imagine-drift/15 text-imagine-drift text-xs hover:bg-imagine-drift/25 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-imagine-text-subtle hover:text-imagine-text hover:bg-white/5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Il y en a une autre
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}