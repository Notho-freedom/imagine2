'use client';

// ========================================
// IMAGINE - Projection Primitives
// ========================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// ========================================
// Panel
// ========================================

export function Panel({
  children,
  className,
  color,
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-imagine-surface/70 backdrop-blur-sm',
        color ? 'border-white/5' : 'border-white/5',
        accent && 'shadow-card-deep',
        className
      )}
      style={accent && color ? { boxShadow: `0 0 0 1px ${color}22, 0 8px 32px rgba(0,0,0,0.5)` } : undefined}
    >
      {children}
    </div>
  );
}

// ========================================
// Section
// ========================================

export function Section({
  title,
  hint,
  color,
  children,
  right,
}: {
  title: string;
  hint?: string;
  color?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2.5">
          {color && (
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0 translate-y-[-1px]"
              style={{ background: color }}
            />
          )}
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-imagine-text-muted">
            {title}
          </h3>
          {hint && <span className="text-xs text-imagine-text-subtle">{hint}</span>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

// ========================================
// Quote - la voix de l'IA, mise en valeur
// ========================================

export function Quote({
  children,
  color = '#4FD1C5',
  label,
}: {
  children: React.ReactNode;
  color?: string;
  label?: string;
}) {
  return (
    <div
      className="relative rounded-lg pl-4 py-1"
      style={{ borderLeft: `2px solid ${color}` }}
    >
      {label && (
        <div className="text-[10px] uppercase tracking-[0.18em] mb-1 opacity-70" style={{ color }}>
          {label}
        </div>
      )}
      <div className="text-imagine-text text-sm leading-relaxed">{children}</div>
    </div>
  );
}

// ========================================
// Bullets
// ========================================

export function Bullets({
  items,
  color,
  numbered = false,
  empty = 'Rien ici.',
}: {
  items: string[];
  color?: string;
  numbered?: boolean;
  empty?: string;
}) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-imagine-text-subtle italic">{empty}</p>;
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm text-imagine-text leading-relaxed">
          <span
            className="shrink-0 mt-[3px] text-[10px] tabular-nums opacity-60"
            style={{ color: color ?? '#8B949E' }}
          >
            {numbered ? String(i + 1).padStart(2, '0') : '·'}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ========================================
// Champ label/valeur
// ========================================

export function Field({
  label,
  children,
  color,
}: {
  label: string;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="space-y-1">
      <div
        className="text-[10px] uppercase tracking-[0.16em] text-imagine-text-subtle"
        style={color ? { color } : undefined}
      >
        {label}
      </div>
      <div className="text-sm text-imagine-text leading-relaxed">{children}</div>
    </div>
  );
}

// ========================================
// Boutons
// ========================================

export function Button({
  children,
  onClick,
  disabled,
  variant = 'ghost',
  color,
  className,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'quiet' | 'danger';
  color?: string;
  className?: string;
  type?: 'button' | 'submit';
}) {
  const palette = color ?? '#4FD1C5';

  const styles: Record<string, string> = {
    primary: 'text-imagine-bg font-semibold',
    ghost: 'text-imagine-text border border-white/10 hover:border-white/25',
    quiet: 'text-imagine-text-muted hover:text-imagine-text hover:bg-white/5',
    danger: 'text-imagine-forge border border-imagine-forge/30 hover:bg-imagine-forge/10',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm transition-all',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        styles[variant],
        className
      )}
      style={
        variant === 'primary'
          ? { background: palette, boxShadow: `0 4px 20px ${palette}33` }
          : undefined
      }
    >
      {children}
    </button>
  );
}

// ========================================
// États
// ========================================

export function Thinking({
  label,
  detail,
  color = '#4FD1C5',
}: {
  label: string;
  detail?: string;
  color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-start gap-3 rounded-xl border border-white/5 bg-imagine-surface/60 px-4 py-4"
      style={{ boxShadow: `inset 0 0 30px ${color}0D` }}
    >
      <Loader2 className="w-4 h-4 mt-0.5 animate-spin shrink-0" style={{ color }} />
      <div>
        <div className="text-sm font-medium" style={{ color }}>
          {label}
        </div>
        {detail && (
          <div className="text-xs text-imagine-text-subtle mt-1 leading-relaxed">{detail}</div>
        )}
      </div>
    </motion.div>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-imagine-forge/30 bg-imagine-forge/5 px-4 py-3">
      <AlertTriangle className="w-4 h-4 mt-0.5 text-imagine-forge shrink-0" />
      <div className="flex-1">
        <div className="text-sm text-imagine-text">{message}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs text-imagine-forge hover:underline"
          >
            Réessayer
          </button>
        )}
      </div>
    </div>
  );
}

export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center text-center py-20 px-6"
    >
      <div className="w-14 h-14 rounded-full border border-dashed border-imagine-projection/30 flex items-center justify-center mb-6">
        <Sparkles className="w-5 h-5 text-imagine-projection/50" />
      </div>
      <h2 className="text-lg font-medium text-imagine-text mb-2">{title}</h2>
      {children && (
        <p className="text-sm text-imagine-text-subtle max-w-md leading-relaxed">{children}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}

// ========================================
// Barre de score
// ========================================

export function ScoreBar({
  value,
  color,
  height = 'h-1.5',
  className,
}: {
  value: number;
  color: string;
  height?: string;
  className?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('w-full rounded-full bg-white/5 overflow-hidden', height, className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${v}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ background: color, boxShadow: `0 0 12px ${color}66` }}
      />
    </div>
  );
}

// ========================================
// Tag
// ========================================

export function Tag({
  children,
  color,
  className,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium',
        className
      )}
      style={
        color
          ? { color, background: `${color}18`, border: `1px solid ${color}33` }
          : undefined
      }
    >
      {children}
    </span>
  );
}

// ========================================
// Animate helper
// ========================================

export function Stagger({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}

export function Fade({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={String(delay)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}