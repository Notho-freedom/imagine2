'use client';

// ========================================
// IMAGINE - Projection Board
// Le moteur de décision, de l'étincelle au tracé
// ========================================

import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { useImagineStore } from '@/store';
import { useTrace } from '@/hooks/useTrace';
import { cn } from '@/lib/utils';
import { TRACE_STEPS, isStepReachable, isStepSatisfied } from '@/lib/trace';
import type { ThoughtTrace } from '@/types';

import IntakeStep from './IntakeStep';
import ReadingStep from './ReadingStep';
import ProjectionStep from './ProjectionStep';
import DescentStep from './DescentStep';
import ConfrontationStep from './ConfrontationStep';
import VerdictStep from './VerdictStep';
import LedgerStep from './LedgerStep';
import HypothesisBar from './HypothesisBar';
import { StepMark } from './marks';
import { Button, Empty, Tag } from './ui';

export default function ProjectionBoard() {
  const step = useImagineStore((s) => s.ui.traceStep);
  const toggleSidebar = useImagineStore((s) => s.toggleSidebar);
  const {
    trace,
    traces,
    pending,
    error,
    setStep,
    createTrace,
    setActiveTrace,
    deleteTrace,
    read,
    project,
  } = useTrace();

  // Navigation clavier entre les étapes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;

      const target = useImagineStore.getState();
      const delta = e.key === 'ArrowRight' ? 1 : -1;
      const next = Math.max(1, Math.min(7, target.ui.traceStep + delta));
      const meta = TRACE_STEPS.find((s) => s.index === next);
      const current = target.getActiveTrace();

      if (meta && current && isStepReachable(current, meta.kind)) {
        e.preventDefault();
        target.setTraceStep(next);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const current = TRACE_STEPS.find((s) => s.index === step) ?? TRACE_STEPS[0];

  const content = useMemo(() => {
    switch (current.kind) {
      case 'intake':
        return <IntakeStep onRead={read} />;
      case 'reading':
        return (
          <ReadingStep
            pending={pending}
            error={error}
            onProject={() => project(4)}
            onRead={() => read()}
          />
        );
      case 'projection':
        return <ProjectionStep />;
      case 'descent':
        return <DescentStep />;
      case 'confrontation':
        return <ConfrontationStep />;
      case 'verdict':
        return <VerdictStep />;
      case 'ledger':
        return <LedgerStep />;
    }
  }, [current.kind, pending, error, read, project]);

  if (!trace) {
    return (
      <div className="w-full h-full overflow-y-auto bg-imagine-bg">
        <div className="max-w-4xl mx-auto pt-20">
          {traces.length > 0 && (
            <div className="mb-14 space-y-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle px-1">
                Tracés existants
              </div>
              <div className="space-y-2">
                {traces.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTrace(t.id)}
                    className="w-full text-left rounded-xl border border-white/5 bg-imagine-surface/50 px-4 py-3.5 hover:border-white/15 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm text-imagine-text truncate">{t.title}</div>
                        <div className="text-xs text-imagine-text-subtle mt-1 truncate">
                          {t.spark || 'Idée non posée'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {t.status === 'arbitrated' && <Tag color="#34D399">tranché</Tag>}
                        <span className="text-[11px] text-imagine-text-subtle tabular-nums">
                          {t.paths.length} traj.
                        </span>
                        <Trash2
                          className="w-3.5 h-3.5 text-imagine-text-subtle opacity-0 group-hover:opacity-100 hover:text-imagine-forge transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTrace(t.id);
                          }}
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <Empty
            title="Un tracé commence par une idée"
            action={
              <Button variant="primary" onClick={() => createTrace()}>
                <Plus className="w-4 h-4" />
                Nouveau tracé
              </Button>
            }
          >
            Tu avances une idée. Le moteur la lit, te rend ce qu&apos;il a compris, projette les
            trajectoires possibles, t&apos;aide à descendre dans chacune, puis tranche. Tu repars avec
            une décision et sa chaîne complète.
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex bg-imagine-bg">
      {/* Rail d'étapes */}
      <nav className="w-[240px] shrink-0 border-r border-white/5 flex flex-col">
        <div className="px-5 py-6 border-b border-white/5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-imagine-text-subtle">
            Tracé
          </div>
          <div className="mt-2 text-sm text-imagine-text leading-snug line-clamp-2">
            {trace.title}
          </div>
        </div>

        <div className="flex-1 py-4 space-y-1 overflow-y-auto">
          {TRACE_STEPS.map((s) => {
            const reachable = isStepReachable(trace, s.kind);
            const satisfied = isStepSatisfied(trace, s.kind);
            const active = s.index === step;
            const passed = s.index < step && satisfied;

            return (
              <button
                key={s.kind}
                disabled={!reachable}
                onClick={() => setStep(s.index)}
                className={cn(
                  'w-full text-left px-3 py-2.5 transition-all relative group rounded-lg',
                  active && 'bg-white/[0.04]',
                  !reachable && 'opacity-25 cursor-not-allowed'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="step-marker"
                    className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-imagine-projection"
                    style={{ boxShadow: '0 0 12px rgba(79,209,197,0.7)' }}
                  />
                )}

                <div className="flex items-start gap-3">
                  {/* La marque de l'étape */}
                  <div
                    className={cn(
                      'shrink-0 mt-0.5 transition-all',
                      active && 'scale-110'
                    )}
                    style={{
                      color: active
                        ? '#4FD1C5'
                        : passed
                          ? 'rgba(52,211,153,0.7)'
                          : 'rgba(139,148,158,0.6)',
                      filter: active ? 'drop-shadow(0 0 8px rgba(79,209,197,0.6))' : undefined,
                    }}
                  >
                    <StepMark kind={s.kind} size={active ? 24 : 20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          'text-[10px] tabular-nums shrink-0',
                          active ? 'text-imagine-projection' : 'text-imagine-text-subtle/60'
                        )}
                      >
                        {String(s.index).padStart(2, '0')}
                      </span>
                      <span
                        className={cn(
                          'text-sm leading-tight',
                          active
                            ? 'text-imagine-text'
                            : passed
                              ? 'text-imagine-text-muted'
                              : 'text-imagine-text-muted group-hover:text-imagine-text'
                        )}
                      >
                        {s.label}
                      </span>
                    </div>
                    <p
                      className={cn(
                        'text-[11px] mt-0.5 leading-snug',
                        active ? 'text-imagine-text-subtle' : 'text-imagine-text-subtle/50'
                      )}
                    >
                      {s.question}
                    </p>
                  </div>

                  {passed && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-1.5 h-1.5 rounded-full bg-imagine-coherence shrink-0 mt-1.5"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-3 border-t border-white/5 space-y-2">
          <Button variant="quiet" className="w-full" onClick={() => createTrace()}>
            <Plus className="w-4 h-4" />
            Nouveau
          </Button>
          {traces.length > 1 && (
            <select
              value={trace.id}
              onChange={(e) => setActiveTrace(e.target.value)}
              className="w-full bg-imagine-bg-elevated/80 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-imagine-text-muted outline-none"
            >
              {traces.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title.slice(0, 32)}
                </option>
              ))}
            </select>
          )}
        </div>
      </nav>

      {/* Contenu */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-8 h-16 bg-imagine-bg/85 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-3.5 min-w-0">
            <motion.span
              key={current.kind}
              initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.35, ease: 'backOut' }}
              className="shrink-0"
              style={{ color: '#4FD1C5', filter: 'drop-shadow(0 0 10px rgba(79,209,197,0.45))' }}
            >
              <StepMark kind={current.kind} size={22} strokeWidth={1.4} />
            </motion.span>

            <div className="min-w-0">
              <div className="flex items-baseline gap-2.5">
                <span className="text-[10px] tabular-nums text-imagine-projection/70">
                  {String(current.index).padStart(2, '0')}
                </span>
                <h1 className="text-sm font-medium text-imagine-text tracking-wide">
                  {current.label}
                </h1>
              </div>
              <p className="text-[11px] text-imagine-text-subtle truncate">{current.question}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {trace.status === 'arbitrated' && <Tag color="#34D399">tranché</Tag>}
            <button
              onClick={toggleSidebar}
              className="px-2 py-1 text-imagine-text-subtle hover:text-imagine-text transition-colors"
              title="Basculer vers la carte"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.kind}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="px-8 pb-24"
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </main>

      <HypothesisBar />
    </div>
  );
}
