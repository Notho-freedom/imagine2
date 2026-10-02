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
import { cn } from '@/lib/utils';
import { Bullets, Button, ErrorNote, Panel, Section, Tag, Thinking } from './ui';
import type { ThoughtPath } from '@/types';

function PathCard({
  path,
  index,
  onExplore,
  onEliminate,
  onRestore,
}: {
  path: ThoughtPath;
  index: number;
  onExplore: () => void;
  onEliminate: () => void;
  onRestore: () => void;
}) {
  const eliminated = path.status === 'eliminated';

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
      {/* Bande de couleur : l'identité de la trajectoire */}
      <div className="h-1 w-full" style={{ background: path.color }} />

      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-semibold tabular-nums opacity-70"
                style={{ color: path.color }}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="text-base font-semibold text-imagine-text leading-tight">
                {path.title}
              </h3>
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

        <p
          className="text-sm leading-relaxed border-l-2 pl-3"
          style={{ borderColor: `${path.color}55`, color: '#E6EDF3' }}
        >
          {path.thesis}
        </p>

        {path.angle && (
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle">
              Angle
            </div>
            <p className="text-sm text-imagine-text-muted leading-relaxed">{path.angle}</p>
          </div>
        )}

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
  const { project, eliminate, restore, pending, error } = useTrace();
  const [manualTitle, setManualTitle] = useState('');

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

  const live = trace.paths.filter((p) => p.status !== 'eliminated');
  const dead = trace.paths.filter((p) => p.status === 'eliminated');

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

      {trace.paths.length === 0 && (
        <Panel className="p-8 text-center">
          <p className="text-sm text-imagine-text-subtle mb-4">
            Aucune trajectoire encore.
          </p>
          <Button variant="primary" color="#A78BFA" onClick={() => project(4)}>
            Projeter les trajectoires
          </Button>
        </Panel>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {trace.paths.map((path, i) => (
          <PathCard
            key={path.id}
            path={path}
            index={i}
            onExplore={() => {
              setActivePath(path.id);
              setTraceStep(4);
            }}
            onEliminate={() => eliminate(path)}
            onRestore={() => restore(path)}
          />
        ))}
      </div>

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
    </div>
  );
}
