// ========================================
// IMAGINE - Trace Utilities
// Palette des trajectoires, critères, export du tracé
// ========================================

import type {
  ComparisonCriterion,
  ThoughtPath,
  ThoughtTrace,
  TraceEvent,
  TraceEventKind,
  TraceStepMeta,
} from '@/types';
import { generateId } from '@/lib/utils';

// ========================================
// Palette des trajectoires
// Chaque possibilité porte une couleur. Elle ne change jamais.
// ========================================

export const PATH_PALETTE = [
  '#4FD1C5', // cyan
  '#A78BFA', // violet
  '#FFB347', // ambre
  '#F87171', // rouge
  '#60A5FA', // bleu
  '#34D399', // vert
  '#F472B6', // rose
  '#E879F9', // fuchsia
] as const;

export function pathColor(index: number): string {
  return PATH_PALETTE[index % PATH_PALETTE.length];
}

export function nextPathColor(paths: ThoughtPath[]): string {
  const used = new Set(paths.map((p) => p.color));
  const free = PATH_PALETTE.find((c) => !used.has(c));
  return free ?? PATH_PALETTE[paths.length % PATH_PALETTE.length];
}

// ========================================
// Critères de confrontation
// ========================================

export const DEFAULT_CRITERIA: ComparisonCriterion[] = [
  {
    key: 'feasibility',
    label: 'Faisabilité',
    description: 'Ce qui peut réellement être fait, avec les moyens disponibles.',
  },
  {
    key: 'impact',
    label: 'Impact',
    description: "Ce que ça change si ça réussit, à l'échelle visée.",
  },
  {
    key: 'cost',
    label: 'Coût',
    description: "Le prix à payer : temps, énergie, argent, attention.",
  },
  {
    key: 'risk',
    label: 'Risque',
    description: "Ce qui peut mal tourner, et la prison de la décision.",
  },
  {
    key: 'coherence',
    label: 'Fidélité',
    description: "La fidélité à l'intention réelle exprimée au départ.",
  },
];

export const CRITERION_DIRECTION: Record<string, 'higher' | 'lower'> = {
  feasibility: 'higher',
  impact: 'higher',
  cost: 'lower',
  risk: 'lower',
  coherence: 'higher',
};

export function normalizeScore(criterionKey: string, value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n)) return 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}

// ========================================
// Étapes du tracé
// ========================================

export const TRACE_STEPS: TraceStepMeta[] = [
  {
    kind: 'intake',
    index: 1,
    label: 'L\'étincelle',
    question: 'Qu\'est-ce que tu avances ?',
  },
  {
    kind: 'reading',
    index: 2,
    label: 'Lecture',
    question: 'Qu\'est-ce que j\'ai compris de toi ?',
  },
  {
    kind: 'projection',
    index: 3,
    label: 'Projection',
    question: 'Où est-ce que ça peut aller ?',
  },
  {
    kind: 'descent',
    index: 4,
    label: 'Descente',
    question: 'Jusqu\'où ça tient ?',
  },
  {
    kind: 'confrontation',
    index: 5,
    label: 'Confrontation',
    question: 'Laquelle résiste le mieux ?',
  },
  {
    kind: 'verdict',
    index: 6,
    label: 'Arbitrage',
    question: 'Qu\'est-ce qu\'on retient ?',
  },
  {
    kind: 'ledger',
    index: 7,
    label: 'Tracé',
    question: 'Comment on y est arrivés ?',
  },
];

/** Une étape est-elle accessible avec l'état courant du tracé ? */
export function isStepReachable(trace: ThoughtTrace, kind: TraceStepMeta['kind']): boolean {
  switch (kind) {
    case 'intake':
      return true;
    case 'reading':
    case 'projection':
    case 'descent':
    case 'confrontation':
    case 'verdict':
    case 'ledger':
      return trace.spark.trim().length > 0;
  }
}

/** Une étape contient-elle quelque chose à afficher ? */
export function isStepSatisfied(trace: ThoughtTrace, kind: TraceStepMeta['kind']): boolean {
  switch (kind) {
    case 'intake':
      return trace.spark.trim().length > 0;
    case 'reading':
      return trace.reading !== null;
    case 'projection':
      return trace.paths.length > 0;
    case 'descent':
      return trace.paths.some((p) => p.timeline.length > 0);
    case 'confrontation':
      return trace.confrontation !== null;
    case 'verdict':
      return trace.verdict !== null;
    case 'ledger':
      return trace.events.length > 1;
  }
}

// ========================================
// Journal
// ========================================

export const EVENT_LABEL: Record<TraceEventKind, string> = {
  statement: 'L\'utilisateur avance',
  reading: 'Lecture de l\'idée',
  correction: 'Correction de la lecture',
  projection: 'Projection des trajectoires',
  descent: 'Descente dans une trajectoire',
  elimination: 'Trajectoire écartée',
  confrontation: 'Confrontation',
  verdict: 'Arbitrage',
  commitment: 'Décision validée',
};

export function makeEvent(
  kind: TraceEventKind,
  actor: 'user' | 'ai',
  label: string,
  extra: Partial<Omit<TraceEvent, 'id' | 'kind' | 'actor' | 'label' | 'createdAt'>> = {}
): TraceEvent {
  return {
    id: generateId(),
    kind,
    actor,
    label,
    createdAt: new Date().toISOString(),
    ...extra,
  };
}

// ========================================
// Statuts
// ========================================

export const PATH_STATUS_LABEL: Record<ThoughtPath['status'], string> = {
  open: 'ouverte',
  explored: 'descendue',
  eliminated: 'écartée',
  retained: 'retenue',
  selected: 'retenue',
};

export function survivingPaths(paths: ThoughtPath[]): ThoughtPath[] {
  const alive = paths.filter((p) => p.status !== 'eliminated');
  return alive.length > 0 ? alive : paths;
}

// ========================================
// Export Markdown - le livrable
// ========================================

function bullets(items: string[] | undefined): string {
  if (!items || items.length === 0) return '_(vide)_';
  return items.map((i) => `- ${i}`).join('\n');
}

export function traceToMarkdown(trace: ThoughtTrace): string {
  const lines: string[] = [];
  const date = (iso: string) => new Date(iso).toLocaleString('fr-FR');

  lines.push(`# ${trace.title}`);
  lines.push('');
  lines.push(`*Tracé de décision — ${date(trace.createdAt)}*`);
  lines.push('');

  lines.push('## 1. L\'étincelle');
  lines.push('');
  lines.push(trace.spark);
  if (trace.context.trim()) {
    lines.push('');
    lines.push('**Contexte**');
    lines.push('');
    lines.push(trace.context);
  }
  if (trace.horizon.trim()) {
    lines.push('');
    lines.push('**Horizon**');
    lines.push('');
    lines.push(trace.horizon);
  }
  lines.push('');

  if (trace.reading) {
    const r = trace.reading;
    lines.push('## 2. Lecture');
    lines.push('');
    lines.push(`**Reformulation.** ${r.restatement}`);
    lines.push('');
    lines.push(`**Sujet réel.** ${r.subject}`);
    lines.push('');
    lines.push(`**Intention perçue.** ${r.intent}`);
    lines.push('');
    lines.push('**Présupposés non dits**');
    lines.push('');
    lines.push(bullets(r.implicits));
    lines.push('');
    if (r.tensions.length) {
      lines.push('**Tensions**');
      lines.push('');
      lines.push(bullets(r.tensions));
      lines.push('');
    }
    if (r.constraints.length) {
      lines.push('**Contraintes**');
      lines.push('');
      lines.push(bullets(r.constraints));
      lines.push('');
    }
    lines.push('**Inconnues**');
    lines.push('');
    lines.push(bullets(r.unknowns));
    lines.push('');
    lines.push(`**Enjeu.** ${r.stakes}`);
    lines.push('');
    lines.push(`> Question décisive : ${r.decisiveQuestion}`);
    lines.push('');
  }

  if (trace.paths.length > 0) {
    lines.push('## 3. Trajectoires');
    lines.push('');
    trace.paths.forEach((p, i) => {
      const tag = p.status === 'eliminated' ? ' *(écartée)*' : '';
      lines.push(`### ${i + 1}. ${p.title}${tag}`);
      lines.push('');
      lines.push(`> ${p.thesis}`);
      lines.push('');
      lines.push(`**Angle.** ${p.angle}`);
      lines.push('');
      lines.push('**Geste central**');
      lines.push('');
      lines.push(bullets(p.keyMoves));
      lines.push('');
      lines.push('**Risques**');
      lines.push('');
      lines.push(bullets(p.risks));
      lines.push('');
      lines.push(`**Ce qu'elle produit.** ${p.payoff}`);
      lines.push('');
      lines.push(`**En quoi elle diverge.** ${p.divergence}`);
      lines.push('');
    });
  }

  const explored = trace.paths.filter((p) => p.timeline.length > 0);
  if (explored.length > 0) {
    lines.push('## 4. Descentes');
    lines.push('');
    explored.forEach((p) => {
      lines.push(`### ${p.title}`);
      lines.push('');
      p.timeline.forEach((entry, i) => {
        lines.push(`**${i + 1}. ${entry.question}**`);
        lines.push('');
        lines.push(entry.analysis);
        lines.push('');
        if (entry.consequences.length) {
          lines.push('Conséquences :');
          lines.push('');
          lines.push(bullets(entry.consequences));
          lines.push('');
        }
        lines.push(`> ${entry.decision}`);
        lines.push('');
        lines.push(`*Produite* : ${entry.produces} — *Coûte* : ${entry.costs}`);
        lines.push('');
        if (entry.unknowns.length) {
          lines.push(`Inconnues restantes : ${entry.unknowns.join(', ')}`);
          lines.push('');
        }
        if (entry.wall) {
          lines.push(`**Mur.** ${entry.wall}`);
          lines.push('');
        }
      });
    });
  }

  if (trace.confrontation) {
    const c = trace.confrontation;
    lines.push('## 5. Confrontation');
    lines.push('');
    const live = trace.paths.filter((p) => p.status !== 'eliminated');
    lines.push(`| Critère | ${live.map((p) => p.title).join(' | ')} |`);
    lines.push(`|---|${live.map(() => '---').join('|')}|`);
    c.criteria.forEach((crit) => {
      const cells = live.map((p) => {
        const row = c.rows.find((r) => r.pathId === p.id);
        return row ? String(row.values[crit.key] ?? '—') : '—';
      });
      lines.push(`| ${crit.label} | ${cells.join(' | ')} |`);
    });
    lines.push(`| **Total** | ${live.map((p) => {
      const row = c.rows.find((r) => r.pathId === p.id);
      return row ? String(row.total) : '—';
    }).join(' | ')} |`);
    lines.push('');
    lines.push(`**Synthèse.** ${c.synthesis}`);
    lines.push('');
    lines.push(`> Le discriminating : ${c.discriminator}`);
    lines.push('');
  }

  if (trace.verdict) {
    const v = trace.verdict;
    const recommended = trace.paths.find((p) => p.id === v.recommendedPathId);
    lines.push('## 6. Arbitrage');
    lines.push('');
    lines.push(`**Retenu : ${recommended?.title ?? 'trajectoire inconnue'}** (confiance ${Math.round(v.confidence * 100)}%)`);
    lines.push('');
    lines.push(v.why);
    lines.push('');
    lines.push('**Facteurs décisifs**');
    lines.push('');
    lines.push(bullets(v.decisiveFactors));
    lines.push('');
    lines.push('**Ce que cela implique**');
    lines.push('');
    lines.push(bullets(v.whatItImplies));
    lines.push('');
    lines.push('**Ce qui prouverait qu\'on a tort**');
    lines.push('');
    lines.push(bullets(v.falsifiers));
    lines.push('');
    lines.push('**Premiers gestes**');
    lines.push('');
    lines.push(bullets(v.nextActions));
    lines.push('');
    if (v.changeConditions.length) {
      lines.push('**Ce qui changerait la décision**');
      lines.push('');
      lines.push(bullets(v.changeConditions));
      lines.push('');
    }
    lines.push(`> ${v.closing}`);
    lines.push('');
  }

  lines.push('## 7. Journal');
  lines.push('');
  trace.events.forEach((e, i) => {
    const who = e.actor === 'user' ? 'Utilisateur' : 'IA';
    const path = e.pathId ? trace.paths.find((p) => p.id === e.pathId)?.title : null;
    lines.push(`${i + 1}. **${e.label}** — ${who}${path ? ` · ${path}` : ''} — ${date(e.createdAt)}`);
    if (e.detail) {
      lines.push(`   ${e.detail}`);
    }
  });
  lines.push('');

  return lines.join('\n');
}

export function downloadTrace(trace: ThoughtTrace): void {
  const blob = new Blob([traceToMarkdown(trace)], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const slug = trace.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  a.href = url;
  a.download = `trac-${slug || 'decision'}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}