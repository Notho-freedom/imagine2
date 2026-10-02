// ========================================
// IMAGINE - Trace Model
// Le moteur de décision traçable
// ========================================

// ========================================
// Étapes du tracé
// ========================================

export type TraceStepKind =
  | 'intake'       // 1. L'étincelle - ce que l'utilisateur avance
  | 'reading'      // 2. Lecture - compréhension profonde de l'idée
  | 'projection'   // 3. Projection - trajectoires possibles
  | 'descent'      // 4. Descente - exploration d'une trajectoire
  | 'confrontation'// 5. Confrontation - comparaison
  | 'verdict'      // 6. Arbitrage - ce qu'on retient
  | 'ledger';      // 7. Tracé - la chaîne complète

export interface TraceStepMeta {
  kind: TraceStepKind;
  index: number;
  label: string;
  question: string;
}

// ========================================
// Lecture profonde de l'idée
// ========================================

export type ReadingField =
  | 'restatement'
  | 'subject'
  | 'intent'
  | 'implicits'
  | 'tensions'
  | 'constraints'
  | 'unknowns'
  | 'stakes'
  | 'decisiveQuestion';

export interface ReadingFeedback {
  /** Éléments que l'utilisateur a refusés, mot pour mot */
  rejected: string[];
  /** Ce que l'utilisateur veut ajouter que l'IA n'a pas vu */
  added: string[];
  /** Précision libre, réinjectée comme faisant autorité */
  note: string;
  updatedAt: string;
}

export interface IdeaReading {
  restatement: string;
  subject: string;
  intent: string;
  implicits: string[];
  tensions: string[];
  constraints: string[];
  unknowns: string[];
  stakes: string;
  decisiveQuestion: string;
  createdAt: string;
  model: string;
  /** Nombre de passes de correction */
  revision: number;
  feedback: ReadingFeedback | null;
}

// ========================================
// Trajectoires
// ========================================

export type PathStatus =
  | 'open'        // ouverte, non explorée
  | 'explored'    // descendue
  | 'eliminated'  // écartée par l'utilisateur ou l'IA
  | 'retained'    // survit à la confrontation
  | 'selected';   // retenue par l'arbitrage

export interface PathMoves {
  keyMoves: string[];
  risks: string[];
  payoff: string;
  divergence: string;
}

export interface DescentEntry {
  id: string;
  pathId: string;
  question: string;
  analysis: string;
  consequences: string[];
  decision: string;
  produces: string;
  costs: string;
  unknowns: string[];
  wall: string;
  createdAt: string;
  model: string;
}

/**
 * Un embranchement : le point où une trajectoire aurait pu prendre un
 * autre chemin, et le chemin effectivement pris.
 * C'est ce qui distingue une vraie exploration d'une simple pile de cartes.
 */
export interface BranchPoint {
  id: string;
  /** Question ouverte qui a été tranchée ici */
  question: string;
  /** L'alternative qui n'a pas été prise */
  alternative: string;
  /** Le choix retenu */
  chosen: string;
  /** Ce qu'on perd en ne prenant pas l'alternative */
  costOfChoice: string;
  createdAt: string;
  /** Passages de la trajectoire antérieurs à ce point */
  atEntryIndex: number;
}

export interface ThoughtPath extends PathMoves {
  id: string;
  traceId: string;
  parentPathId: string | null;
  /** Racine de la sous-trajectoire, pour le repliement dans le journal */
  rootPathId: string | null;
  color: string;
  title: string;
  thesis: string;
  angle: string;
  status: PathStatus;
  depth: number;
  timeline: DescentEntry[];
  branches: BranchPoint[];
  scores: PathScores | null;
  createdAt: string;
  updatedAt: string;
  origin: 'ai' | 'user';
}

export interface PathScores {
  values: Record<string, number>;
  rationale: Record<string, string>;
  total: number;
}

/**
 * Un critère de confrontation.
 * Le poids est une conviction de l'utilisateur, pas une vérité :
 * 1 = normal, 2 = il compte double, 0.5 =Accessoire.
 */
export interface ComparisonCriterion {
  key: string;
  label: string;
  description: string;
  /** Multiplicateur appliqué au total */
  weight: number;
  enabled: boolean;
  origin: 'default' | 'user';
}

export interface PathScoreRow {
  pathId: string;
  values: Record<string, number>;
  rationale: Record<string, string>;
  total: number;
}

export interface Confrontation {
  criteria: ComparisonCriterion[];
  rows: PathScoreRow[];
  synthesis: string;
  discriminator: string;
  createdAt: string;
  model: string;
}

// ========================================
// Arbitrage
// ========================================

export interface Verdict {
  recommendedPathId: string;
  confidence: number;
  why: string;
  decisiveFactors: string[];
  whatItImplies: string[];
  falsifiers: string[];
  nextActions: string[];
  changeConditions: string[];
  closing: string;
  createdAt: string;
  model: string;
}

// ========================================
// Journal du tracé
// ========================================

export type TraceEventKind =
  | 'statement'
  | 'reading'
  | 'correction'
  | 'projection'
  | 'descent'
  | 'branch'
  | 'elimination'
  | 'confrontation'
  | 'verdict'
  | 'commitment';

export interface TraceEvent {
  id: string;
  kind: TraceEventKind;
  actor: 'user' | 'ai';
  label: string;
  detail?: string;
  pathId?: string;
  color?: string;
  createdAt: string;
}

// ========================================
// Trace - l'objet racine
// ========================================

export type TraceStatus = 'open' | 'arbitrated';

export interface ThoughtTrace {
  id: string;
  title: string;
  spark: string;
  context: string;
  horizon: string;
  reading: IdeaReading | null;
  /** Les critères de confrontation retenus, pondérés par l'utilisateur */
  criteria: ComparisonCriterion[];
  paths: ThoughtPath[];
  confrontation: Confrontation | null;
  verdict: Verdict | null;
  events: TraceEvent[];
  status: TraceStatus;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// Contrats de sortie de l'IA
// ========================================

export interface ReadingPayload {
  restatement: string;
  subject: string;
  intent: string;
  implicits: string[];
  tensions: string[];
  constraints: string[];
  unknowns: string[];
  stakes: string;
  decisiveQuestion: string;
}

export interface ReadRequest {
  spark: string;
  context?: string;
  horizon?: string;
  /** Lecture précédente, si l'utilisateur corrige. Sert de brouillon à affiner. */
  draft?: ReadingPayload;
  rejected?: string[];
  added?: string[];
  note?: string;
}

export interface PathPayload {
  title: string;
  thesis: string;
  angle: string;
  keyMoves: string[];
  risks: string[];
  payoff: string;
  divergence: string;
}

export interface DescentPayload {
  question: string;
  analysis: string;
  consequences: string[];
  decision: string;
  produces: string;
  costs: string;
  unknowns: string[];
  wall: string;
  /** Point de bifurcation détecté par le moteur, s'il en existe un */
  branch?: {
    question: string;
    option: string;
    taken: string;
    tradeoff: string;
  };
}

export interface BranchRequest {
  spark: string;
  path: { title: string; thesis: string; angle: string; keyMoves: string[] };
  timeline: Array<{ question: string; analysis: string; wall: string }>;
  /** Point de la trajectoire où l'on bifurque */
  atEntryIndex: number;
  /** Alternative imposée par l'utilisateur */
  seed?: string;
}

export interface ConfrontationPayload {
  criteria: ComparisonCriterion[];
  rows: PathScoreRow[];
  synthesis: string;
  discriminator: string;
}

export interface VerdictPayload {
  recommendedPathId: string;
  confidence: number;
  why: string;
  decisiveFactors: string[];
  whatItImplies: string[];
  falsifiers: string[];
  nextActions: string[];
  changeConditions: string[];
  closing: string;
}