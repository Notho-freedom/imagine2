'use client';

// ========================================
// IMAGINE - Descent Step
// Descendre dans une trajectoire, voir où elle mène
// ========================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ChevronRight,
  GitBranch,
  Loader2,
  Send,
  Trash2,
  TriangleAlert,
  GitCompareArrows,
} from 'lucide-react';
import { useImagineStore } from '@/store';
import { useTrace } from '@/hooks/useTrace';
import { cn } from '@/lib/utils';
import { pathsOfDecision } from '@/lib/trace';
import { Bullets, Button, ErrorNote, Panel, Section, Tag, Thinking } from './ui';
import type { BranchPoint, DescentEntry, ThoughtPath } from '@/types';

// ========================================
// Sélecteur de trajectoires
// ========================================

function PathRail({
  paths,
  activeId,
  onSelect,
}: {
  paths: ThoughtPath[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {paths.map((p) => {
        const active = p.id === activeId;
        const dead = p.status === 'eliminated';
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={cn(
              'w-full text-left rounded-lg border px-3 py-2.5 transition-all',
              active ? 'bg-white/[0.04]' : 'border-transparent hover:bg-white/[0.02]'
            )}
            style={{
              borderColor: active ? `${p.color}55` : 'transparent',
              opacity: dead ? 0.4 : 1,
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: p.color }}
              />
              <span className="text-sm text-imagine-text truncate flex-1">{p.title}</span>
              {p.timeline.length > 0 && (
                <span
                  className="text-[10px] tabular-nums"
                  style={{ color: p.color }}
                >
                  {p.timeline.length}
                </span>
              )}
            </div>
            {active && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-xs text-imagine-text-subtle mt-1.5 leading-relaxed line-clamp-2"
              >
                {p.thesis}
              </motion.p>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ========================================
// Un passage de descente
// ========================================

function Entry({
  entry,
  color,
  index,
  onRemove,
}: {
  entry: DescentEntry;
  color: string;
  index: number;
  onRemove: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative pl-7"
    >
      {/* Fil */}
      <div
        className="absolute left-[7px] top-0 h-full w-px opacity-25"
        style={{ background: color }}
      />
      <div
        className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center"
        style={{ borderColor: color, background: '#0B0F14' }}
      >
        <span className="text-[8px] tabular-nums" style={{ color }}>
          {index + 1}
        </span>
      </div>

      <div className="pb-8 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-sm font-semibold text-imagine-text leading-snug pt-0.5">
            {entry.question}
          </h4>
          <button
            onClick={onRemove}
            className="text-imagine-text-subtle hover:text-imagine-forge transition-colors shrink-0"
            title="Supprimer ce passage"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-sm text-imagine-text leading-relaxed whitespace-pre-wrap">
          {entry.analysis}
        </p>

        {entry.consequences.length > 0 && (
          <Section title="Conséquences">
            <Bullets items={entry.consequences} color={color} />
          </Section>
        )}

        <div
          className="rounded-lg px-4 py-3 border"
          style={{ borderColor: `${color}44`, background: `${color}0D` }}
        >
          <div
            className="text-[10px] uppercase tracking-[0.16em] mb-1"
            style={{ color }}
          >
            Ce qu&apos;on peut décider maintenant
          </div>
          <p className="text-sm text-imagine-text leading-relaxed">{entry.decision}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle">
              Produit
            </div>
            <p className="text-sm text-imagine-text-muted leading-relaxed">{entry.produces}</p>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle">
              Coûte
            </div>
            <p className="text-sm text-imagine-text-muted leading-relaxed">{entry.costs}</p>
          </div>
        </div>

        {entry.unknowns.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle">
              Inconnues restantes
            </div>
            <Bullets items={entry.unknowns} color="#FFB347" />
          </div>
        )}

        {entry.wall && (
          <div className="flex items-start gap-2 text-sm text-imagine-text-muted leading-relaxed">
            <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0 text-imagine-forge/70" />
            <span>
              <span className="text-imagine-text-subtle">Mur — </span>
              {entry.wall}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ========================================
// Un embranchement
// ========================================

function Branch({
  branch,
  color,
  onFork,
  onDelete,
}: {
  branch: BranchPoint;
  color: string;
  onFork: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border px-4 py-3 space-y-2"
      style={{ borderColor: 'rgba(167,139,250,0.3)', background: 'rgba(167,139,250,0.06)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.16em] text-imagine-drift/70 flex items-center gap-1.5">
            <GitBranch className="w-3 h-3" />
            Point de bifurcation
          </div>
          <p className="text-sm text-imagine-text mt-1 leading-relaxed">{branch.question}</p>
        </div>
        <button
          onClick={onDelete}
          title="Oublier ce virage"
          className="shrink-0 p-1 rounded text-imagine-text-subtle/60 hover:text-imagine-forge transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 text-xs">
        <div className="space-y-0.5">
          <div className="text-imagine-text-subtle">Écarté</div>
          <p className="text-imagine-text-muted leading-relaxed">{branch.alternative}</p>
        </div>
        <div className="space-y-0.5">
          <div className="text-imagine-text-subtle">Retenu</div>
          <p className="text-imagine-text-muted leading-relaxed">{branch.chosen}</p>
        </div>
      </div>

      {branch.costOfChoice && (
        <p className="text-xs text-imagine-text-subtle leading-relaxed pt-1 border-t border-white/5">
          <span className="text-imagine-forge/80">Ce qu&apos;on perd — </span>
          {branch.costOfChoice}
        </p>
      )}

      <button
        onClick={onFork}
        className="text-xs text-imagine-drift hover:text-imagine-text transition-colors flex items-center gap-1.5"
      >
        <GitBranch className="w-3.5 h-3.5" />
        Explorer aussi ce chemin
      </button>
    </motion.div>
  );
}

// ========================================
// Étape
// ========================================

export default function DescentStep() {
  const trace = useImagineStore((s) => s.traces.find((t) => t.id === s.activeTraceId));
  const activePathId = useImagineStore((s) => s.ui.activePathId);
  const setActivePath = useImagineStore((s) => s.setActivePath);
  const setTraceStep = useImagineStore((s) => s.setTraceStep);
  const removeDescent = useImagineStore((s) => s.removeDescent);
  const deleteBranch = useImagineStore((s) => s.deleteBranch);
  const { descend, fork, pending, error } = useTrace();

  const [probe, setProbe] = useState('');
  const [forking, setForking] = useState<number | null>(null);
  const [forkSeed, setForkSeed] = useState('');

  if (!trace) return null;

  const live = pathsOfDecision(trace, trace.chosenDecisionId).filter(
    (p) => p.status !== 'eliminated'
  );
  const scoped = pathsOfDecision(trace, trace.chosenDecisionId);
  const fallback =
    scoped.find((p) => p.id === activePathId) ?? live[0] ?? scoped[0] ?? null;
  const path = fallback;
  const children = path
    ? trace.paths.filter((p) => p.parentPathId === path.id)
    : [];

  const handleDescend = async () => {
    if (!path) return;
    const q = probe.trim();
    setProbe('');
    await descend(path, q);
  };

  const handleFork = async (atEntryIndex: number, seed = '') => {
    if (!path) return;
    setForking(atEntryIndex);
    setForkSeed('');
    await fork(path, atEntryIndex, seed);
    setForking(null);
  };

  if (live.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4">
        <p className="text-sm text-imagine-text-subtle">
          Toutes les trajectoires ont été écartées. Il en faut au moins une vivante pour descendre.
        </p>
        <Button variant="ghost" onClick={() => setTraceStep(3)}>
          Retour à la projection
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Rail */}
        <aside className="space-y-4">
          <div className="text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle px-1">
            Trajectoires
          </div>
          <PathRail
            paths={trace.paths}
            activeId={path?.id ?? null}
            onSelect={(id) => setActivePath(id)}
          />
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setTraceStep(5)}
            disabled={live.length < 2}
          >
            <GitCompareArrows className="w-4 h-4" />
            Confronter
          </Button>
        </aside>

        {/* Descente */}
        {path ? (
          <div className="space-y-6 min-w-0">
            <Panel
              accent
              color={path.color}
              className="p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl font-light text-imagine-text leading-tight">
                    {path.title}
                  </h2>
                  <p
                    className="text-sm mt-2 leading-relaxed border-l-2 pl-3"
                    style={{ borderColor: `${path.color}55` }}
                  >
                    {path.thesis}
                  </p>
                </div>
                <Tag color={path.color}>
                  {path.timeline.length} passage{path.timeline.length > 1 ? 's' : ''}
                </Tag>
              </div>
            </Panel>

            {/* Console de descente */}
            <Panel className="p-4 space-y-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle">
                Où aller encore&nbsp;?
              </div>
              <textarea
                value={probe}
                onChange={(e) => setProbe(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleDescend();
                }}
                placeholder="Laisse vide pour avancer jusqu'au mur. Ou pose une question précise : « qui paie vraiment ? », « que se passe-t-il si ça échoue ? »"
                className="w-full min-h-[70px] bg-transparent text-sm text-imagine-text leading-relaxed outline-none resize-none placeholder:text-imagine-text-subtle"
              />
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  color={path.color}
                  onClick={handleDescend}
                  disabled={pending !== null}
                >
                  {pending === 'descent' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Descendre
                </Button>
                <span className="text-xs text-imagine-text-subtle">
                  {path.timeline.length === 0
                    ? 'Premier état des lieux.'
                    : `${path.timeline.length} passage${path.timeline.length > 1 ? 's' : ''} déjà.`}
                </span>
              </div>
            </Panel>

            {pending === 'descent' && (
              <Thinking
                label="Descente en cours"
                detail="Pousser cette trajectoire jusqu'au point où elle cesse de tenir."
                color={path.color}
              />
            )}

            {pending === 'branch' && forking !== null && (
              <Thinking
                label="Bifurcation en cours"
                detail="Ouverture du chemin écarté, et de ce qu'il coûte de l'abandonner."
                color="#A78BFA"
              />
            )}

            {error && <ErrorNote message={error} />}

            {/* Journal de la trajectoire */}
            {path.timeline.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-imagine-text-subtle">
                  Cette trajectoire n&apos;a pas encore été descendue.
                </p>
                <p className="text-xs text-imagine-text-subtle/70 mt-2">
                  Descends pour voir jusqu&apos;où elle tient.
                </p>
              </div>
            ) : (
              <div className="pt-2">
                {path.timeline
                  .slice()
                  .reverse()
                  .map((entry, i) => {
                    const realIndex = path.timeline.length - 1 - i;
                    const branchHere = path.branches.filter(
                      (b) => b.atEntryIndex === realIndex
                    );
                    return (
                      <div key={entry.id}>
                        <Entry
                          entry={entry}
                          color={path.color}
                          index={realIndex + 1}
                          onRemove={() => removeDescent(trace.id, path.id, entry.id)}
                        />
                        {branchHere.map((b) => (
                          <Branch
                            key={b.id}
                            branch={b}
                            color={path.color}
                            onFork={() => handleFork(b.atEntryIndex, b.alternative)}
                            onDelete={() => deleteBranch(trace.id, path.id, b.id)}
                          />
                        ))}
                      </div>
                    );
                  })}

                {/* Bifurquer ici, maintenant */}
                <button
                  onClick={() => handleFork(path.timeline.length, forkSeed)}
                  disabled={pending !== null}
                  className="ml-7 mb-6 flex items-center gap-1.5 text-xs text-imagine-text-subtle hover:text-imagine-drift transition-colors disabled:opacity-40"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  Virer maintenant — explorer le chemin écarté
                </button>
              </div>
            )}

            {/* Sous-trajectoires issues de ce virage */}
            {children.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-white/5">
                <div className="text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle">
                  Virages explorés depuis cette trajectoire
                </div>
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setActivePath(child.id)}
                    className="w-full flex items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition-all hover:bg-white/[0.03]"
                    style={{
                      borderColor: `${child.color}44`,
                      opacity: child.status === 'eliminated' ? 0.4 : 1,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ background: child.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-imagine-text">{child.title}</div>
                      <div className="text-xs text-imagine-text-subtle mt-0.5 leading-snug line-clamp-2">
                        {child.thesis}
                      </div>
                    </div>
                    <span className="text-[10px] tabular-nums text-imagine-text-subtle shrink-0 mt-1">
                      {child.timeline.length}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <AnimatePresence>
              {path.timeline.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pt-2"
                >
                  <Button variant="ghost" onClick={() => setTraceStep(5)}>
                    <ChevronRight className="w-4 h-4" />
                    Confronter toutes les trajectoires
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : null}
      </div>
    </div>
  );
}
