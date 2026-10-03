'use client';

// ========================================
// IMAGINE - Eliminate
// Écarter demande pourquoi. On peut ne pas répondre,
// mais ce qui est abandonné sans raison n'est pas une décision.
// ========================================

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ThoughtPath } from '@/types';

const HINTS = [
  'Elle ne répond pas à la bonne question',
  'Son coût dépasse ce qu\'on cherchait',
  'On a trouvé mieux',
  'Elle exige quelque chose qu\'on ne veut pas lâcher',
  'Impossible à tester avant l\'échéance',
];

export function EliminateDialog({
  path,
  onConfirm,
  onCancel,
}: {
  path: ThoughtPath;
  onConfirm: (because: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const submit = () => {
    onConfirm(reason.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 bg-imagine-bg/70 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
        }}
        className="w-full max-w-lg rounded-2xl glass p-6 shadow-card-hover"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-imagine-forge" />
              <h3 className="text-base font-medium text-imagine-text">
                Écarter « {path.title} »
              </h3>
            </div>
            <p className="text-xs text-imagine-text-subtle mt-2 leading-relaxed">
              Elle reste visible et exportable. Une seule question : qu&apos;est-ce qui a
              fait pencher la balance ? C&apos;est la première chose qu&apos;on cherchera en
              relisant ce tracé dans six mois.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="shrink-0 p-1.5 rounded-lg text-imagine-text-subtle hover:text-imagine-text hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <textarea
          ref={ref}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onCancel();
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
          }}
          rows={2}
          placeholder="Elle…"
          className="w-full mt-4 bg-imagine-bg/60 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-imagine-text leading-relaxed outline-none resize-none focus:border-imagine-forge/50 placeholder:text-imagine-text-subtle/60"
        />

        <div className="flex flex-wrap gap-1.5 mt-3">
          {HINTS.map((h) => (
            <button
              key={h}
              onClick={() => setReason(h)}
              className={cn(
                'px-2 py-1 rounded-md text-[11px] transition-colors border',
                reason === h
                  ? 'border-imagine-forge/50 bg-imagine-forge/10 text-imagine-forge'
                  : 'border-white/8 text-imagine-text-subtle hover:text-imagine-text hover:border-white/20'
              )}
            >
              {h}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-white/5">
          <span className="text-[11px] text-imagine-text-subtle">
            Tu peux laisser vide — mais alors ce sera noté.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg text-xs text-imagine-text-subtle hover:text-imagine-text hover:bg-white/5 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={submit}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-imagine-forge/15 text-imagine-forge hover:bg-imagine-forge/25 transition-colors"
            >
              Écarter
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Le composant prêt à poser une question d'écartement. */
export function useEliminate() {
  const [target, setTarget] = useState<ThoughtPath | null>(null);
  return { target, ask: setTarget, clear: () => setTarget(null) };
}

export function EliminateLayer({
  target,
  onConfirm,
  onCancel,
}: {
  target: ThoughtPath | null;
  onConfirm: (because: string) => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {target && (
        <EliminateDialog path={target} onConfirm={onConfirm} onCancel={onCancel} />
      )}
    </AnimatePresence>
  );
}