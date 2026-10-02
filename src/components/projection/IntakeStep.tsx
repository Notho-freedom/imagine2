'use client';

// ========================================
// IMAGINE - Intake Step
// L'étincelle : ce que l'utilisateur avance
// ========================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useImagineStore } from '@/store';
import { cn } from '@/lib/utils';
import { Button, Panel } from './ui';

export default function IntakeStep({ onRead }: { onRead: () => void }) {
  const { activeTraceId, updateTrace, setTraceStep } = useImagineStore();
  const trace = useImagineStore((s) => s.traces.find((t) => t.id === s.activeTraceId));
  const [busy, setBusy] = useState(false);

  if (!trace) return null;

  const setField = (field: 'spark' | 'context' | 'horizon', value: string) =>
    updateTrace(trace.id, { [field]: value });

  const handleRead = async () => {
    if (!trace.spark.trim()) return;
    setBusy(true);
    onRead();
    setBusy(false);
  };

  const canRead = trace.spark.trim().length > 8;

  return (
    <div className="max-w-3xl mx-auto space-y-10 py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="space-y-3"
      >
        <h1 className="text-3xl font-light text-imagine-text leading-tight">
          Qu&apos;est-ce que tu advances&nbsp;?
        </h1>
        <p className="text-sm text-imagine-text-subtle leading-relaxed max-w-xl">
          Pose l&apos;idée telle qu&apos;elle vient. Elle n&apos;a pas besoin d&apos;être claire — c&apos;est le moteur qui
          va la lire, la déplier, et te montrer ce qu&apos;il a compris.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
      >
        <textarea
          autoFocus
          value={trace.spark}
          onChange={(e) => setField('spark', e.target.value)}
          placeholder="Je crois que… / Je veux décider si… / Ce qui me bloque, c'est…"
          className="w-full min-h-[180px] rounded-xl border border-white/5 bg-imagine-surface/60 px-5 py-4 text-lg text-imagine-text leading-relaxed outline-none resize-y placeholder:text-imagine-text-subtle focus:border-imagine-projection/40 transition-colors"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.18, ease: 'easeOut' }}
        className="grid gap-4 sm:grid-cols-2"
      >
        <Panel className="p-4 space-y-2">
          <label className="text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle">
            Contexte
          </label>
          <textarea
            value={trace.context}
            onChange={(e) => setField('context', e.target.value)}
            placeholder="Ce qui entoure l'idée. L'état du monde, les gens concernés, ce qui a déjà été tenté."
            className="w-full min-h-[90px] bg-transparent text-sm text-imagine-text leading-relaxed outline-none resize-none placeholder:text-imagine-text-subtle"
          />
        </Panel>

        <Panel className="p-4 space-y-2">
          <label className="text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle">
            Horizon
          </label>
          <textarea
            value={trace.horizon}
            onChange={(e) => setField('horizon', e.target.value)}
            placeholder="Ce que tu veux pouvoir décider, et dans quel délai."
            className="w-full min-h-[90px] bg-transparent text-sm text-imagine-text leading-relaxed outline-none resize-none placeholder:text-imagine-text-subtle"
          />
        </Panel>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.26 }}
        className="flex items-center gap-4"
      >
        <Button
          variant="primary"
          onClick={handleRead}
          disabled={!canRead || busy}
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Faire lire
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>

        <span className="text-xs text-imagine-text-subtle">
          {canRead
            ? 'Le moteur va reformuler, reposer les présupposés, et nommer la question qui décide.'
            : 'Quelques mots suffisent pour commencer.'}
        </span>
      </motion.div>

      {trace.paths.length > 0 && (
        <button
          onClick={() => setTraceStep(7)}
          className={cn(
            'text-xs text-imagine-text-subtle hover:text-imagine-text transition-colors'
          )}
        >
          Consulter le journal de ce tracé →
        </button>
      )}
    </div>
  );
}
