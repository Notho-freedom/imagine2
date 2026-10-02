'use client';

// ========================================
// IMAGINE - Criteria Editor
// Les critères sont une conviction, pas une vérité.
// L'utilisateur les pèse avant de laisser noter.
// ========================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Plus,
  RotateCcw,
  Scale,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { useImagineStore } from '@/store';
import { cn } from '@/lib/utils';
import {
  WEIGHT_MIN,
  WEIGHT_MAX,
  WEIGHT_STEP,
  DEFAULT_CRITERIA,
  normalizeWeight,
  criterionDirection,
} from '@/lib/trace';
import type { ComparisonCriterion } from '@/types';

function weightLabel(w: number): string {
  const n = normalizeWeight(w);
  if (n === 1) return 'normal';
  if (n >= 2) return `×${n}`;
  if (n <= 0.6) return `marginal`;
  return `×${String(n).replace('.', ',')}`;
}

export default function CriteriaEditor() {
  const trace = useImagineStore((s) => s.traces.find((t) => t.id === s.activeTraceId));
  const { addCriterion, updateCriterion, removeCriterion, resetCriteria } = useImagineStore();

  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  if (!trace) return null;

  const criteria = trace.criteria ?? [];
  const active = criteria.filter((c) => c.enabled);
  const userOwned = criteria.some((c) => c.origin === 'user');
  const dirty = criteria.some((c, i) => {
    const d = DEFAULT_CRITERIA[i];
    return !d || c.weight !== 1 || !c.enabled;
  });

  const submit = () => {
    const v = draft.trim();
    if (!v) {
      setAdding(false);
      return;
    }
    addCriterion(trace.id, v);
    setDraft('');
    setAdding(false);
  };

  const setWeight = (c: ComparisonCriterion, delta: number) => {
    const next = Math.round((normalizeWeight(c.weight) + delta) * 10) / 10;
    updateCriterion(trace.id, c.key, { weight: next });
  };

  return (
    <Panelish>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-colors border',
            open
              ? 'border-imagine-spark/40 bg-imagine-spark/10 text-imagine-spark'
              : 'border-white/10 text-imagine-text-muted hover:text-imagine-text hover:border-white/20'
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Ce qui compte
          <span className="text-[10px] tabular-nums px-1.5 py-0.5 rounded bg-white/5">
            {active.length}/{criteria.length}
          </span>
        </button>

        {/* Aperçu des poids */}
        <div className="flex flex-wrap items-center gap-1.5">
          {active.map((c) => (
            <span
              key={c.key}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] bg-white/[0.04] border border-white/5"
            >
              <span className="text-imagine-text-muted">{c.label}</span>
              <span
                className={cn(
                  'tabular-nums text-[10px]',
                  normalizeWeight(c.weight) === 1
                    ? 'text-imagine-text-subtle'
                    : 'text-imagine-spark'
                )}
              >
                {weightLabel(c.weight)}
              </span>
            </span>
          ))}
          {active.length === 0 && (
            <span className="text-[11px] text-imagine-forge">
              Aucun critère actif — les cinq par défaut seront utilisés.
            </span>
          )}
        </div>

        {(dirty || userOwned) && (
          <button
            onClick={() => resetCriteria(trace.id)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] text-imagine-text-subtle hover:text-imagine-text hover:bg-white/5 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Rétablir
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-white/5 space-y-1">
              <p className="text-[11px] text-imagine-text-subtle leading-relaxed pb-2">
                Un poids double compte double dans le total. Les poids ne changent pas les notes,
                seulement le classement final — et ce classement est calculé ici, jamais par le
                moteur.
              </p>

              {criteria.map((c) => {
                const lower = criterionDirection(c) === 'lower';
                return (
                  <div
                    key={c.key}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                      c.enabled ? 'bg-white/[0.02]' : 'opacity-40'
                    )}
                  >
                    <button
                      onClick={() => updateCriterion(trace.id, c.key, { enabled: !c.enabled })}
                      title={c.enabled ? 'Retirer ce critère' : 'Réactiver'}
                      className={cn(
                        'w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors',
                        c.enabled
                          ? 'border-imagine-spark bg-imagine-spark/20 text-imagine-spark'
                          : 'border-white/15 text-transparent'
                      )}
                    >
                      <Check className="w-3 h-3" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-imagine-text">{c.label}</span>
                        {lower && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-imagine-text-subtle"
                            title="Pour ce critère, moins vaut mieux"
                          >
                            moins c&apos;est mieux
                          </span>
                        )}
                        {c.origin === 'user' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-imagine-spark/15 text-imagine-spark">
                            à toi
                          </span>
                        )}
                      </div>
                      {c.description && (
                        <div className="text-[11px] text-imagine-text-subtle mt-0.5 leading-snug">
                          {c.description}
                        </div>
                      )}
                    </div>

                    {/* Poids */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setWeight(c, -WEIGHT_STEP)}
                        disabled={normalizeWeight(c.weight) <= WEIGHT_MIN}
                        className="w-6 h-6 rounded-md text-imagine-text-subtle hover:text-imagine-text hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
                      >
                        −
                      </button>
                      <span className="w-16 text-center text-[11px] tabular-nums text-imagine-text-muted">
                        {weightLabel(c.weight)}
                      </span>
                      <button
                        onClick={() => setWeight(c, WEIGHT_STEP)}
                        disabled={normalizeWeight(c.weight) >= WEIGHT_MAX}
                        className="w-6 h-6 rounded-md text-imagine-text-subtle hover:text-imagine-text hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeCriterion(trace.id, c.key)}
                      title="Retirer ce critère"
                      className="w-6 h-6 rounded-md flex items-center justify-center text-imagine-text-subtle hover:text-imagine-forge hover:bg-imagine-forge/10 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {/* Ajout */}
              {adding ? (
                <div className="flex gap-2 px-3 pt-2">
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submit();
                      if (e.key === 'Escape') {
                        setDraft('');
                        setAdding(false);
                      }
                    }}
                    placeholder="Reversibilité, image de marque, dépendance à une personne…"
                    className="flex-1 bg-imagine-bg/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-imagine-text outline-none focus:border-imagine-spark/50"
                  />
                  <button
                    onClick={submit}
                    className="px-3 py-2 rounded-lg text-xs bg-imagine-spark/15 text-imagine-spark hover:bg-imagine-spark/25 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setDraft('');
                      setAdding(false);
                    }}
                    className="px-2 py-2 rounded-lg text-xs text-imagine-text-subtle hover:text-imagine-text transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  className="flex items-center gap-1.5 px-3 pt-3 text-xs text-imagine-text-subtle hover:text-imagine-text transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Un critère que je prends en compte
                </button>
              )}

              {criteria.length === 0 && (
                <p className="text-[11px] text-imagine-forge px-3 pt-2">
                  Tous les critères ont été retirés. Les cinq par défaut serviront à la
                  confrontation, mais tes notes seront perdues.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Panelish>
  );
}

function Panelish({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-imagine-surface/50 px-4 py-3">
      {children}
    </div>
  );
}
