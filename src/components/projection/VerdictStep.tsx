'use client';

// ========================================
// IMAGINE - Verdict Step
// Ce qu'on retient — et ce qui prouverait qu'on a tort
// ========================================

import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CircleCheck,
  Flag,
  Loader2,
  RotateCcw,
  Scale,
  TriangleAlert,
} from 'lucide-react';
import { useImagineStore } from '@/store';
import { useTrace } from '@/hooks/useTrace';
import { Bullets, Button, ErrorNote, Panel, Quote, Section, Tag, Thinking } from './ui';
import { CRITERION_DIRECTION } from '@/lib/trace';

export default function VerdictStep() {
  const trace = useImagineStore((s) => s.traces.find((t) => t.id === s.activeTraceId));
  const setTraceStep = useImagineStore((s) => s.setTraceStep);
  const { arbitrate, commit, pending, error } = useTrace();

  if (!trace) return null;

  const v = trace.verdict;

  if (pending === 'verdict' && !v) {
    return (
      <Thinking
        label="Arbitrage en cours"
        detail="Le moteur tranche et assume."
        color="#34D399"
      />
    );
  }

  if (!v) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4">
        <p className="text-sm text-imagine-text-subtle">Aucun arbitrage rendu.</p>
        {error && <ErrorNote message={error} />}
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setTraceStep(5)}>
            Aller à la confrontation
          </Button>
          <Button variant="primary" onClick={() => arbitrate()}>
            Arbitrer maintenant
          </Button>
        </div>
      </div>
    );
  }

  const chosen = trace.paths.find((p) => p.id === v.recommendedPathId);
  const color = chosen?.color ?? '#34D399';
  const committed = trace.status === 'arbitrated';
  const loser = trace.paths.find((p) => p.id !== v.recommendedPathId);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      {/* La décision */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Panel className="p-6" accent color={color}>
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Flag className="w-4 h-4" style={{ color }} />
              <span className="text-[10px] uppercase tracking-[0.18em] text-imagine-text-subtle">
                Retenu
              </span>
              <Tag color={color}>{Math.round(v.confidence * 100)}% de confiance</Tag>
              {committed && (
                <Tag color="#34D399">
                  <CircleCheck className="w-3 h-3" />
                  validé
                </Tag>
              )}
            </div>

            <h2 className="text-2xl font-light text-imagine-text leading-tight">
              {chosen?.title ?? 'Trajectoire inconnue'}
            </h2>

            {chosen && (
              <p
                className="text-sm leading-relaxed border-l-2 pl-3"
                style={{ borderColor: `${color}66` }}
              >
                {chosen.thesis}
              </p>
            )}

            <p className="text-sm text-imagine-text leading-relaxed whitespace-pre-wrap">
              {v.why}
            </p>
          </div>
        </Panel>
      </motion.div>

      {/* Facteurs et implications */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-5 space-y-3">
          <Section title="Facteurs décisifs" color={color}>
            <Bullets items={v.decisiveFactors} color={color} numbered />
          </Section>
        </Panel>

        <Panel className="p-5 space-y-3">
          <Section title="Ce que cela implique" hint="y compris ce qu'on perd" color="#60A5FA">
            <Bullets items={v.whatItImplies} color="#60A5FA" />
          </Section>
        </Panel>
      </div>

      {/* Falsificateurs */}
      <Panel className="p-5 space-y-3">
        <Section
          title="Ce qui prouverait qu'on a tort"
          hint="la décision reste réversible tant que ça n'est pas arrivé"
          color="#F87171"
        >
          <Bullets items={v.falsifiers} color="#F87171" />
        </Section>
      </Panel>

      {/* Prochaines actions */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-5 space-y-3">
          <Section title="Premiers gestes" color="#34D399">
            <Bullets items={v.nextActions} color="#34D399" numbered />
          </Section>
        </Panel>

        {v.changeConditions.length > 0 && (
          <Panel className="p-5 space-y-3">
            <Section title="Ce qui rouvrirait la décision" color="#FFB347">
              <Bullets items={v.changeConditions} color="#FFB347" />
            </Section>
          </Panel>
        )}
      </div>

      {/* Conclusion */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <Quote color={color} label="Bilan net">
          <span className="text-lg font-light">{v.closing}</span>
        </Quote>
      </motion.div>

      {/* Validation */}
      {error && <ErrorNote message={error} />}

      <Panel className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <TriangleAlert
            className="w-4 h-4 mt-0.5 shrink-0"
            style={{ color: committed ? '#34D399' : '#FFB347' }}
          />
          <div className="text-sm text-imagine-text-muted leading-relaxed">
            {committed ? (
              <>
                Décision validée. La trajectoire retenue est marquée comme <strong>retenue</strong>,
                toutes les autres comme <strong>écartées</strong> — elles restent visibles et
                exportables dans le journal.
              </>
            ) : (
              <>
                En validant, tu figes la décision : une seule trajectoire reste ouverte, les autres
                passent en écartées. Rien n&apos;est supprimé — tout reste dans le tracé.
              </>
            )}
            {loser && !committed && (
              <div className="mt-2 text-xs text-imagine-text-subtle">
                Ce qui sera écarté : « {loser.title} »
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!committed ? (
            <>
              <Button variant="primary" color={color} onClick={commit}>
                <CircleCheck className="w-4 h-4" />
                Valider cette décision
              </Button>
              <Button
                variant="quiet"
                onClick={() => arbitrate()}
                disabled={pending !== null}
              >
                {pending === 'verdict' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                Arbitrer à nouveau
              </Button>
            </>
          ) : (
            <Button variant="primary" color={color} onClick={() => setTraceStep(7)}>
              Voir le tracé complet
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Panel>

      {/* Rappel des critères */}
      {trace.confrontation && (
        <details className="text-xs text-imagine-text-subtle">
          <summary className="cursor-pointer hover:text-imagine-text transition-colors flex items-center gap-2">
            <Scale className="w-3.5 h-3.5" />
            Rappel des notes qui ont conduit à cette décision
          </summary>
          <div className="mt-3 space-y-2">
            {trace.confrontation.criteria.map((crit) => (
              <div key={crit.key} className="flex items-baseline gap-2">
                <span className="w-28 shrink-0 text-imagine-text-muted">{crit.label}</span>
                <span className="text-imagine-text-subtle">
                  {CRITERION_DIRECTION[crit.key] === 'lower' ? 'moins est mieux' : 'plus est mieux'}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
