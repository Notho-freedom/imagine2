'use client';

// ========================================
// IMAGINE - Ledger Step
// Le tracé : la chaîne complète, auditable, exportable
// ========================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Copy,
  Download,
  FileText,
  Sparkles,
  User,
} from 'lucide-react';
import { useImagineStore } from '@/store';
import { useTrace } from '@/hooks/useTrace';
import { cn } from '@/lib/utils';
import { downloadTrace, traceToMarkdown } from '@/lib/trace';
import { Button, Panel, Quote, Section, Stagger } from './ui';
import type { TraceEventKind } from '@/types';

const EVENT_COLOR: Record<TraceEventKind, string> = {
  statement: '#FFB347',
  reading: '#4FD1C5',
  correction: '#8B949E',
  projection: '#A78BFA',
  descent: '#60A5FA',
  elimination: '#8B949E',
  confrontation: '#FFB347',
  verdict: '#34D399',
  commitment: '#34D399',
};

function time(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function LedgerStep() {
  const trace = useImagineStore((s) => s.traces.find((t) => t.id === s.activeTraceId));
  const { setStep } = useTrace();
  const [copied, setCopied] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(false);

  if (!trace) return null;

  const chosen = trace.paths.find((p) => p.id === trace.verdict?.recommendedPathId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(traceToMarkdown(trace));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShowMarkdown(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <Stagger>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="space-y-2">
            <h2 className="text-2xl font-light text-imagine-text">Le tracé</h2>
            <p className="text-sm text-imagine-text-subtle max-w-xl leading-relaxed">
              Tout ce qui a été dit, proposé, écarté et décidé — dans l&apos;ordre, sans coupure.
              C&apos;est le livrable.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier
                </>
              )}
            </Button>
            <Button variant="primary" onClick={() => downloadTrace(trace)}>
              <Download className="w-4 h-4" />
              Exporter
            </Button>
          </div>
        </div>
      </Stagger>

      {/* Résumé */}
      {chosen && trace.verdict && (
        <Stagger delay={0.05}>
          <Panel className="p-5" accent color={chosen.color}>
            <div className="flex items-start gap-3">
              <span
                className="w-1 self-stretch rounded-full shrink-0"
                style={{ background: chosen.color }}
              />
              <div className="min-w-0 space-y-2">
                <div className="text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle">
                  Retenu
                </div>
                <div className="text-lg text-imagine-text font-light leading-snug">
                  {chosen.title}
                </div>
                <p className="text-sm text-imagine-text-muted leading-relaxed">
                  {trace.verdict.closing}
                </p>
              </div>
            </div>
          </Panel>
        </Stagger>
      )}

      {/* Journal */}
      <Stagger delay={0.1}>
        <Section title="Journal" hint={`${trace.events.length} événements`}>
          <div className="space-y-0">
            {trace.events.map((e, i) => {
              const color = e.color ?? EVENT_COLOR[e.kind];
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.4) }}
                  className="relative flex gap-4 pb-6 last:pb-0"
                >
                  <div className="relative flex flex-col items-center shrink-0">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{
                        background: color,
                        boxShadow: `0 0 10px ${color}66`,
                      }}
                    />
                    {i < trace.events.length - 1 && (
                      <div className="w-px flex-1 mt-1 bg-white/[0.07]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 -mt-0.5">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm text-imagine-text">{e.label}</span>
                      <span
                        className="text-[10px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded"
                        style={{ color, background: `${color}14` }}
                      >
                        {e.kind}
                      </span>
                      <span className="text-[11px] text-imagine-text-subtle">{time(e.createdAt)}</span>
                      <span className="text-[11px] text-imagine-text-subtle flex items-center gap-1">
                        {e.actor === 'user' ? (
                          <User className="w-3 h-3" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        {e.actor === 'user' ? 'toi' : 'IA'}
                      </span>
                    </div>

                    {e.detail && (
                      <p className="text-sm text-imagine-text-muted leading-relaxed mt-1.5">
                        {e.detail}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Section>
      </Stagger>

      {/* Livrables */}
      <Stagger delay={0.15}>
        <Panel className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <FileText className="w-4 h-4 mt-0.5 text-imagine-projection shrink-0" />
            <div className="text-sm text-imagine-text-muted leading-relaxed">
              L&apos;export produit un document Markdown complet : l&apos;étincelle, la lecture, les
              trajectoires, chaque descente avec son mur, la matrice de confrontation, l&apos;arbitrage,
              et ce journal. C&apos;est la trace que tu emportes.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié' : 'Copier le Markdown'}
            </Button>
            <Button
              variant="quiet"
              onClick={() => setShowMarkdown((v) => !v)}
            >
              {showMarkdown ? 'Masquer' : 'Aperçu'}
            </Button>
          </div>

          {showMarkdown && (
            <motion.pre
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="max-h-[420px] overflow-auto rounded-lg border border-white/5 bg-imagine-bg/60 p-4 text-[11px] leading-relaxed text-imagine-text-muted whitespace-pre-wrap font-mono"
            >
              {traceToMarkdown(trace)}
            </motion.pre>
          )}
        </Panel>
      </Stagger>

      {!trace.verdict && (
        <button
          onClick={() => setStep(2)}
          className={cn('text-xs text-imagine-text-subtle hover:text-imagine-text transition-colors')}
        >
          Le tracé est encore ouvert. Revenir à l&apos;idée →
        </button>
      )}

      {trace.verdict && !chosen && (
        <Quote color="#8B949E" label="Note">
          L&apos;arbitrage n&apos;a pas encore été validé.
        </Quote>
      )}
    </div>
  );
}
