'use client';

// ========================================
// IMAGINE - Verdict Step
// Ce qu'on retient — et ce qui prouverait qu'on a tort
// ========================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Circle,
  CircleCheck,
  CircleMinus,
  CircleX,
  EyeOff,
  Flag,
  Loader2,
  Pencil,
  RotateCcw,
  Scale,
  TriangleAlert,
} from 'lucide-react';
import { useImagineStore } from '@/store';
import { useTrace } from '@/hooks/useTrace';
import { cn } from '@/lib/utils';
import { Bullets, Button, ErrorNote, Panel, Quote, Section, Tag, Thinking } from './ui';
import {
  CRITERION_DIRECTION,
  weakestEvidence,
  isBlind,
} from '@/lib/trace';
import type { FalsifierCheck, FalsifierStatus } from '@/types';

// ========================================
// Un faux : ce qu'on en a fait
// ========================================

const FALSIFIER_STATE: Record<
  FalsifierStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: { label: 'jamais regardé', color: '#8B949E', icon: Circle },
  verified: { label: 'vérifié — la décision tient', color: '#34D399', icon: CircleCheck },
  refuted: { label: 'réfuté — la décision est fausse', color: '#F87171', icon: CircleX },
  dropped: { label: 'sans objet', color: '#FFB347', icon: CircleMinus },
};

function FalsifierRow({ check }: { check: FalsifierCheck }) {
  const trace = useImagineStore((s) => s.traces.find((t) => t.id === s.activeTraceId));
  const setStatus = useImagineStore((s) => s.setFalsifierStatus);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(check.note);

  if (!trace) return null;

  const state = FALSIFIER_STATE[check.status];
  const Icon = state.icon;

  const cycle: FalsifierStatus[] = ['pending', 'verified', 'refuted', 'dropped'];

  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-2.5 group">
        <span className="shrink-0 mt-0.5">
          <Icon className="w-4 h-4" style={{ color: state.color }} />
        </span>

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm leading-relaxed',
              check.status === 'pending' ? 'text-imagine-text-muted' : 'text-imagine-text'
            )}
          >
            {check.falsifier}
          </p>
          {check.note && (
            <p className="text-xs text-imagine-text-subtle mt-0.5 italic">{check.note}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {cycle.map((s) => {
            const st = FALSIFIER_STATE[s];
            const active = check.status === s;
            return (
              <button
                key={s}
                title={st.label}
                onClick={() => setStatus(trace.id, check.falsifier, s, note)}
                className={cn(
                  'w-5 h-5 rounded-md flex items-center justify-center transition-all',
                  active
                    ? 'ring-1'
                    : 'opacity-40 hover:opacity-100'
                )}
                style={
                  active
                    ? { color: st.color, boxShadow: `inset 0 0 0 1px ${st.color}` }
                    : { color: st.color }
                }
              >
                <st.icon className="w-3 h-3" />
              </button>
            );
          })}
          <button
            onClick={() => setNoteOpen((v) => !v)}
            title="Ajouter une note"
            className="w-5 h-5 rounded-md flex items-center justify-center text-imagine-text-subtle hover:text-imagine-text transition-colors"
          >
            <Pencil className="w-3 h-3" />
          </button>
        </div>
      </div>

      {check.status !== 'pending' && !noteOpen && (
        <div className="pl-6.5 text-[10px] uppercase tracking-[0.14em]" style={{ color: state.color }}>
          {state.label}
          {check.checkedAt && ` · ${new Date(check.checkedAt).toLocaleDateString('fr-FR')}`}
        </div>
      )}

      {noteOpen && (
        <div className="pl-6.5 flex gap-2">
          <input
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setStatus(trace.id, check.falsifier, check.status, note);
                setNoteOpen(false);
              }
            }}
            placeholder="Ce que tu as constaté"
            className="flex-1 bg-imagine-bg/60 border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-imagine-text outline-none focus:border-imagine-forge/50"
          />
          <button
            onClick={() => {
              setStatus(trace.id, check.falsifier, check.status, note);
              setNoteOpen(false);
            }}
            className="px-2 py-1.5 rounded-md text-xs bg-white/5 text-imagine-text-muted hover:text-imagine-text transition-colors"
          >
            <Check className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

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
  const live = trace.paths.filter((p) => p.status !== 'eliminated');
  const color = chosen?.color ?? '#34D399';
  const checks = v.checks ?? [];
  const pendingCount = checks.filter((c) => c.status === 'pending').length;
  const refutedCount = checks.filter((c) => c.status === 'refuted').length;
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

      {/* Falsificateurs : le seul endroit où une décision peut être cassée */}
      <Panel className="p-5 space-y-4">
        <Section
          title="Ce qui prouverait qu'on a tort"
          hint="la décision reste réversible tant que ça n'est pas arrivé"
          color="#F87171"
        >
          <Bullets items={v.falsifiers} color="#F87171" />
        </Section>

        {checks.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-white/5">
            <div className="text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle">
              Où on en est
            </div>

            {checks.map((c) => (
              <FalsifierRow key={c.falsifier} check={c} />
            ))}

            {refutedCount > 0 && (
              <p className="text-xs text-imagine-forge leading-relaxed pt-1">
                {refutedCount} faux prouve{refutedCount > 1 ? 's' : ''} : l&apos;arbitrage a
                été annulé et la décision rouverte. C&apos;est le système qui fonctionne.
              </p>
            )}

            {pendingCount > 0 && (
              <p className="text-xs text-imagine-text-subtle leading-relaxed pt-1">
                {pendingCount} encore en attente. Une décision qu&apos;on n&apos;a pas tentée
                d&apos;infirmer reste un pari.
              </p>
            )}
          </div>
        )}
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

      {/* Sur quoi tranche-t-on ? */}
      {trace.confrontation && live.length > 0 && (
        <Panel className="p-4">
          <div className="flex items-start gap-3">
            <EyeOff className="w-4 h-4 mt-0.5 shrink-0 text-imagine-text-subtle" />
            <div className="text-xs text-imagine-text-subtle leading-relaxed">
              {(() => {
                const weak = weakestEvidence(live);
                if (!weak || weak.level >= 3) {
                  return 'Toutes les trajectoires vivantes ont été descendues jusqu\'au mur. L\'arbitrage tranche sur de l\'observé.';
                }
                const blind = live.filter((p) => isBlind(p));
                return (
                  <>
                    {blind.length > 0 ? (
                      <>
                        {blind.length} trajectoire{blind.length > 1 ? 's' : ''} n
                        {blind.length > 1 ? ' ont' : ' a'} jamais été descendue
                        {blind.length > 1 ? 's' : ''}. Leur classement repose sur des déductions.
                      </>
                    ) : (
                      <>La moins documentée est « {weak.label} ».</>
                    )}{' '}
                    L&apos;arbitrage en tient compte — mais la décision reste un pari sur cette
                    partie.
                  </>
                );
              })()}
            </div>
          </div>
        </Panel>
      )}

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
              <Button
                variant="primary"
                color={color}
                onClick={commit}
                disabled={pendingCount > 0}
                title={
                  pendingCount > 0
                    ? `${pendingCount} faux jamais regardé — une décision non testée reste un pari`
                    : undefined
                }
              >
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

        {!committed && pendingCount > 0 && (
          <p className="text-xs text-imagine-text-subtle leading-relaxed">
            La validation attend que tu aies au moins jeté un œil aux faux. Si l&apos;un
            d&apos;eux te fait changer d&apos;avis, marque-le : l&apos;arbitrage s&apos;annule
            et la décision se rouvre.
          </p>
        )}
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

