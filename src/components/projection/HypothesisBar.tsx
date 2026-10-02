'use client';

// ========================================
// IMAGINE - Hypothesis Bar
// « et si… ? » — disponible à n'importe quelle étape
// ========================================

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CornerDownLeft, GitBranch, Lightbulb, X } from 'lucide-react';
import { useImagineStore } from '@/store';
import { useTrace } from '@/hooks/useTrace';
import { cn } from '@/lib/utils';

export default function HypothesisBar() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activePathId = useImagineStore((s) => s.ui.activePathId);
  const step = useImagineStore((s) => s.ui.traceStep);
  const trace = useImagineStore((s) => s.traces.find((t) => t.id === s.activeTraceId));
  const { hypothesize } = useTrace();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA'].includes(target?.tagName ?? '');
      if (typing) return;

      if (e.key === 'h' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
        setValue('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  if (!trace) return null;

  const parent = trace.paths.find((p) => p.id === activePathId) ?? null;
  const submit = async () => {
    const v = value.trim();
    if (!v) return;
    await hypothesize(v);
    setValue('');
    setOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-[min(560px,calc(100vw-2rem))] rounded-2xl glass shadow-card-hover overflow-hidden"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
          >
            <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2">
              <GitBranch className="w-4 h-4 text-imagine-drift shrink-0" />
              <span className="text-xs text-imagine-text-muted">
                {parent ? (
                  <>
                    depuis{' '}
                    <span style={{ color: parent.color }}>{parent.title}</span>
                  </>
                ) : (
                  'depuis l\'idée initiale'
                )}
              </span>
            </div>

            <div className="px-4 pb-3">
              <textarea
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                  if (e.key === 'Escape') {
                    setOpen(false);
                    setValue('');
                  }
                }}
                rows={2}
                placeholder="Et si… ?"
                className="w-full bg-transparent text-lg text-imagine-text font-light leading-relaxed outline-none resize-none placeholder:text-imagine-text-subtle/70"
              />
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-white/5 bg-black/20">
              <span className="text-[11px] text-imagine-text-subtle">
                Entrée pour ouvrir · Échap pour fermer
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setOpen(false);
                    setValue('');
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-imagine-text-subtle hover:text-imagine-text hover:bg-white/5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={submit}
                  disabled={value.trim().length < 3}
                  className={cn(
                    'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                    value.trim().length >= 3
                      ? 'bg-imagine-drift/20 text-imagine-drift hover:bg-imagine-drift/30'
                      : 'text-imagine-text-subtle opacity-40 cursor-not-allowed'
                  )}
                >
                  Explorer
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <motion.div
              animate={{ opacity: focused ? 1 : 0.4 }}
              className="h-px"
              style={{
                background: focused
                  ? 'linear-gradient(90deg, #A78BFA, transparent)'
                  : 'linear-gradient(90deg, rgba(167,139,250,0.3), transparent)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setOpen(true)}
          title="Ouvrir une hypothèse  (H)"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass hover:border-imagine-drift/40 transition-colors group"
        >
          <Lightbulb className="w-4 h-4 text-imagine-drift group-hover:animate-pulse-glow" />
          <span className="text-xs text-imagine-text-muted group-hover:text-imagine-text transition-colors">
            Et si… ?
          </span>
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-imagine-text-subtle">
            H
          </kbd>
        </motion.button>
      )}

      {trace.status === 'arbitrated' && !open && (
        <span className="text-[11px] text-imagine-text-subtle pr-1">
          une hypothèse rouvrira la décision
        </span>
      )}
    </div>
  );
}
