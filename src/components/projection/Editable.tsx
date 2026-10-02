'use client';

// ========================================
// IMAGINE - Editable Field
// Un champ de lecture que l'utilisateur peut reprendre
// ========================================

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Pencil, RotateCcw, Undo2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EditableText({
  value,
  onSave,
  color,
  placeholder,
  multiline = true,
  className,
  label = 'Modifier',
}: {
  value: string;
  onSave: (next: string) => void;
  color?: string;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  label?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [original, setOriginal] = useState(value);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(value);
      setOriginal(value);
    }
  }, [value, editing]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== value) onSave(next);
    else setDraft(value);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const revert = () => {
    onSave(original);
    setDraft(original);
  };

  if (!editing) {
    return (
      <div className="group relative">
        <p className={cn('text-sm text-imagine-text leading-relaxed whitespace-pre-wrap', className)}>
          {value || <span className="text-imagine-text-subtle italic">{placeholder}</span>}
        </p>
        <div className="absolute -top-7 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {value !== original && (
            <button
              onClick={revert}
              title="Revenir à la version de l'IA"
              className="p-1 rounded hover:bg-white/10 text-imagine-text-subtle hover:text-imagine-text transition-colors"
            >
              <Undo2 className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => setEditing(true)}
            title={label}
            className="p-1 rounded hover:bg-white/10 text-imagine-text-subtle transition-colors"
            style={color ? { color } : undefined}
          >
            <Pencil className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  const shared =
    'w-full bg-imagine-bg/60 border rounded-lg px-3 py-2 text-sm text-imagine-text leading-relaxed outline-none resize-none focus:border-imagine-projection/50';

  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      className="space-y-2"
    >
      {multiline ? (
        <textarea
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') cancel();
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit();
          }}
          className={cn(shared, 'min-h-[72px]')}
          style={color ? { borderColor: `${color}55` } : undefined}
        />
      ) : (
        <input
          ref={ref as React.RefObject<HTMLInputElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') cancel();
            if (e.key === 'Enter') commit();
          }}
          className={cn(shared, 'h-10')}
          style={color ? { borderColor: `${color}55` } : undefined}
        />
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={commit}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-imagine-projection/15 text-imagine-projection hover:bg-imagine-projection/25 transition-colors"
        >
          <Check className="w-3 h-3" />
          Garder
        </button>
        <button
          onClick={cancel}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-imagine-text-subtle hover:text-imagine-text hover:bg-white/5 transition-colors"
        >
          <X className="w-3 h-3" />
          Annuler
        </button>
        <span className="text-[11px] text-imagine-text-subtle">
          {multiline ? '⌘+Entrée pour valider' : 'Entrée pour valider'}
        </span>
      </div>
    </motion.div>
  );
}

// ========================================
// Liste contestable
// ========================================

export function ContestableList({
  items,
  color,
  onReject,
  onAdd,
  placeholder = 'Ajouter un élément',
  addLabel = 'Ajouter',
}: {
  items: string[];
  color?: string;
  onReject: (item: string) => void;
  onAdd: (item: string) => void;
  placeholder?: string;
  addLabel?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const submit = () => {
    const v = draft.trim();
    if (!v) {
      setAdding(false);
      return;
    }
    onAdd(v);
    setDraft('');
  };

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-2.5 group"
          >
            <span
              className="shrink-0 mt-[3px] text-[10px] opacity-60"
              style={{ color: color ?? '#8B949E' }}
            >
              ·
            </span>
            <p className="flex-1 text-sm text-imagine-text leading-relaxed">{item}</p>
            <button
              onClick={() => onReject(item)}
              title="L'IA s'est trompé sur ce point"
              className="shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-imagine-text-subtle hover:text-imagine-forge mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {adding ? (
        <div className="flex gap-2 pt-1">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') {
                setDraft('');
                setAdding(false);
              }
            }}
            placeholder={placeholder}
            className="flex-1 bg-imagine-bg/60 border border-white/10 rounded-md px-2.5 py-1.5 text-sm text-imagine-text outline-none focus:border-imagine-projection/50"
          />
          <button
            onClick={submit}
            className="px-2.5 py-1.5 rounded-md text-xs bg-imagine-projection/15 text-imagine-projection hover:bg-imagine-projection/25 transition-colors shrink-0"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              setDraft('');
              setAdding(false);
            }}
            className="px-2 py-1.5 rounded-md text-xs text-imagine-text-subtle hover:text-imagine-text transition-colors shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-imagine-text-subtle hover:text-imagine-text transition-colors pt-0.5"
        >
          <RotateCcw className="w-3 h-3" />
          {addLabel}
        </button>
      )}
    </div>
  );
}