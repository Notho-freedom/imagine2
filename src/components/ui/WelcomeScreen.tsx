'use client';

// ========================================
// IMAGINE - Welcome Screen
// L'accueil est ton travail, pas une publicité.
// Deux portes : une idée, ou une confusion.
// ========================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Clock, GitBranch, Sparkles, Split, Trash2 } from 'lucide-react';
import { useImagineStore } from '@/store';
import { cn } from '@/lib/utils';
import { deliberationOf, formatDuration } from '@/lib/trace';
import { ImagineMark, SparkGlyph } from '@/components/projection/marks';
import type { SeedKind } from '@/types';

export default function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const traces = useImagineStore((s) => s.traces);
  const createTrace = useImagineStore((s) => s.createTrace);
  const setActiveTrace = useImagineStore((s) => s.setActiveTrace);
  const deleteTrace = useImagineStore((s) => s.deleteTrace);
  const [confirm, setConfirm] = useState<string | null>(null);

  const start = (kind: SeedKind) => {
    createTrace({ seedKind: kind });
    onStart();
  };

  return (
    <div className="fixed inset-0 bg-imagine-bg overflow-y-auto">
      <div className="min-h-screen max-w-3xl mx-auto px-6 py-14 flex flex-col">
        {/* Tête */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <ImagineMark size={72} />
          </motion.div>

          <h1 className="text-4xl font-light text-imagine-text tracking-tight mb-2">
            IMAGINE
          </h1>
          <p className="text-sm text-imagine-text-subtle">
            Un moteur de décision qui garde la trace
          </p>
        </motion.div>

        {/* Les deux portes */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid gap-4 sm:grid-cols-2 mt-12"
        >
          <Door
            onClick={() => start('idea')}
            color="#FFB347"
            glyph={<SparkGlyph size={22} color="#FFB347" />}
            title="J'ai une idée"
            body="Tu sais ce que tu veux trancher. On la lit, on la déploie, on la pousse jusqu'à une décision."
            cta="Poser l'idée"
          />
          <Door
            onClick={() => start('confusion')}
            color="#A78BFA"
            glyph={<Split className="w-5 h-5" />}
            title="Je ne sais pas quoi décider"
            body="Ça arrive souvent. Écris ce qui te retourne — le moteur séparera les questions que tu n'arrives plus à distinguer."
            cta="Démêler"
          />
        </motion.div>

        {/* Tes tracés */}
        {traces.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-14"
          >
            <div className="flex items-center gap-2 text-imagine-text-muted text-xs mb-4 px-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Tes tracés</span>
              <span className="text-imagine-text-subtle/60">{traces.length}</span>
            </div>

            <div className="space-y-2">
              {traces.map((t, i) => {
                const d = deliberationOf(t);
                const open = confirm === t.id;
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.35 + i * 0.05 }}
                  >
                    <button
                      onClick={() => {
                        setActiveTrace(t.id);
                        onStart();
                      }}
                      className="w-full flex items-center gap-3.5 rounded-xl border border-white/5 bg-imagine-surface/40 px-4 py-3.5 text-left group transition-all hover:border-white/15 hover:bg-imagine-surface/70"
                    >
                      {/* Les couleurs du parcours */}
                      <div className="flex -space-x-1 shrink-0">
                        {t.paths.length > 0 ? (
                          t.paths.slice(0, 4).map((p) => (
                            <span
                              key={p.id}
                              className="w-2.5 h-2.5 rounded-full border-2 border-imagine-bg"
                              style={{ background: p.color }}
                            />
                          ))
                        ) : (
                          <span
                            className="w-2.5 h-2.5 rounded-full border-2 border-imagine-bg"
                            style={{ background: t.seedKind === 'confusion' ? '#A78BFA' : '#FFB347' }}
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-imagine-text truncate group-hover:text-imagine-projection transition-colors">
                            {t.title}
                          </span>
                          {t.status === 'arbitrated' && (
                            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-imagine-mature/15 text-imagine-mature">
                            tranché
                            </span>
                          )}
                          {t.seedKind === 'confusion' && t.decisions.length > 1 && (
                            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-imagine-drift/15 text-imagine-drift">
                              {t.decisions.length} décisions
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-imagine-text-subtle mt-0.5 truncate">
                          {t.spark || 'Idée non posée'}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-imagine-text-subtle/70">
                          <span>{formatDuration(d.totalMs)}</span>
                          {d.descentes > 0 && (
                            <>
                              <span>·</span>
                              <span>{d.descentes} passages</span>
                            </>
                          )}
                          {d.pending > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-imagine-spark/80">
                                {d.pending} faux à vérifier
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <ArrowRight className="w-4 h-4 text-imagine-text-subtle opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>

                    <div className="flex justify-end -mt-1 px-2">
                      {open ? (
                        <span className="flex items-center gap-1.5 py-1">
                          <span className="text-[11px] text-imagine-forge">
                            Supprimer&nbsp;?
                          </span>
                          <button
                            onClick={() => {
                              deleteTrace(t.id);
                              setConfirm(null);
                            }}
                            className="px-2 py-1 rounded-md bg-imagine-forge/15 text-imagine-forge text-[11px] hover:bg-imagine-forge/25 transition-colors"
                          >
                            Oui
                          </button>
                          <button
                            onClick={() => setConfirm(null)}
                            className="px-2 py-1 rounded-md text-imagine-text-subtle text-[11px] hover:bg-white/5 transition-colors"
                          >
                            Non
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirm(t.id)}
                          title="Supprimer ce tracé"
                          className="p-1.5 rounded-md text-imagine-text-subtle/40 opacity-0 hover:text-imagine-forge hover:bg-imagine-forge/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        <div className="flex-1" />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-[11px] text-imagine-text-subtle/50 text-center leading-relaxed"
        >
          Sept étapes, de l&apos;étincelle au tracé. Tu repars avec une décision
          <br />
          et la chaîne entière qui y mène.
        </motion.p>
      </div>
    </div>
  );
}

function Door({
  onClick,
  color,
  glyph,
  title,
  body,
  cta,
}: {
  onClick: () => void;
  color: string;
  glyph: React.ReactNode;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <motion.button
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      onClick={onClick}
      className="group relative text-left rounded-2xl border border-white/5 bg-imagine-surface/40 p-5 overflow-hidden transition-colors hover:border-white/15"
      style={{ ['--door' as string]: color }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(120% 100% at 0% 0%, ${color}12, transparent 60%)` }}
      />
      <div className="relative space-y-3">
        <span
          className="inline-flex items-center justify-center w-11 h-11 rounded-xl"
          style={{ background: `${color}18`, border: `1px solid ${color}33` }}
        >
          {glyph}
        </span>
        <div className="text-base font-medium text-imagine-text">{title}</div>
        <p className="text-xs text-imagine-text-subtle leading-relaxed">{body}</p>
        <div
          className="flex items-center gap-1.5 pt-1 text-xs font-medium transition-transform group-hover:translate-x-0.5"
          style={{ color }}
        >
          {cta}
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </motion.button>
  );
}