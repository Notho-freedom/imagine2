'use client';

// ========================================
// IMAGINE - Welcome Screen
// La porte d'entrée : on commence par un tracé, pas par une carte
// ========================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Clock,
  GitBranch,
  Plus,
  Scale,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useImagineStore } from '@/store';
import { TRACE_STEPS } from '@/lib/trace';

interface WelcomeScreenProps {
  onStart: () => void;
}

interface FloatingSpark {
  id: string;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
}

const STEP_ICON: Record<string, React.ElementType> = {
  intake: Zap,
  reading: Sparkles,
  projection: GitBranch,
  descent: TrendingUp,
  confrontation: Scale,
  verdict: Target,
  ledger: Clock,
};

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const { traces, createTrace, setActiveTrace } = useImagineStore();
  const [floatingSparks, setFloatingSparks] = useState<FloatingSpark[]>([]);

  useEffect(() => {
    const colors = ['#4FD1C5', '#A78BFA', '#FFB347', '#F472B6'];
    setFloatingSparks(
      colors.map((color, i) => ({
        id: `spark-${i}`,
        x: 10 + Math.random() * 78,
        y: 16 + Math.random() * 66,
        color,
        size: 26 + Math.random() * 14,
        delay: i * 2,
      }))
    );
  }, []);

  const startFresh = () => {
    createTrace();
    onStart();
  };

  const openTrace = (id: string) => {
    setActiveTrace(id);
    onStart();
  };

  return (
    <div className="fixed inset-0 bg-imagine-bg overflow-hidden">
      {/* Constellation */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60">
        {Array.from({ length: 40 }).map((_, i) => {
          const x = (i * 37) % 100;
          const y = (i * 61) % 100;
          const x2 = ((i + 1) * 37) % 100;
          const y2 = ((i + 1) * 61) % 100;
          return (
            <g key={i}>
              <line
                x1={`${x}%`}
                y1={`${y}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke="#4FD1C5"
                strokeWidth="0.4"
                strokeOpacity="0.08"
              />
              <circle
                cx={`${x}%`}
                cy={`${y}%`}
                r={1 + (i % 3)}
                fill="#E6EDF3"
                opacity={0.15 + (i % 4) * 0.08}
              >
                <animate
                  attributeName="opacity"
                  values="0.1;0.35;0.1"
                  dur={`${4 + (i % 5)}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          );
        })}
      </svg>

      {/* Trajectoires flottantes */}
      <AnimatePresence>
        {floatingSparks.map((spark) => (
          <motion.div
            key={spark.id}
            className="absolute pointer-events-none"
            style={{ left: `${spark.x}%`, top: `${spark.y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 0.5,
              scale: 1,
              x: [0, 12, -12, 0],
              y: [0, -18, 6, 0],
            }}
            transition={{
              opacity: { duration: 1 },
              scale: { duration: 0.6, delay: spark.delay * 0.2 },
              x: { duration: 9 + spark.delay, repeat: Infinity, ease: 'easeInOut' },
              y: { duration: 7 + spark.delay, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <div
              className="rounded-full blur-2xl"
              style={{
                width: spark.size * 3,
                height: spark.size * 3,
                background: spark.color,
                opacity: 0.16,
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Nébuleuses */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br from-imagine-nebula/25 via-imagine-intuition/10 to-transparent blur-3xl"
        animate={{ x: [0, 80, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        style={{ top: '-10%', left: '8%' }}
      />
      <motion.div
        className="absolute w-[520px] h-[520px] rounded-full bg-gradient-to-br from-imagine-projection/15 via-transparent to-imagine-intuition/10 blur-3xl"
        animate={{ x: [0, -60, 0], y: [0, 60, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        style={{ bottom: '4%', right: '4%' }}
      />

      {/* Contenu */}
      <div className="relative z-10 min-h-screen overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="mb-8"
              >
                <motion.div
                  className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-imagine-projection via-imagine-intuition to-imagine-nebula mb-5 relative"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(79, 209, 197, 0.25)',
                      '0 0 44px rgba(79, 209, 197, 0.45)',
                      '0 0 20px rgba(79, 209, 197, 0.25)',
                    ],
                  }}
                  transition={{ duration: 3.5, repeat: Infinity }}
                >
                  <Sparkles className="w-9 h-9 text-white" />
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full bg-imagine-projection"
                      animate={{
                        x: [0, Math.cos((i * 60 * Math.PI) / 180) * 46],
                        y: [0, Math.sin((i * 60 * Math.PI) / 180) * 46],
                        opacity: [0.75, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: 'easeOut',
                      }}
                    />
                  ))}
                </motion.div>

                <h1 className="text-5xl font-bold text-imagine-text mb-2 tracking-tight">
                  IMAGINE
                </h1>
                <p className="text-lg text-imagine-text-muted">
                  Le moteur de décision traçable
                </p>
              </motion.div>

              <p className="text-sm text-imagine-text-subtle leading-relaxed max-w-xl mx-auto mb-10">
                Tu avances une idée. Le moteur te montre ce qu&apos;il a compris, projette les
                trajectoires possibles, t&apos;aide à descendre dans chacune jusqu&apos;au mur, puis
                tranche. Tu repars avec une décision — et le chemin entier qui y mène.
              </p>

              <motion.button
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.99 }}
                onClick={startFresh}
                className="group relative inline-flex items-center gap-3 px-9 py-4.5 rounded-2xl bg-gradient-to-r from-imagine-projection to-imagine-projection-light text-imagine-bg font-semibold text-lg transition-all"
                style={{ paddingTop: '1.1rem', paddingBottom: '1.1rem' }}
              >
                <Zap className="w-5 h-5" />
                <span>Nouveau tracé</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-imagine-projection opacity-0 blur-2xl -z-10"
                  animate={{ opacity: [0.25, 0.45, 0.25] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.button>
            </motion.div>

            {/* Tracés existants */}
            {traces.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="mt-14 text-left bg-imagine-bg-elevated/30 backdrop-blur-sm rounded-2xl p-5 border border-white/5"
              >
                <div className="flex items-center gap-2 text-imagine-text-muted text-sm mb-4">
                  <Clock className="w-4 h-4" />
                  <span>Tracés</span>
                </div>
                <div className="space-y-2">
                  {traces.slice(0, 6).map((t, index) => (
                    <motion.button
                      key={t.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: 0.5 + index * 0.06 }}
                      whileHover={{ x: 4 }}
                      onClick={() => openTrace(t.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group bg-white/[0.02] hover:bg-white/[0.05]"
                    >
                      <div className="flex -space-x-1.5 shrink-0">
                        {t.paths.slice(0, 4).map((p) => (
                          <span
                            key={p.id}
                            className="w-2.5 h-2.5 rounded-full border-2 border-imagine-bg-elevated"
                            style={{ background: p.color }}
                          />
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-imagine-text truncate group-hover:text-imagine-projection transition-colors">
                          {t.title}
                        </p>
                        <p className="text-xs text-imagine-text-subtle truncate">
                          {t.paths.length} trajectoire{t.paths.length > 1 ? 's' : ''}
                          {t.verdict ? ' · tranché' : t.reading ? ' · en cours' : ' · à lire'}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-imagine-text-subtle opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Le parcours */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-14"
            >
              <div className="text-[10px] uppercase tracking-[0.18em] text-imagine-text-subtle text-center mb-6">
                Le parcours d&apos;un tracé
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {TRACE_STEPS.map((s, i) => {
                  const Icon = STEP_ICON[s.kind] ?? Sparkles;
                  return (
                    <motion.div
                      key={s.kind}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.65 + i * 0.06 }}
                      className="rounded-lg border border-white/5 bg-white/[0.02] px-2 py-3 text-center"
                    >
                      <Icon className="w-4 h-4 mx-auto mb-2 text-imagine-projection/70" />
                      <div className="text-[10px] tabular-nums text-imagine-text-subtle">
                        {String(s.index).padStart(2, '0')}
                      </div>
                      <div className="text-[11px] text-imagine-text-muted mt-0.5 leading-tight">
                        {s.label}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="mt-10 text-xs text-imagine-text-subtle text-center"
            >
              Le canvas reste accessible : c&apos;est la vue Carte, pour travailler en spatial.
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
}