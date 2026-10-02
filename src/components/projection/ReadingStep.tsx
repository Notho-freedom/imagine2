'use client';

// ========================================
// IMAGINE - Reading Step
// Ce que le moteur a compris — et ce qu'il te rend
// ========================================

import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Compass,
  GitCompareArrows,
  Layers,
  Loader2,
  MessageSquareWarning,
  Target,
} from 'lucide-react';
import { useImagineStore } from '@/store';
import { Button, Bullets, ErrorNote, Field, Panel, Quote, Section, Stagger, Thinking } from './ui';

export default function ReadingStep({
  pending,
  error,
  onProject,
  onRetryRead,
}: {
  pending: string | null;
  error: string | null;
  onProject: () => void;
  onRetryRead: () => void;
}) {
  const trace = useImagineStore((s) => s.traces.find((t) => t.id === s.activeTraceId));

  if (!trace) return null;

  if (pending === 'reading') {
    return (
      <Thinking
        label="Lecture en cours"
        detail="Reformulation, présupposés, tensions, et la question qui décidera de tout."
      />
    );
  }

  if (!trace.reading) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-6">
        <p className="text-sm text-imagine-text-subtle">La lecture n&apos;a pas été établie.</p>
        {error && <ErrorNote message={error} onRetry={onRetryRead} />}
        <Button variant="ghost" onClick={onRetryRead}>
          Lancer la lecture
        </Button>
      </div>
    );
  }

  const r = trace.reading;

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      <Stagger>
        <Quote label="Reformulation" color="#4FD1C5">
          {r.restatement}
        </Quote>
      </Stagger>

      <div className="grid gap-4 sm:grid-cols-2">
        <Stagger delay={0.05}>
          <Panel className="p-5 h-full">
            <Field label="Sujet réel">
              <span className="flex items-start gap-2">
                <Compass className="w-4 h-4 mt-0.5 text-imagine-nebula-light shrink-0" />
                {r.subject}
              </span>
            </Field>
          </Panel>
        </Stagger>

        <Stagger delay={0.1}>
          <Panel className="p-5 h-full">
            <Field label="Intention perçue">
              <span className="flex items-start gap-2">
                <Target className="w-4 h-4 mt-0.5 text-imagine-mature shrink-0" />
                {r.intent}
              </span>
            </Field>
          </Panel>
        </Stagger>
      </div>

      <Stagger delay={0.15}>
        <Panel className="p-5 space-y-3">
          <Section title="Présupposés non dits" hint="ce que ta formulation tient pour acquis">
            <Bullets items={r.implicits} color="#8B949E" />
          </Section>
        </Panel>
      </Stagger>

      {r.tensions.length > 0 && (
        <Stagger delay={0.2}>
          <Panel className="p-5 space-y-3">
            <Section title="Tensions" hint="l'énoncé ne tient pas tout seul" color="#F87171">
              <Bullets items={r.tensions} color="#F87171" />
            </Section>
          </Panel>
        </Stagger>
      )}

      {r.constraints.length > 0 && (
        <Stagger delay={0.25}>
          <Panel className="p-5 space-y-3">
            <Section title="Contraintes" hint="non négociables" color="#A78BFA">
              <Bullets items={r.constraints} color="#A78BFA" />
            </Section>
          </Panel>
        </Stagger>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Stagger delay={0.3}>
          <Panel className="p-5 space-y-3 h-full">
            <Section title="Inconnues" hint="ce qui manque pour décider" color="#FFB347">
              <Bullets items={r.unknowns} color="#FFB347" />
            </Section>
          </Panel>
        </Stagger>

        <Stagger delay={0.35}>
          <Panel className="p-5 space-y-3 h-full">
            <Section title="Enjeu" color="#34D399">
              <p className="text-sm text-imagine-text leading-relaxed">{r.stakes}</p>
            </Section>
          </Panel>
        </Stagger>
      </div>

      <Stagger delay={0.4}>
        <Panel className="p-5" accent color="#4FD1C5">
          <div className="flex items-start gap-3">
            <MessageSquareWarning className="w-5 h-5 text-imagine-projection shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle">
                La question décisive
              </div>
              <p className="text-lg text-imagine-text font-light leading-relaxed">
                {r.decisiveQuestion}
              </p>
            </div>
          </div>
        </Panel>
      </Stagger>

      {error && <ErrorNote message={error} onRetry={onRetryRead} />}

      <Stagger delay={0.45}>
        <div className="flex items-center gap-4 pt-2">
          <Button variant="primary" onClick={onProject} disabled={pending !== null}>
            {pending === 'projection' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Projection…
              </>
            ) : (
              <>
                Projeter les trajectoires
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
          <span className="text-xs text-imagine-text-subtle flex items-center gap-1.5">
            <GitCompareArrows className="w-3.5 h-3.5" />
            Des stratégies irreconciliables, pas des variantes
          </span>
        </div>
      </Stagger>

      {trace.paths.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-4 text-xs text-imagine-text-subtle flex items-center gap-2"
        >
          <Layers className="w-3.5 h-3.5" />
          {trace.paths.length} trajectoire{trace.paths.length > 1 ? 's' : ''} déjà projetée
          {trace.paths.length > 1 ? 's' : ''}. Tu peux en relancer d&apos;autres.
        </motion.div>
      )}
    </div>
  );
}
