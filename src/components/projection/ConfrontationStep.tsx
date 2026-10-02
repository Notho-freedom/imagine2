'use client';

// ========================================
// IMAGINE - Confrontation Step
// Mesurer plutôt que préférer
// ========================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Scale, Target } from 'lucide-react';
import { useImagineStore } from '@/store';
import { useTrace } from '@/hooks/useTrace';
import { cn } from '@/lib/utils';
import { Button, ErrorNote, Panel, Quote, ScoreBar, Section, Tag, Thinking } from './ui';
import CriteriaEditor from './CriteriaEditor';
import { enabledCriteria, weightedTotal } from '@/lib/trace';

export default function ConfrontationStep() {
  const trace = useImagineStore((s) => s.traces.find((t) => t.id === s.activeTraceId));
  const setTraceStep = useImagineStore((s) => s.setTraceStep);
  const { confront, arbitrate, pending, error } = useTrace();
  const [openRationale, setOpenRationale] = useState<string | null>(null);

  if (!trace) return null;

  const live = trace.paths.filter((p) => p.status !== 'eliminated');
  const c = trace.confrontation;

  /**
   * Tant que le moteur n'a pas mesuré, on affiche le total tel qu'il serait
   * avec les poids actuels, dès qu'une première mesure existe. Changer un
   * poids fait donc bouger le classement immédiatement, avant de re-mesurer.
   */
  const previewTotals = c
    ? c.rows.map((r) => ({
        pathId: r.pathId,
        total: weightedTotal(r.values, trace.criteria ?? []),
      }))
    : [];

  const handleConfront = async () => {
    const result = await confront();
    if (result) setOpenRationale(null);
  };

  if (live.length < 2) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4">
        <p className="text-sm text-imagine-text-subtle">
          Il faut au moins deux trajectoires vivantes pour qu&apos;il y ait quelque chose à confronter.
        </p>
        <Button variant="ghost" onClick={() => setTraceStep(3)}>
          Retour à la projection
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div className="space-y-2">
          <h2 className="text-2xl font-light text-imagine-text">
            Laquelle résiste le mieux&nbsp;?
          </h2>
          <p className="text-sm text-imagine-text-subtle max-w-xl leading-relaxed">
            Mesure sur des critères communs. Aucune trajectoire n&apos;est favorisée : une note haute
            doit pouvoir s&apos;appuyer sur un élément précis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleConfront} disabled={pending !== null}>
            {pending === 'confrontation' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Scale className="w-4 h-4" />
            )}
            {c ? 'Re-mesurer' : 'Confronter'}
          </Button>
          <Button
            variant="primary"
            onClick={() => arbitrate()}
            disabled={pending !== null || !c}
          >
            {pending === 'verdict' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Target className="w-4 h-4" />
            )}
            Arbitrer
          </Button>
        </div>
      </div>

      {error && <ErrorNote message={error} />}

      <CriteriaEditor />

      {pending === 'confrontation' && !c && (
        <Thinking
          label="Confrontation en cours"
          detail="Notation de chaque trajectoire sur les critères, avec justification."
          color="#FFB347"
        />
      )}

      {!c ? (
        <Panel className="p-8 text-center">
          <p className="text-sm text-imagine-text-subtle mb-4">
            La confrontation n&apos;a pas encore eu lieu.
          </p>
          <Button variant="primary" color="#FFB347" onClick={handleConfront}>
            Confronter les {live.length} trajectoires
          </Button>
        </Panel>
      ) : (
        <>
          {/* Matrice */}
          <Panel className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle font-normal">
                      Critère
                    </th>
                    {live.map((p) => {
                      const row = c.rows.find((r) => r.pathId === p.id);
                      const preview = previewTotals.find((t) => t.pathId === p.id)?.total;
                      const total = preview ?? row?.total ?? 0;
                      const best = Math.max(
                        0,
                        ...previewTotals.map((t) => t.total),
                        ...c.rows.map((r) => r.total)
                      );
                      const isBest = total === best;
                      return (
                        <th key={p.id} className="px-4 py-3.5 text-left">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: p.color }}
                            />
                            <span className="text-sm font-medium text-imagine-text">
                              {p.title}
                            </span>
                            {isBest && (
                              <span className="text-[10px] uppercase tracking-wide text-imagine-mature">
                                tête
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {c.criteria.map((crit) => (
                    <tr key={crit.key} className="border-b border-white/[0.04] last:border-0">
                      <td className="px-5 py-3.5 align-top">
                        <div className="text-sm text-imagine-text">{crit.label}</div>
                        <div className="text-[11px] text-imagine-text-subtle mt-0.5 leading-snug max-w-[220px]">
                          {crit.description}
                        </div>
                      </td>
                      {live.map((p) => {
                        const row = c.rows.find((r) => r.pathId === p.id);
                        const value = row?.values[crit.key] ?? 0;
                        return (
                          <td key={p.id} className="px-4 py-3.5 align-top">
                            <button
                              onClick={() =>
                                setOpenRationale(
                                  openRationale === `${p.id}:${crit.key}` ? null : `${p.id}:${crit.key}`
                                )
                              }
                              className="w-full text-left group"
                            >
                              <div className="flex items-baseline justify-between gap-2 mb-1.5">
                                <span
                                  className="text-sm tabular-nums font-medium"
                                  style={{ color: p.color }}
                                >
                                  {value}
                                </span>
                                <span className="text-[10px] text-imagine-text-subtle opacity-0 group-hover:opacity-100 transition-opacity">
                                  pourquoi
                                </span>
                              </div>
                              <ScoreBar value={value} color={p.color} />
                            </button>

                            {openRationale === `${p.id}:${crit.key}` && (
                              <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[11px] text-imagine-text-muted leading-relaxed mt-2 pl-0.5"
                              >
                                {row?.rationale[crit.key] || '—'}
                              </motion.p>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  <tr className="border-t border-white/10">
                    <td className="px-5 py-4 text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle">
                      Total
                    </td>
                    {live.map((p) => {
                      const row = c.rows.find((r) => r.pathId === p.id);
                      const total = previewTotals.find((t) => t.pathId === p.id)?.total ?? row?.total ?? 0;
                      const best = Math.max(
                        0,
                        ...previewTotals.map((t) => t.total),
                        ...c.rows.map((r) => r.total)
                      );
                      const isBest = total === best && total > 0;
                      return (
                        <td key={p.id} className="px-4 py-4">
                          <span
                            className={cn(
                              'text-lg tabular-nums font-light',
                              isBest ? 'font-medium' : 'text-imagine-text-muted'
                            )}
                            style={{ color: isBest ? p.color : undefined }}
                          >
                            {Math.round(total * 10) / 10}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Synthèse */}
          {c.synthesis && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid gap-5 lg:grid-cols-[1fr_320px]"
            >
              <Panel className="p-5">
                <Section title="Synthèse">
                  <p className="text-sm text-imagine-text leading-relaxed whitespace-pre-wrap">
                    {c.synthesis}
                  </p>
                </Section>
              </Panel>

              <Panel className="p-5" accent color="#FFB347">
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle">
                    Ce qui départage
                  </div>
                  <p className="text-sm text-imagine-text leading-relaxed">
                    {c.discriminator || '—'}
                  </p>
                </div>
              </Panel>
            </motion.div>
          )}

          {pending === 'verdict' && (
            <Thinking label="Arbitrage en cours" detail="Trancher, et dire ce qui le prouverait faux." />
          )}

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => arbitrate()}
              disabled={pending !== null}
            >
              {pending === 'verdict' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Target className="w-4 h-4" />
              )}
              Arbitrer
            </Button>
            <span className="text-xs text-imagine-text-subtle">
              Une seule trajectoire sera retenue. Les autres resteront au journal.
            </span>
          </div>
        </>
      )}

      {trace.verdict && (
        <Button variant="ghost" onClick={() => setTraceStep(6)}>
          Voir l&apos;arbitrage
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
