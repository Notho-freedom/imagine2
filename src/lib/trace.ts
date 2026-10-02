// ========================================
// IMAGINE - Trace Utilities
// Palette des trajectoires, critères, export du tracé
// ========================================

import type {
  BranchPoint,
  ComparisonCriterion,
  PathStatus,
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
    weight: 1,
    enabled: true,
    origin: 'default',
  },
  {
    key: 'impact',
    label: 'Impact',
    description: "Ce que ça change si ça réussit, à l'échelle visée.",
    weight: 1,
    enabled: true,
    origin: 'default',
  },
  {
    key: 'cost',
    label: 'Coût',
    description: "Le prix à payer : temps, énergie, argent, attention.",
    weight: 1,
    enabled: true,
    origin: 'default',
  },
  {
    key: 'risk',
    label: 'Risque',
    description: "Ce qui peut mal tourner, et la prison de la décision.",
    weight: 1,
    enabled: true,
    origin: 'default',
  },
  {
    key: 'coherence',
    label: 'Fidélité',
    description: "La fidélité à l'intention réelle exprimée au départ.",
    weight: 1,
    enabled: true,
    origin: 'default',
  },
];

export const CRITERION_DIRECTION: Record<string, 'higher' | 'lower'> = {
  feasibility: 'higher',
  impact: 'higher',
  cost: 'lower',
  risk: 'lower',
  coherence: 'higher',
};

export function criterionDirection(criterion: ComparisonCriterion): 'higher' | 'lower' {
  return CRITERION_DIRECTION[criterion.key] ?? 'higher';
}

/** Poids bornés : en dessous de 0.2 le critère ne compte presque plus. */
export const WEIGHT_MIN = 0.2;
export const WEIGHT_MAX = 3;
export const WEIGHT_STEP = 0.2;

export function normalizeWeight(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.max(WEIGHT_MIN, Math.min(WEIGHT_MAX, Math.round(n * 10) / 10));
}

export function enabledCriteria(criteria: ComparisonCriterion[]): ComparisonCriterion[] {
  const active = criteria.filter((c) => c.enabled);
  return active.length > 0 ? active : DEFAULT_CRITERIA.filter((c) => c.enabled);
}

/**
 * Total pondéré, calculé ici et jamais par le modèle.
 * Un total inventé par l'IA décrédibiliserait toute la confrontation.
 */
export function weightedTotal(
  values: Record<string, number>,
  criteria: ComparisonCriterion[]
): number {
  const active = enabledCriteria(criteria);
  let sum = 0;
  let weightSum = 0;

  for (const c of active) {
    const v = values[c.key];
    if (typeof v !== 'number' || Number.isNaN(v)) continue;
    const w = normalizeWeight(c.weight);
    sum += v * w;
    weightSum += w;
  }

  if (weightSum === 0) return 0;
  return Math.round((sum / weightSum) * 10) / 10;
}

export function normalizeScore(_key: string, value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n)) return 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Génère une clé stable à partir d'un libellé saisi par l'utilisateur. */
export function criterionKey(label: string): string {
  const base = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 28);
  return base || `critere_${Date.now().toString(36)}`;
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
  branch: 'Bifurcation',
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
// Layout de l'arbre du tracé
// Le flux est un arbre qui grandit vers la droite :
// étincelle → trajectoires → descentes → virages
// ========================================

export const LANE_H = 148;
export const PATH_NODE = { w: 236, h: 62 };
export const ENTRY_NODE = { w: 186, h: 46 };
export const SPARK_NODE = { w: 268, h: 76 };
export const COL_GAP = 74;

export interface TraceNode {
  id: string;
  kind: 'spark' | 'path' | 'entry';
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  title: string;
  subtitle: string;
  pathId: string | null;
  rootPathId: string | null;
  depth: number;
  lane: number;
  status: PathStatus | null;
  entryIndex: number | null;
}

export interface TraceEdge {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  kind: 'branch' | 'descent' | 'fork';
  pathId: string | null;
  /** Raccordé à ce nœud */
  toNodeId: string;
  fromNodeId: string;
  solid: boolean;
}

export interface TraceLayout {
  nodes: TraceNode[];
  edges: TraceEdge[];
  width: number;
  height: number;
  sparkY: number;
  /** Racine de chaque trajectoire, pour la mise en évidence de lignée */
  lineageOf: Record<string, string>;
}

const centerY = (n: { y: number; h: number }) => n.y + n.h / 2;
const rightOf = (n: { x: number; w: number }) => n.x + n.w;
const leftOf = (n: { x: number }) => n.x;

export function traceLayout(trace: ThoughtTrace): TraceLayout {
  const nodes: TraceNode[] = [];
  const edges: TraceEdge[] = [];
  const lineageOf: Record<string, string> = {};

  let lane = 0;
  const topLanes: number[] = [];

  const childrenOf = (id: string | null) =>
    trace.paths.filter((p) => p.parentPathId === id);

  const link = (from: TraceNode, to: TraceNode, kind: TraceEdge['kind'], solid: boolean) => {
    edges.push({
      id: `${from.id}->${to.id}`,
      x1: rightOf(from),
      y1: centerY(from),
      x2: leftOf(to),
      y2: centerY(to),
      color: to.color,
      kind,
      pathId: to.pathId,
      toNodeId: to.id,
      fromNodeId: from.id,
      solid,
    });
  };

  function placePath(path: ThoughtPath, depth: number, x0: number): TraceNode {
    const root = path.rootPathId ?? path.id;
    lineageOf[path.id] = root;

    // La voie est réservée avant toute descente : les enfants reserve une voie
    // neuve, jamais celle de leur parent.
    const myLane = lane;
    lane += 1;

    const y = myLane * LANE_H;
    const node: TraceNode = {
      id: `p:${path.id}`,
      kind: 'path',
      x: x0,
      y: y + (LANE_H - PATH_NODE.h) / 2,
      w: PATH_NODE.w,
      h: PATH_NODE.h,
      color: path.color,
      title: path.title,
      subtitle:
        path.status === 'selected'
          ? 'retenue'
          : path.status === 'eliminated'
            ? 'écartée'
            : `${path.timeline.length} passage${path.timeline.length > 1 ? 's' : ''}`,
      pathId: path.id,
      rootPathId: root,
      depth,
      lane: myLane,
      status: path.status,
      entryIndex: null,
    };
    nodes.push(node);

    // La chaîne de descente, sur la même voie
    const entryX = x0 + PATH_NODE.w + COL_GAP;
    let previous: TraceNode = node;

    path.timeline.forEach((entry, i) => {
      const e: TraceNode = {
        id: `e:${entry.id}`,
        kind: 'entry',
        x: entryX + i * (ENTRY_NODE.w + 20),
        y: y + (LANE_H - ENTRY_NODE.h) / 2,
        w: ENTRY_NODE.w,
        h: ENTRY_NODE.h,
        color: path.color,
        title: entry.question,
        subtitle: entry.decision || entry.wall || '',
        pathId: path.id,
        rootPathId: root,
        depth,
        lane: myLane,
        status: null,
        entryIndex: i,
      };
      nodes.push(e);
      link(previous, e, 'descent', i < path.branches.length);
      previous = e;
    });

    // Les virages partent d'un passage précis
    const children = childrenOf(path.id);
    if (children.length) {
      const afterEntries =
        entryX + path.timeline.length * (ENTRY_NODE.w + 20) + (path.timeline.length ? 40 : 0);

      children.forEach((child) => {
        // La branche dont le chemin retenu correspond à cet enfant.
        // Le chemin retenu est stocké sous forme de « titre — thèse » ; seul le
        // début suffit à l'identifier, et c'est ce que le moteur a produit.
        const branchIdx = path.branches.findIndex((b: BranchPoint) =>
          b.chosen.startsWith(child.title)
        );
        // Un virage peut être posé au dernier passage : dans ce cas il s'ancre
// sur ce passage, pas sur la trajectoire elle-même.
const anchorIndex = Math.min(
          path.branches[branchIdx].atEntryIndex,
          Math.max(0, path.timeline.length - 1)
        );
        const forkEntry =
          branchIdx >= 0
            ? (nodes.find(
                (n) =>
                  n.kind === 'entry' &&
                  n.pathId === path.id &&
                  n.entryIndex === anchorIndex
              ) ?? node)
            : node;

        const childNode = placePath(child, depth + 1, afterEntries);
        link(forkEntry, childNode, 'fork', true);
      });
    }

    return node;
  }

  // Racines
  childrenOf(null).forEach((p) => {
    topLanes.push(lane);
    placePath(p, 0, SPARK_NODE.w + COL_GAP);
  });

  // L'étincelle se place entre les voies, pas sur la première.
  const laneCenter = (l: number) => l * LANE_H + LANE_H / 2;
  const sparkY =
    topLanes.length > 0
      ? (laneCenter(Math.min(...topLanes)) + laneCenter(Math.max(...topLanes))) / 2
      : 0;

  const spark: TraceNode = {
    id: 'spark',
    kind: 'spark',
    x: 0,
    y: sparkY - SPARK_NODE.h / 2,
    w: SPARK_NODE.w,
    h: SPARK_NODE.h,
    color: '#E6EDF3',
    title: trace.title,
    subtitle: trace.spark.slice(0, 140),
    pathId: null,
    rootPathId: null,
    depth: -1,
    lane: -1,
    status: null,
    entryIndex: null,
  };
  nodes.unshift(spark);

  nodes
    .filter((n) => n.kind === 'path' && n.depth === 0)
    .forEach((n) => link(spark, n, 'branch', true));

  const width = nodes.reduce((m, n) => Math.max(m, n.x + n.w), 0) + 120;
  const height = Math.max(...nodes.map((n) => n.y + n.h), 0) + 120;

  return { nodes, edges, width, height, sparkY, lineageOf };
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

  const indent = (path: ThoughtPath, depth: number) =>
    `${'  '.repeat(depth)}- **${path.title}**${path.status === 'eliminated' ? ' *(écartée)*' : ''} — ${path.thesis}`;

  /** Parcours en profondeur des sous-trajectoires */
  const walk = (
    parentId: string | null,
    depth: number,
    render: (p: ThoughtPath, depth: number) => void
  ) => {
    trace.paths
      .filter((p) => p.parentPathId === parentId)
      .forEach((p) => {
        render(p, depth);
        walk(p.id, depth + 1, render);
      });
  };

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

    const hasChildren = trace.paths.some((p) => p.parentPathId !== null);

    walk(null, 0, (p, depth) => {
      const heading = depth === 0 ? '###' : '####';
      lines.push(`${heading} ${indent(p, depth)}`);
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
      if (!hasChildren) {
        lines.push(`**Statut.** ${PATH_STATUS_LABEL[p.status]}`);
        lines.push('');
      }
    });
  }

  const allBranched = trace.paths.filter((p) => p.branches.length > 0);
  if (allBranched.length > 0) {
    lines.push('### Points de bifurcation');
    lines.push('');
    lines.push(
      'Les moments où un autre chemin était ouvert. Ce qui a été écarté, et ce que ça a coûté.'
    );
    lines.push('');
    allBranched.forEach((p) => {
      p.branches.forEach((b) => {
        lines.push(`#### ${b.question}`);
        lines.push('');
        lines.push(`- **Écarté** : ${b.alternative}`);
        lines.push(`- **Retenu** : ${b.chosen}`);
        lines.push(`- **Ce qu'on perd** : ${b.costOfChoice || '—'}`);
        lines.push(`- Moment : après le passage ${b.atEntryIndex + 1}`);
        lines.push('');
      });
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

    const usedCriteria = enabledCriteria(c.criteria ?? trace.criteria ?? []);
    const weighted = usedCriteria.some((crit) => normalizeWeight(crit.weight) !== 1);

    if (weighted || usedCriteria.some((crit) => crit.origin === 'user')) {
      lines.push('**Sur quoi on a mesuré**');
      lines.push('');
      usedCriteria.forEach((crit) => {
        const w = normalizeWeight(crit.weight);
        const sens = criterionDirection(crit) === 'lower' ? ', moins vaut mieux' : '';
        lines.push(`- **${crit.label}**${w === 1 ? '' : ` — poids ×${String(w).replace('.', ',')}`}${sens}`);
      });
      lines.push('');
    }

    const live = trace.paths.filter((p) => p.status !== 'eliminated');
    lines.push(`| Critère | ${live.map((p) => p.title).join(' | ')} |`);
    lines.push(`|---|${live.map(() => '---').join('|')}|`);
    c.criteria.forEach((crit) => {
      const cells = live.map((p) => {
        const row = c.rows.find((r) => r.pathId === p.id);
        return row ? String(row.values[crit.key] ?? '—') : '—';
      });
      const w = normalizeWeight(crit.weight);
      const suffix = w === 1 ? '' : ` (×${String(w).replace('.', ',')})`;
      lines.push(`| ${crit.label}${suffix} | ${cells.join(' | ')} |`);
    });
    lines.push(`| **Total pondéré** | ${live.map((p) => {
      const row = c.rows.find((r) => r.pathId === p.id);
      return row ? String(weightedTotal(row.values, c.criteria)) : '—';
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
