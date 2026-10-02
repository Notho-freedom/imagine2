'use client';

// ========================================
// IMAGINE - Reading Step
// Ce que le moteur a compris — et ce qu'il te rend
// ========================================

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Compass,
  GitCompareArrows,
  Layers,
  Loader2,
  MessageSquareWarning,
  Target,
  RefreshCw,
} from 'lucide-react';
import { useImagineStore } from '@/store';
import { useTrace } from '@/hooks/useTrace';
import { Button, ErrorNote, Field, Panel, Quote, Section, Stagger, Thinking } from './ui';
import { EditableText, ContestableList } from './Editable';

const LIST_FIELDS = ['implicits', 'tensions', 'constraints', 'unknowns'] as const;
type ListField = (typeof LIST_FIELDS)[number];

const LIST_LABEL: Record<ListField, string> = {
  implicits: 'Présupposés non dits',
  tensions: 'Tensions',
  constraints: 'Contraintes',
  unknowns: 'Inconnues',
};

export default function ReadingStep({
  pending,
  error,
  onProject,
  onRead,
}: {
  pending: string | null;
  error: string | null;
  onProject: () => void;
  onRead: () => void;
}) {
  const trace = useImagineStore((s) => s.traces.find((t) => t.id === s.activeTraceId));
  const { editReading, rejectItem, addItem, setNote, read } = useTrace();
  const [note, setLocalNote] = useState('');

  useEffect(() => {
    setLocalNote(trace?.reading?.feedback?.note ?? '');
  }, [trace?.reading?.feedback?.note]);

  if (!trace) return null;

  if (pending === 'reading' && !trace.reading) {
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
        {error && <ErrorNote message={error} onRetry={onRead} />}
        <Button variant="ghost" onClick={onRead}>
          Lancer la lecture
        </Button>
      </div>
    );
  }

  const r = trace.reading;
  const corrections = r.feedback;
  const contested = (corrections?.rejected.length ?? 0) + (corrections?.added.length ?? 0) + (corrections?.note?.trim() ? 1 : 0);

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      {/* Bandeau de réécriture */}
      {r.revision > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 rounded-lg border border-imagine-mature/25 bg-imagine-mature/[0.07] px-4 py-2.5"
        >
          <RefreshCw className="w-3.5 h-3.5 text-imagine-mature shrink-0" />
          <span className="text-xs text-imagine-text-muted">
            Lecture relue {r.revision} fois — tes corrections font désormais autorité.
          </span>
        </motion.div>
      )}

      <Stagger>
        <Quote label="Reformulation" color="#4FD1C5">
          <EditableText
            value={r.restatement}
            onSave={(v) => editReading({ restatement: v }, 'reformulation')}
            color="#4FD1C5"
            label="Reformuler toi-même"
          />
        </Quote>
      </Stagger>

      <div className="grid gap-4 sm:grid-cols-2">
        <Stagger delay={0.05}>
          <Panel className="p-5 h-full">
            <Field label="Sujet réel">
              <div className="flex items-start gap-2">
                <Compass className="w-4 h-4 mt-0.5 text-imagine-nebula-light shrink-0" />
                <div className="flex-1 min-w-0">
                  <EditableText
                    value={r.subject}
                    onSave={(v) => editReading({ subject: v }, 'sujet réel')}
                    color="#2A4D7A"
                    multiline={false}
                  />
                </div>
              </div>
            </Field>
          </Panel>
        </Stagger>

        <Stagger delay={0.1}>
          <Panel className="p-5 h-full">
            <Field label="Intention perçue">
              <div className="flex items-start gap-2">
                <Target className="w-4 h-4 mt-0.5 text-imagine-mature shrink-0" />
                <div className="flex-1 min-w-0">
                  <EditableText
                    value={r.intent}
                    onSave={(v) => editReading({ intent: v }, 'intention perçue')}
                    color="#C7A76C"
                  />
                </div>
              </div>
            </Field>
          </Panel>
        </Stagger>
      </div>

      <Stagger delay={0.15}>
        <Panel className="p-5 space-y-3">
          <Section
            title="Présupposés non dits"
            hint="ce que ta formulation tient pour acquis"
          >
            <ContestableList
              items={r.implicits}
              color="#8B949E"
              onReject={(item) => rejectItem('implicits', item)}
              onAdd={(item) => addItem('implicits', item)}
              placeholder="Un présupposé que l'IA n'a pas vu"
            />
          </Section>
        </Panel>
      </Stagger>

      <div className="grid gap-4 sm:grid-cols-2">
        {(['tensions', 'constraints'] as ListField[]).map((field, i) => (
          <Stagger key={field} delay={0.2 + i * 0.05}>
            <Panel className="p-5 space-y-3 h-full">
              <Section
                title={LIST_LABEL[field]}
                hint={field === 'tensions' ? "l'énoncé ne tient pas tout seul" : 'non négociables'}
                color={field === 'tensions' ? '#F87171' : '#A78BFA'}
              >
                <ContestableList
                  items={r[field]}
                  color={field === 'tensions' ? '#F87171' : '#A78BFA'}
                  onReject={(item) => rejectItem(field, item)}
                  onAdd={(item) => addItem(field, item)}
                  placeholder={
                    field === 'tensions'
                      ? "Une contradiction que l'IA rate"
                      : 'Une contrainte non négociable'
                  }
                />
              </Section>
            </Panel>
          </Stagger>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Stagger delay={0.3}>
          <Panel className="p-5 space-y-3 h-full">
            <Section title="Inconnues" hint="ce qui manque pour décider" color="#FFB347">
              <ContestableList
                items={r.unknowns}
                color="#FFB347"
                onReject={(item) => rejectItem('unknowns', item)}
                onAdd={(item) => addItem('unknowns', item)}
                placeholder="Une inconnue que l'IA n'a pas vue"
              />
            </Section>
          </Panel>
        </Stagger>

        <Stagger delay={0.35}>
          <Panel className="p-5 space-y-3 h-full">
            <Section title="Enjeu" color="#34D399">
              <EditableText
                value={r.stakes}
                onSave={(v) => editReading({ stakes: v }, 'enjeu')}
                color="#34D399"
              />
            </Section>
          </Panel>
        </Stagger>
      </div>

      <Stagger delay={0.4}>
        <Panel className="p-5" accent color="#4FD1C5">
          <div className="flex items-start gap-3">
            <MessageSquareWarning className="w-5 h-5 text-imagine-projection shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle">
                La question décisive
              </div>
              <EditableText
                value={r.decisiveQuestion}
                onSave={(v) => editReading({ decisiveQuestion: v }, 'question décisive')}
                color="#4FD1C5"
                className="text-lg font-light leading-relaxed"
              />
            </div>
          </div>
        </Panel>
      </Stagger>

      {/* La contestation */}
      <Stagger delay={0.45}>
        <Panel className="p-5 space-y-3">
          <Section
            title="L'IA s'est trompée"
            hint="ce qui ne correspond pas à ce que tu voulais dire"
            color="#F87171"
          >
            <textarea
              value={note}
              onChange={(e) => setLocalNote(e.target.value)}
              onBlur={() => note !== (corrections?.note ?? '') && setNote(note)}
              placeholder="Ce que je voulais dire en réalité… Plus le moteur s'en approche, plus les trajectoires seront justes."
              className="w-full min-h-[80px] bg-transparent text-sm text-imagine-text leading-relaxed outline-none resize-none placeholder:text-imagine-text-subtle"
            />

            {contested > 0 && (
              <div className="flex items-center gap-3 pt-1">
                <Button
                  variant="primary"
                  onClick={() => read({ refine: true })}
                  disabled={pending !== null}
                >
                  {pending === 'reading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Relire avec ma correction
                </Button>
                <span className="text-xs text-imagine-text-subtle">
                  {contested} correction{contested > 1 ? 's' : ''} — le moteur va affiner sa
                  lecture au lieu de repartir de zéro.
                </span>
              </div>
            )}
          </Section>
        </Panel>
      </Stagger>

      {error && <ErrorNote message={error} onRetry={() => read({ refine: true })} />}

      <Stagger delay={0.5}>
        <div className="flex items-center gap-4 pt-2 flex-wrap">
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