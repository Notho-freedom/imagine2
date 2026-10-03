'use client';

// ========================================
// IMAGINE - Intake Step
// Une surface pour poser ce qui vous occupe la tête.
// Et une porte pour ceux qui ne savent pas quoi décider.
// ========================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Compass,
  Loader2,
  Plus,
  Split,
  X,
} from 'lucide-react';
import { useImagineStore } from '@/store';
import { useTrace } from '@/hooks/useTrace';
import { cn } from '@/lib/utils';
import { makeEvent } from '@/lib/trace';
import { Button, ErrorNote, Panel, Thinking } from './ui';
import { SparkGlyph } from './marks';
import type { CandidateDecision } from '@/types';

// ========================================
// Une décision démêlée
// ========================================

function DecisionCard({
  decision,
  chosen,
  onChoose,
}: {
  decision: CandidateDecision;
  chosen: boolean;
  onChoose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <button
        onClick={onChoose}
        className={cn(
          'w-full text-left rounded-xl border px-4 py-4 transition-all',
          chosen
            ? 'border-imagine-projection/60 bg-imagine-projection/[0.07]'
            : 'border-white/5 bg-imagine-surface/50 hover:border-white/15'
        )}
        style={chosen ? { boxShadow: '0 0 0 1px rgba(79,209,197,0.2)' } : undefined}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'w-4 h-4 rounded-full border shrink-0 mt-0.5 flex items-center justify-center transition-colors',
              chosen ? 'border-imagine-projection' : 'border-white/20'
            )}
          >
            {chosen && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-1.5 h-1.5 rounded-full bg-imagine-projection"
              />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-imagine-text leading-snug">
              {decision.title}
            </div>
            <p className="text-sm text-imagine-text-muted mt-1 leading-relaxed">
              {decision.statement}
            </p>

            {decision.wouldConfirm && (
              <p className="text-xs text-imagine-text-subtle mt-2 leading-relaxed flex gap-1.5">
                <span className="shrink-0 opacity-60">Confirmerait si</span>
                <span>{decision.wouldConfirm}</span>
              </p>
            )}
            {decision.costOfIgnoring && (
              <p className="text-xs text-imagine-text-subtle mt-1 leading-relaxed flex gap-1.5">
                <span className="shrink-0 text-imagine-forge/70">Coûte tant que</span>
                <span>{decision.costOfIgnoring}</span>
              </p>
            )}
          </div>

          {chosen && (
            <Tag color="#4FD1C5">par là</Tag>
          )}
        </div>
      </button>
    </motion.div>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="shrink-0 px-1.5 py-0.5 rounded text-[10px] self-start mt-0.5"
      style={color ? { color, background: `${color}18` } : undefined}
    >
      {children}
    </span>
  );
}

// ========================================
// Étape
// ========================================

export default function IntakeStep({ onRead }: { onRead: () => void }) {
  const trace = useImagineStore((s) => s.traces.find((t) => t.id === s.activeTraceId));
  const updateTrace = useImagineStore((s) => s.updateTrace);
  const appendEvent = useImagineStore((s) => s.appendEvent);
  const addDecision = useImagineStore((s) => s.addDecision);
  const { findDecision, pending, error } = useTrace();

  const [fold, setFold] = useState(false);
  const [addingDecision, setAddingDecision] = useState(false);
  const [draftDecision, setDraftDecision] = useState('');

  if (!trace) return null;

  const isConfusion = trace.seedKind === 'confusion';
  const decided = trace.chosenDecisionId !== null;
  const chosen = trace.decisions.find((d) => d.id === trace.chosenDecisionId) ?? null;
  const demelee = pending === 'confusion';

  const setField = (field: 'spark' | 'context' | 'horizon', value: string) => {
    updateTrace(trace.id, { [field]: value });
    if (field === 'spark' && value.trim()) {
      const title = value.trim().split(/[.\n]/)[0]?.slice(0, 72).trim();
      if (title && title.length > 2) updateTrace(trace.id, { title });
    }
  };

  const handleFind = async () => {
    if (!trace.spark.trim()) return;
    await findDecision();
  };

  const handleRead = () => {
    if (!trace.spark.trim()) return;
    appendEvent(
      makeEvent('statement', 'user', 'Idée posée', {
        detail: chosen ? chosen.statement : trace.spark.slice(0, 300),
      })
    );
    onRead();
  };

  const canGo =
    trace.spark.trim().length > 8 && (isConfusion ? decided : true);

  return (
    <div className="max-w-3xl mx-auto space-y-10 py-10">
      {/* La surface */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="space-y-4"
      >
        {isConfusion ? (
          <h1 className="text-2xl font-light text-imagine-text leading-snug">
            Qu&apos;est-ce qui te retourne&nbsp;?
          </h1>
        ) : (
          <h1 className="text-2xl font-light text-imagine-text leading-snug">
            Qu&apos;est-ce que tu advances&nbsp;?
          </h1>
        )}

        <p className="text-sm text-imagine-text-subtle leading-relaxed">
          {isConfusion
            ? "Mets tout, n'importe comment. C'est le rôle du moteur de séparer ce qui est emmêlé — pas le tien."
            : "Pose-la telle qu'elle vient. Elle n'a pas besoin d'être claire : c'est le moteur qui va la lire et la déplier."}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
        className="relative"
      >
        <SparkGlyph
          size={18}
          color={isConfusion ? '#A78BFA' : '#FFB347'}
          className="absolute left-4 top-4 opacity-50 pointer-events-none"
        />
        <textarea
          autoFocus
          value={trace.spark}
          onChange={(e) => setField('spark', e.target.value)}
          placeholder={
            isConfusion
              ? "Je ne sais plus si je pars ou si je reste, et je n'arrive pas à savoir lequel des deux est la vraie question…"
              : 'Je crois que… / Je veux décider si… / Ce qui me bloque, c\'est…'
          }
          className="w-full min-h-[170px] rounded-xl border border-white/5 bg-imagine-surface/50 px-12 py-4 text-lg text-imagine-text leading-relaxed outline-none resize-y placeholder:text-imagine-text-subtle/60 focus:border-imagine-projection/40 transition-colors"
        />
      </motion.div>

      {/* Le reste, replié */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.14 }}
      >
        <button
          onClick={() => setFold((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-imagine-text-subtle hover:text-imagine-text transition-colors"
        >
          {fold ? <Plus className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 rotate-45" />}
          {fold ? 'Ajouter du contexte' : 'Masquer le contexte'}
        </button>

        <AnimatePresence>
          {fold && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24 }}
              className="overflow-hidden"
            >
              <div className="grid gap-4 sm:grid-cols-2 pt-4">
                <Panel className="p-4 space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle">
                    Contexte
                  </label>
                  <textarea
                    value={trace.context}
                    onChange={(e) => setField('context', e.target.value)}
                    placeholder="Ce qui entoure. Qui est concerné, ce qui a déjà été tenté."
                    className="w-full min-h-[90px] bg-transparent text-sm text-imagine-text leading-relaxed outline-none resize-none placeholder:text-imagine-text-subtle/60"
                  />
                </Panel>
                <Panel className="p-4 space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle">
                    Horizon
                  </label>
                  <textarea
                    value={trace.horizon}
                    onChange={(e) => setField('horizon', e.target.value)}
                    placeholder="Ce que tu veux pouvoir décider, et pour quand."
                    className="w-full min-h-[90px] bg-transparent text-sm text-imagine-text leading-relaxed outline-none resize-none placeholder:text-imagine-text-subtle/60"
                  />
                </Panel>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {error && <ErrorNote message={error} onRetry={isConfusion ? handleFind : onRead} />}

      {/* Le moteur démonte */}
      {isConfusion && (
        <AnimatePresence mode="wait">
          {demelee ? (
            <Thinking
              label="Démêlage en cours"
              detail="Chercher les questions que tu n'arrivez plus à distinguer."
              color="#A78BFA"
            />
          ) : trace.decisions.length > 0 ? (
            <motion.div
              key="demele"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-imagine-drift">
                <Split className="w-3.5 h-3.5" />
                Ce que tu hésites entre
              </div>

              <p className="text-sm text-imagine-text-muted leading-relaxed">
                Ce n&apos;est pas une décision, c&apos;est plusieurs décisions emmêlées.
                Un « non » à l&apos;une n&apos;est pas un « non » aux autres. Choisis par
                laquelle commencer.
              </p>

              <div className="space-y-3">
                {trace.decisions.map((d) => (
                  <DecisionCard
                    key={d.id}
                    decision={d}
                    chosen={d.id === trace.chosenDecisionId}
                    onChoose={() => {
                      useImagineStore.getState().chooseDecision(trace.id, d.id);
                      appendEvent(
                        makeEvent('statement', 'user', 'Décision retenue pour commencer', {
                          detail: d.statement,
                        })
                      );
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                {addingDecision ? (
                  <>
                    <input
                      autoFocus
                      value={draftDecision}
                      onChange={(e) => setDraftDecision(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && draftDecision.trim()) {
                          addDecision(trace.id, draftDecision);
                          setDraftDecision('');
                          setAddingDecision(false);
                        }
                        if (e.key === 'Escape') setAddingDecision(false);
                      }}
                      placeholder="Une décision que le moteur n'a pas vue"
                      className="flex-1 bg-imagine-bg/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-imagine-text outline-none focus:border-imagine-drift/50"
                    />
                    <Button
                      variant="quiet"
                      onClick={() => {
                        addDecision(trace.id, draftDecision);
                        setDraftDecision('');
                        setAddingDecision(false);
                      }}
                    >
                      Ajouter
                    </Button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setAddingDecision(true)}
                      className="flex items-center gap-1.5 text-xs text-imagine-text-subtle hover:text-imagine-text transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Il y en a une autre que le moteur rate
                    </button>
                    {trace.decisions.length < 2 && (
                      <Button variant="quiet" onClick={handleFind} disabled={pending !== null}>
                        Démêler encore
                      </Button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ) : trace.spark.trim().length > 8 ? (
            <motion.div
              key="appel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-4"
            >
              <Button variant="primary" color="#A78BFA" onClick={handleFind}>
                <Split className="w-4 h-4" />
                Démêler
              </Button>
              <span className="text-xs text-imagine-text-subtle">
                Trouver les questions que tu n&apos;arrives plus à distinguer.
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      )}

      {/* Suite */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-4 flex-wrap pt-2 border-t border-white/5"
      >
        <Button
          variant="primary"
          color={isConfusion ? '#A78BFA' : '#4FD1C5'}
          onClick={handleRead}
          disabled={!canGo || pending !== null}
          title={
            isConfusion && !decided
              ? 'Choisis par quelle décision commencer'
              : undefined
          }
        >
          {isConfusion ? (
            <>
              <Compass className="w-4 h-4" />
              Lire cette décision
            </>
          ) : (
            <>
              Faire lire
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>

        {!isConfusion && (
          <span className="text-xs text-imagine-text-subtle">
            Le moteur va reformuler, reposer les présupposés, et nommer la question qui décide.
          </span>
        )}
      </motion.div>
    </div>
  );
}
