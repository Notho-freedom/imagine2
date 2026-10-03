'use client';

// ========================================
// IMAGINE - Projection Step
// Les trajectoires, chacune avec sa couleur
// ========================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Plus, RefreshCw, Target, TriangleAlert } from 'lucide-react';
import { useImagineStore } from '@/store';
import { useTrace } from '@/hooks/useTrace';
import { makeEvent, pathsOfDecision } from '@/lib/trace';
import { cn } from '@/lib/utils';
import { Bullets, Button, ErrorNote, Panel, Section, Tag, Thinking } from './ui';
import { EditableText } from './Editable';
import { EliminateLayer, useEliminate } from './Eliminate';
import type { ThoughtPath } from '@/types';

function PathCard({
  path,
  index,
  onExplore,
  onEliminate,
  onRestore,
  onRename,
}: {
  path: ThoughtPath;
  index: number;
  onExplore: () => void;
  onEliminate: () => void;
  onRestore: () => void;
  onRename: (updates: Partial<ThoughtPath>, what: string) => void;
}) {
  const eliminated = path.status === 'eliminated';
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(path.title);

  const commit = () => {
    setRenaming(false);
    const v = draft.trim();
    if (v && v !== path.title) onRename({ title: v }, 'titre');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
      className={cn(
        'relative rounded-xl border bg-imagine-surface/70 overflow-hidden transition-all',
        eliminated ? 'opacity-40' : 'hover:-translate-y-0.5'
      )}
      style={{
        borderColor: eliminated ? 'rgba(255,255,255,0.05)' : `${path.color}40`,
        boxShadow: eliminated ? undefined : `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 ${path.color}14`,
      }}
    >
      <div className="h-1 w-full" style={{ background: path.color }} />

      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-semibold tabular-nums opacity-70 shrink-0"
                style={{ color: path.color }}
              >
                {String(index + 1).padStart(2, '0')}
              </span>

              {renaming ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commit();
                    if (e.key === 'Escape') {
                      setDraft(path.title);
                      setRenaming(false);
                    }
                  }}
                  className="flex-1 bg-imagine-bg/60 border rounded-md px-2 py-1 text-base font-semibold text-imagine-text outline-none focus:border-imagine-projection/50"
                />
              ) : (
                <button
                  onClick={() => {
                    setDraft(path.title);
                    setRenaming(true);
                  }}
                  title="Renommer"
                  className="text-left text-base font-semibold text-imagine-text leading-tight hover:text-white transition-colors truncate"
                >
                  {path.title}
                </button>
              )}
            </div>
          </div>

          <Tag color={path.color}>
            {path.status === 'eliminated'
              ? 'écartée'
              : path.timeline.length > 0
                ? `${path.timeline.length} passage${path.timeline.length > 1 ? 's' : ''}`
                : 'ouverte'}
          </Tag>
        </div>

        <div
          className="border-l-2 pl-3"
          style={{ borderColor: `${path.color}55` }}
        >
          <EditableText
            value={path.thesis}
            onSave={(v) => onRename({ thesis: v }, 'hypothèse')}
            color={path.color}
            label="Reprendre l'hypothèse"
          />
        </div>

        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle">
            Angle
          </div>
          <EditableText
            value={path.angle}
            onSave={(v) => onRename({ angle: v }, 'angle')}
            color={path.color}
            placeholder="Sous quel angle cette trajectoire traite le problème."
            multiline={false}
          />
        </div>

        {path.keyMoves.length > 0 && (
          <Section title="Gestes" hint={`${path.keyMoves.length}`}>
            <Bullets items={path.keyMoves} color={path.color} numbered />
          </Section>
        )}

        {path.risks.length > 0 && (
          <Section title="Risques">
            <Bullets items={path.risks} color="#F87171" />
          </Section>
        )}

        {path.divergence && (
          <div className="flex items-start gap-2 text-xs text-imagine-text-subtle leading-relaxed">
            <TriangleAlert className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-60" />
            {path.divergence}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          <Button variant="ghost" color={path.color} onClick={onExplore} className="flex-1">
            Explorer
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
          {eliminated ? (
            <Button variant="quiet" onClick={onRestore}>
              Rétablir
            </Button>
          ) : (
            <Button variant="quiet" onClick={onEliminate}>
              Écarter
            </Button>
          )}
        </div>

        </div>
    </motion.div>
  );
}

export default function ProjectionStep() {
  const trace = useImagineStore((s) => s.traces.find((t) => t.id === s.activeTraceId));
  const setActivePath = useImagineStore((s) => s.setActivePath);
  const setTraceStep = useImagineStore((s) => s.setTraceStep);
  const addPaths = useImagineStore((s) => s.addPaths);
  const updatePath = useImagineStore((s) => s.updatePath);
  const appendEvent = useImagineStore((s) => s.appendEvent);
  const { project, eliminate, restore, pending, error } = useTrace();
  const [manualTitle, setManualTitle] = useState('');
  const { target, ask, clear } = useEliminate();

  if (!trace) return null;

  if (pending === 'projection' && trace.paths.length === 0) {
    return (
      <Thinking
        label="Projection en cours"
        detail="Recherche des stratégies qui ne peuvent pas être tenues ensemble."
        color="#A78BFA"
      />
    );
  }

  const live = pathsOfDecision(trace, trace.chosenDecisionId);
  const dead = trace.paths.filter(
    (p) => p.decisionId === trace.chosenDecisionId && p.status === 'eliminated'
  );
  const others = trace.paths.length - trace.paths.filter((p) => p.decisionId === trace.chosenDecisionId).length;

  const handleManual = () => {
    const title = manualTitle.trim();
    if (!title) return;
    addPaths(trace.id, [
      {
        title,
        thesis: manualTitle.trim(),
        angle: '',
        keyMoves: [],
        risks: [],
        payoff: '',
        divergence: '',
      },
    ]);
    setManualTitle('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div className="space-y-2">
          <h2 className="text-2xl font-light text-imagine-text">Où est-ce que ça peut aller&nbsp;?</h2>
          <p className="text-sm text-imagine-text-subtle max-w-xl leading-relaxed">
            Chaque trajectoire porte une couleur et un engagement propre. Elles ne sont pas
            compatibles : en choisir une, c&apos;est en abandonner les autres.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            color="#A78BFA"
            onClick={() => project(3)}
            disabled={pending !== null}
          >
            {pending === 'projection' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Projeter d&apos;autres
          </Button>
          <Button
            variant="primary"
            color="#A78BFA"
            onClick={() => setTraceStep(4)}
            disabled={live.length === 0}
          >
            <Target className="w-4 h-4" />
            Descendre
          </Button>
        </div>
      </div>

      {error && <ErrorNote message={error} />}

      {pathsOfDecision(trace, trace.chosenDecisionId).length === 0 && (
        <Panel className="p-8 text-center">
          <p className="text-sm text-imagine-text-subtle mb-4">
            Aucune trajectoire pour cette décision.
          </p>
          <Button variant="primary" color="#A78BFA" onClick={() => project(4)}>
            Projeter les trajectoires
          </Button>
        </Panel>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {pathsOfDecision(trace, trace.chosenDecisionId).map((path, i) => (
          <PathCard
            key={path.id}
            path={path}
            index={i}
            onExplore={() => {
              setActivePath(path.id);
              setTraceStep(4);
            }}
            onEliminate={() => ask(path)}
            onRestore={() => restore(path)}
            onRename={(updates, what) => {
              updatePath(trace.id, path.id, updates);
              appendEvent(
                makeEvent('correction', 'user', `Trajectoire corrigée — ${what}`, {
                  detail: String(updates.title ?? updates.thesis ?? updates.angle ?? ''),
                  pathId: path.id,
                  color: path.color,
                })
              );
            }}
          />
        ))}
      </div>

      {others > 0 && (
        <p className="text-xs text-imagine-text-subtle">
          {others} trajectoire{others > 1 ? 's' : ''} appartiennent à une autre décision. Tu
          les retrouveras en changeant de question.
        </p>
      )}

      {dead.length > 0 && (
        <p className="text-xs text-imagine-text-subtle">
          {dead.length} trajectoire{dead.length > 1 ? 's' : ''} écartée
          {dead.length > 1 ? 's' : ''} — elle{dead.length > 1 ? 's' : ''} resteront visibles,
          jamais supprimées.
        </p>
      )}

      {/* Ajout manuel */}
      <Panel className="p-4">
        <div className="text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle mb-2">
          Une possibilité que le moteur n&apos;a pas vue
        </div>
        <div className="flex gap-2">
          <input
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManual()}
            placeholder="Une trajectoire que tu vois et que l'IA n'a pas proposée"
            className="flex-1 bg-transparent text-sm text-imagine-text outline-none placeholder:text-imagine-text-subtle"
          />
          <Button variant="quiet" onClick={handleManual} disabled={!manualTitle.trim()}>
            <Plus className="w-4 h-4" />
            Ajouter
          </Button>
        </div>
      </Panel>

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
