'use client';

// ========================================
// IMAGINE - Marks
// Les marques du parcours. Dessinées, pas importées.
// ========================================

import React from 'react';
import { motion } from 'framer-motion';
import type { TraceStepKind } from '@/types';

// ========================================
// Chaque étape a sa marque.
// Pas d'icône générique : un signe qui dit ce qui s'y passe.
// ========================================

export const STEP_MARKS: Record<TraceStepKind, React.ReactNode> = {
  // L'étincelle : une étoile qui n'existe pas encore
  intake: (
    <>
      <path d="M12 3v5M12 16v5M3 12h5M16 12h5" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3.2" strokeWidth="1.4" fill="none" />
    </>
  ),

  // La lecture : un regard
  reading: (
    <>
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        strokeWidth="1.3"
        fill="none"
      />
      <circle cx="12" cy="12" r="2.8" strokeWidth="1.3" fill="none" />
      <path d="M12 9.2V6.8" strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),

  // La projection : une étoile qui se divise
  projection: (
    <>
      <path d="M12 12 4 5M12 12l8-7M12 12v8" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" strokeWidth="1.3" fill="none" />
      <circle cx="4" cy="5" r="1.6" strokeWidth="1.3" fill="none" />
      <circle cx="20" cy="5" r="1.6" strokeWidth="1.3" fill="none" />
      <circle cx="12" cy="20" r="1.6" strokeWidth="1.3" fill="none" />
    </>
  ),

  // La descente : un puits
  descent: (
    <>
      <path d="M12 3v13" strokeWidth="1.4" strokeLinecap="round" />
      <path d="m8 12 4 4 4-4" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20h16" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),

  // La confrontation : une balance
  confrontation: (
    <>
      <path d="M12 4v16" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5 7h14" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5 7 2.5 13h5L5 7ZM19 7l-2.5 6h5L19 7Z" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
      <path d="M9 20h6" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),

  // L'arbitrage : un choix net
  verdict: (
    <>
      <path d="M4 12h6" strokeWidth="1.5" strokeLinecap="round" />
      <path d="m9 7 5 5-5 5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 20h6" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),

  // Le tracé : une ligne qui laisse une empreinte
  ledger: (
    <>
      <path
        d="M3 19c3-9 6-14 9-14s6 5 9 14"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="12" cy="5" r="1.8" strokeWidth="1.3" fill="none" />
    </>
  ),
};

export function StepMark({
  kind,
  size = 22,
  color = 'currentColor',
  strokeWidth,
  className,
}: {
  kind: TraceStepKind;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth ?? 1.3}
      className={className}
      aria-hidden
    >
      {STEP_MARKS[kind]}
    </svg>
  );
}

// ========================================
// La marque IMAGINE
// Une étincelle qui devient constellation
// ========================================

export function ImagineMark({
  size = 40,
  animate = true,
  className,
}: {
  size?: number;
  animate?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-label="IMAGINE"
    >
      <defs>
        <linearGradient id="imagine-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4FD1C5" />
          <stop offset="55%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#FFB347" />
        </linearGradient>
      </defs>

      {/* Le germe */}
      <circle cx="24" cy="24" r="3.4" fill="url(#imagine-mark)" />

      {/* Les trajectories qui s'en échappent */}
      {[
        { d: 'M24 24 L10 13', delay: 0 },
        { d: 'M24 24 L38 12', delay: 0.12 },
        { d: 'M24 24 L12 37', delay: 0.24 },
        { d: 'M24 24 L37 34', delay: 0.36 },
      ].map((branch, i) => (
        <motion.path
          key={i}
          d={branch.d}
          stroke={['#4FD1C5', '#A78BFA', '#F87171', '#FFB347'][i]}
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: branch.delay, ease: 'easeOut' }}
        />
      ))}

      {/* Les points d'arrivée */}
      {[
        { x: 10, y: 13, c: '#4FD1C5', delay: 0.5 },
        { x: 38, y: 12, c: '#A78BFA', delay: 0.62 },
        { x: 12, y: 37, c: '#F87171', delay: 0.74 },
        { x: 37, y: 34, c: '#FFB347', delay: 0.86 },
      ].map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="1.9"
          fill={p.c}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, delay: p.delay, ease: 'backOut' }}
          style={{ transformOrigin: `${p.x}px ${p.y}px` }}
        />
      ))}
    </svg>
  );
}

// ========================================
// Étincelle — le geste de poser une idée
// ========================================

export function SparkGlyph({
  size = 16,
  color = 'currentColor',
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22" />
      <path d="m5.6 5.6 2.4 2.4M16 16l2.4 2.4M18.4 5.6 16 8M8 16l-2.4 2.4" opacity="0.6" />
      <circle cx="12" cy="12" r="3" fill={color} fillOpacity="0.18" />
    </svg>
  );
}

// ========================================
// Épreuve — pour les falsificateurs
// ========================================

export function ProofGlyph({
  size = 16,
  color = 'currentColor',
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* Une question posée à un mur */}
      <path d="M5 4v16" strokeDasharray="2 3" opacity="0.7" />
      <circle cx="5" cy="4" r="1.8" />
      <path d="M13 7c0-1.7 1.4-3 3-3s3 1.3 3 3c0 2.4-3 2.6-3 5" />
      <circle cx="16" cy="15.5" r="0.9" fill={color} stroke="none" />
    </svg>
  );
}