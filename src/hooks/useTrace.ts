// ========================================
// IMAGINE - useTrace Hook
// Orchestration du moteur de décision
// ========================================

import { useCallback, useState } from 'react';
import { useImagineStore } from '@/store';
import { generateId } from '@/lib/utils';
import { GROQ_MODEL } from '@/lib/groq';
import { DEFAULT_CRITERIA, makeEvent } from '@/lib/trace';
import type {
  Confrontation,
  DescentPayload,
  IdeaReading,
  ReadingPayload,
  ThoughtPath,
  ThoughtTrace,
  Verdict,
} from '@/types';

// ========================================
// Client
// ========================================

interface TraceResponse<T> {
  success: boolean;
  result?: T;
  error?: string;
}

async function callTrace<T>(
  action: string,
  data: Record<string, unknown>
): Promise<TraceResponse<T>> {
  try {
    const response = await fetch('/api/trace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, data }),
    });
    return await response.json();
  } catch (error) {
    console.error('[useTrace] échec réseau:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur de connexion',
    };
  }
}

type PendingAction =
  | 'reading'
  | 'projection'
  | 'descent'
  | 'branch'
  | 'confrontation'
  | 'verdict'
  | null;

// ========================================
// Hook
// ========================================

export function useTrace() {
  const [pending, setPending] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    traces,
    activeTraceId,
    ui,
    createTrace,
    setActiveTrace,
    deleteTrace,
    setTraceStep,
    setActivePath,
    updateTrace,
    appendEvent,
setReading,
    patchReading,
    setReadingFeedback,
    addPaths,
    setPathStatus,
    addDescent,
    removeDescent,
    setConfrontation,
    setVerdict,
    reopenVerdict,
    commitVerdict,
  } = useImagineStore();

  const trace = traces.find((t) => t.id === activeTraceId) ?? null;

  const run = useCallback(
    async <T,>(
      action: PendingAction,
      fn: () => Promise<TraceResponse<T>>
    ): Promise<T | null> => {
      setPending(action);
      setError(null);
      try {
        const res = await fn();
        if (!res.success || res.result === undefined) {
          setError(res.error || 'Le moteur n\'a pas répondu');
          return null;
        }
        return res.result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inattendue');
        return null;
      } finally {
        setPending(null);
      }
    },
    []
  );

  // ------------------------------------------------
  // 1. Lecture
  // ------------------------------------------------

  const read = useCallback(
    async (options?: { refine?: boolean }) => {
      if (!trace || !trace.spark.trim()) {
        setError('Aucune idée à lire');
        return null;
      }

      const refine = options?.refine ?? false;
      const current = trace.reading;
      const feedback = current?.feedback;

      const payload = await run<ReadingPayload>('reading', () =>
        callTrace<ReadingPayload>('readIdea', {
          spark: trace.spark,
          context: trace.context,
          horizon: trace.horizon,
          draft: refine && current ? current : undefined,
          rejected: refine ? feedback?.rejected ?? [] : [],
          added: refine ? feedback?.added ?? [] : [],
          note: refine ? feedback?.note ?? '' : '',
        })
      );

      if (!payload) return null;

      const reading: IdeaReading = {
        ...payload,
        createdAt: current?.createdAt ?? new Date().toISOString(),
        model: GROQ_MODEL,
        revision: refine ? (current?.revision ?? 0) + 1 : 0,
        feedback: refine ? (feedback ?? null) : null,
      };

      setReading(trace.id, reading);
      appendEvent(
        makeEvent(refine ? 'correction' : 'reading', 'ai', refine ? 'Lecture relue' : 'Lecture établie', {
          detail: reading.restatement,
        })
      );
      setTraceStep(2);
      return reading;
    },
    [trace, run, setReading, appendEvent, setTraceStep]
  );

  // ------------------------------------------------
  // Contestation - l'utilisateur reprend la main
  // ------------------------------------------------

  const editReading = useCallback(
    (patch: Partial<IdeaReading>, what: string) => {
      if (!trace) return;
      patchReading(trace.id, patch);
      appendEvent(
        makeEvent('correction', 'user', `Lecture corrigée — ${what}`, {
          detail: Object.values(patch)
            .map((v) => (Array.isArray(v) ? v.join(' ; ') : String(v ?? '')))
            .join(' · ')
            .slice(0, 300),
        })
      );
    },
    [trace, patchReading, appendEvent]
  );

  const rejectItem = useCallback(
    (field: 'implicits' | 'tensions' | 'constraints' | 'unknowns', item: string) => {
      if (!trace?.reading) return;
      const list = trace.reading[field] ?? [];
      patchReading(trace.id, { [field]: list.filter((i) => i !== item) } as Partial<IdeaReading>);
      setReadingFeedback(trace.id, {
        rejected: [...(trace.reading.feedback?.rejected ?? []), item],
        added: trace.reading.feedback?.added ?? [],
        note: trace.reading.feedback?.note ?? '',
        updatedAt: new Date().toISOString(),
      });
      appendEvent(makeEvent('correction', 'user', 'Élément écarté de la lecture', { detail: item }));
    },
    [trace, patchReading, setReadingFeedback, appendEvent]
  );

  const addItem = useCallback(
    (field: 'implicits' | 'tensions' | 'constraints' | 'unknowns', item: string) => {
      if (!trace?.reading || !item.trim()) return;
      const list = trace.reading[field] ?? [];
      patchReading(trace.id, { [field]: [...list, item.trim()] } as Partial<IdeaReading>);
      setReadingFeedback(trace.id, {
        rejected: trace.reading.feedback?.rejected ?? [],
        added: [...(trace.reading.feedback?.added ?? []), item.trim()],
        note: trace.reading.feedback?.note ?? '',
        updatedAt: new Date().toISOString(),
      });
      appendEvent(makeEvent('correction', 'user', 'Élément ajouté à la lecture', { detail: item.trim() }));
    },
    [trace, patchReading, setReadingFeedback, appendEvent]
  );

  const setNote = useCallback(
    (note: string) => {
      if (!trace?.reading) return;
      setReadingFeedback(trace.id, {
        rejected: trace.reading.feedback?.rejected ?? [],
        added: trace.reading.feedback?.added ?? [],
        note,
        updatedAt: new Date().toISOString(),
      });
    },
    [trace, setReadingFeedback]
  );

  // ------------------------------------------------
  // 2. Projection
  // ------------------------------------------------

  const project = useCallback(
    async (count = 4) => {
      if (!trace) return null;

      const result = await run<{ paths: any[] }>('projection', () =>
        callTrace<{ paths: any[] }>('projectPaths', {
          spark: trace.spark,
          reading: trace.reading,
          count,
          avoid: trace.paths.map((p) => p.title),
        })
      );

      if (!result || result.paths.length === 0) {
        if (result) setError('Aucune trajectoire produite');
        return null;
      }

      addPaths(trace.id, result.paths);
      appendEvent(
        makeEvent('projection', 'ai', `${result.paths.length} trajectoires projetées`, {
          detail: result.paths.map((p: any) => p.title).join(' · '),
        })
      );
      setTraceStep(3);
      return result.paths;
    },
    [trace, run, addPaths, appendEvent, setTraceStep]
  );

  // ------------------------------------------------
  // 3. Descente
  // ------------------------------------------------

  const descend = useCallback(
    async (path: ThoughtPath, probe = '') => {
      if (!trace) return null;

      const entry = await run<DescentPayload>('descent', () =>
        callTrace<DescentPayload>('deepenPath', {
          spark: trace.spark,
          reading: trace.reading,
          path: {
            title: path.title,
            thesis: path.thesis,
            angle: path.angle,
            keyMoves: path.keyMoves,
          },
          timeline: path.timeline.map((e) => ({
            question: e.question,
            analysis: e.analysis,
            wall: e.wall,
          })),
          probe,
        })
      );

      if (!entry) return null;

      addDescent(trace.id, path.id, {
        ...entry,
        model: GROQ_MODEL,
      });

      appendEvent(
        makeEvent('descent', 'ai', `${path.title} : ${entry.question}`, {
          detail: entry.decision,
          pathId: path.id,
          color: path.color,
        })
      );

      return entry;
    },
    [trace, run, addDescent, appendEvent]
  );

  // ------------------------------------------------
  // 4. Bifurcation
  // ------------------------------------------------

  const fork = useCallback(
    async (path: ThoughtPath, atEntryIndex: number, seed = '') => {
      if (!trace) return null;

      const result = await run<{
        title: string;
        thesis: string;
        angle: string;
        keyMoves: string[];
        risks: string[];
        payoff: string;
        divergence: string;
        branch: { question: string; tradeoff: string };
      }>('branch', () =>
        callTrace('forkPath', {
          spark: trace.spark,
          path: {
            title: path.title,
            thesis: path.thesis,
            angle: path.angle,
            keyMoves: path.keyMoves,
          },
          timeline: path.timeline.map((e) => ({
            question: e.question,
            analysis: e.analysis,
            wall: e.wall,
          })),
          atEntryIndex,
          seed,
        })
      );

      if (!result) return null;

      const ids = addPaths(
        trace.id,
        [
          {
            title: result.title,
            thesis: result.thesis,
            angle: result.angle,
            keyMoves: result.keyMoves,
            risks: result.risks,
            payoff: result.payoff,
            divergence: result.divergence,
          },
        ],
        {
          pathId: path.id,
          entryIndex: atEntryIndex,
          // La structure fait foi : on part de `path`, on arrive sur la nouvelle.
          // Les libellés du modèle ne sont pas fiables sur ce point, seul son
          // raisonnement sur le renoncement l'est.
          branch: {
            id: '',
            question: result.branch.question,
            alternative: `${path.title} — ${path.thesis}`,
            chosen: `${result.title} — ${result.thesis}`,
            costOfChoice: result.branch.tradeoff,
            atEntryIndex,
            createdAt: new Date().toISOString(),
          },
        }
      );

      appendEvent(
        makeEvent('branch', 'ai', `Bifurcation depuis « ${path.title} »`, {
          detail: result.branch.tradeoff
            ? `${result.branch.question} → ${result.title}. ${result.branch.tradeoff}`
            : `${result.branch.question} → ${result.title}`,
          pathId: path.id,
          color: path.color,
        })
      );

      if (ids[0]) setActivePath(ids[0]);
      return result;
    },
    [trace, run, addPaths, appendEvent, setActivePath]
  );

  // ------------------------------------------------
  // 5. Confrontation
  // ------------------------------------------------

  const confront = useCallback(async () => {
    if (!trace) return null;

    const live = trace.paths.filter((p) => p.status !== 'eliminated');
    if (live.length < 2) {
      setError('Il faut au moins deux trajectoires vivantes pour confronter');
      return null;
    }

    const result = await run<Omit<Confrontation, 'createdAt' | 'model'>>(
      'confrontation',
      () =>
        callTrace<Omit<Confrontation, 'createdAt' | 'model'>>('comparePaths', {
          spark: trace.spark,
          reading: trace.reading,
          paths: live.map((p) => ({
            id: p.id,
            title: p.title,
            thesis: p.thesis,
            angle: p.angle,
            payoff: p.payoff,
            risks: p.risks,
            timeline: p.timeline.map((e) => ({
              question: e.question,
              analysis: e.analysis,
              wall: e.wall,
            })),
          })),
          criteria: DEFAULT_CRITERIA,
        })
    );

    if (!result) return null;

    const confrontation: Confrontation = {
      ...result,
      createdAt: new Date().toISOString(),
      model: GROQ_MODEL,
    };

    setConfrontation(trace.id, confrontation);
    appendEvent(
      makeEvent('confrontation', 'ai', 'Confrontation établie', {
        detail: confrontation.discriminator,
      })
    );
    setTraceStep(5);
    return confrontation;
  }, [trace, run, setConfrontation, appendEvent, setTraceStep]);

  // ------------------------------------------------
  // 5. Arbitrage
  // ------------------------------------------------

  const arbitrate = useCallback(async () => {
    if (!trace) return null;

    const live = trace.paths.filter((p) => p.status !== 'eliminated');
    if (live.length === 0) {
      setError('Aucune trajectoire vivante à arbitrer');
      return null;
    }

    const result = await run<Omit<Verdict, 'createdAt' | 'model'>>('verdict', () =>
      callTrace<Omit<Verdict, 'createdAt' | 'model'>>('arbitrate', {
        spark: trace.spark,
        reading: trace.reading,
        paths: live.map((p) => ({
          id: p.id,
          title: p.title,
          thesis: p.thesis,
          payoff: p.payoff,
        })),
        confrontation: trace.confrontation,
      })
    );

    if (!result) return null;

    const verdict: Verdict = {
      ...result,
      createdAt: new Date().toISOString(),
      model: GROQ_MODEL,
    };

    setVerdict(trace.id, verdict);
    appendEvent(
      makeEvent('verdict', 'ai', 'Arbitrage rendu', {
        detail:
          trace.paths.find((p) => p.id === verdict.recommendedPathId)?.title ??
          verdict.recommendedPathId,
        pathId: verdict.recommendedPathId,
        color: trace.paths.find((p) => p.id === verdict.recommendedPathId)?.color,
      })
    );
    setTraceStep(6);
    return verdict;
  }, [trace, run, setVerdict, appendEvent, setTraceStep]);

  // ------------------------------------------------
  // Décisions de l'utilisateur
  // ------------------------------------------------

  const eliminate = useCallback(
    (path: ThoughtPath) => {
      if (!trace) return;
      setPathStatus(trace.id, path.id, 'eliminated');
      appendEvent(
        makeEvent('elimination', 'user', `« ${path.title} » écartée`, {
          detail: path.thesis,
          pathId: path.id,
          color: path.color,
        })
      );
    },
    [trace, setPathStatus, appendEvent]
  );

  const restore = useCallback(
    (path: ThoughtPath) => {
      if (!trace) return;
      setPathStatus(trace.id, path.id, path.timeline.length ? 'explored' : 'open');
    },
    [trace, setPathStatus]
  );

  const commit = useCallback(() => {
    if (!trace || !trace.verdict) return;
    commitVerdict(trace.id);
    const chosen = trace.paths.find((p) => p.id === trace.verdict?.recommendedPathId);
    appendEvent(
      makeEvent('commitment', 'user', 'Décision validée', {
        detail: chosen ? `${chosen.title} — ${trace.verdict.closing}` : trace.verdict.closing,
        pathId: chosen?.id,
        color: chosen?.color,
      })
    );
    setTraceStep(7);
  }, [trace, commitVerdict, appendEvent, setTraceStep]);

  const declareSpark = useCallback(
    (spark: string) => {
      if (!trace) return;
      const title =
        spark.trim().split(/[.\n]/)[0]?.slice(0, 72).trim() || trace.title;
      updateTrace(trace.id, { spark, title: title.length > 2 ? title : trace.title });
      appendEvent(
        makeEvent('statement', 'user', 'Idée posée', { detail: spark.slice(0, 400) })
      );
    },
    [trace, updateTrace, appendEvent]
  );

  // ------------------------------------------------
// 7. L'hypothèse - le geste qui n'a pas d'étape
//
// Peu importe où l'on est dans le parcours, « et si… ? » ouvre une
// trajectoire depuis l'idée courante. Elle est explorable comme les
// autres. Si une décision avait été rendue, elle est rouverte : elle
// avait été prise sur un jeu incomplet.
// ------------------------------------------------

const hypothesize = useCallback(
  async (statement: string) => {
    const clean = statement.trim();
    if (!trace || clean.length < 3) return null;

    const parent = trace.paths.find((p) => p.id === ui.activePathId) ?? null;

    const ids = addPaths(
      trace.id,
      [
        {
          title: clean.length > 48 ? `${clean.slice(0, 45)}…` : clean,
          thesis: clean,
          angle: '',
          keyMoves: [],
          risks: [],
          payoff: '',
          divergence: parent
            ? `Hypothèse ouverte depuis « ${parent.title} ».`
            : 'Hypothèse ouverte depuis l\'idée initiale.',
        },
      ],
      parent
        ? {
            pathId: parent.id,
            entryIndex: parent.timeline.length,
            branch: {
              id: '',
              question: clean,
              alternative: `${parent.title} — ${parent.thesis}`,
              chosen: clean,
              costOfChoice: '',
              atEntryIndex: parent.timeline.length,
              createdAt: new Date().toISOString(),
            },
          }
        : undefined
    );

    appendEvent(
      makeEvent('branch', 'user', `Hypothèse — ${clean}`, {
        detail: parent ? `depuis « ${parent.title} »` : 'depuis l\'idée initiale',
        pathId: ids[0],
        color: trace.paths.find((p) => p.id === ids[0])?.color,
      })
    );

    // Une décision prise sans cette hypothèse n'est plus valable.
    if (trace.status === 'arbitrated' || trace.verdict) {
      reopenVerdict(trace.id, `Une hypothèse est arrivée après la décision : ${clean}`);
    }

    if (ids[0]) {
      setActivePath(ids[0]);
      setTraceStep(4);
    }

    return ids[0] ?? null;
  },
  [trace, ui.activePathId, addPaths, appendEvent, reopenVerdict, setActivePath, setTraceStep]
);

return {
    trace,
    traces,
    activeTraceId,
    step: ui.traceStep,
    activePathId: ui.activePathId,
    pending,
    error,

    setError,
    createTrace,
    setActiveTrace,
    deleteTrace,
    setStep: setTraceStep,
    setActivePath,

    declareSpark,
    read,
    editReading,
    rejectItem,
    addItem,
    setNote,
    project,
    descend,
    fork,
    hypothesize,
    confront,
    arbitrate,
    eliminate,
    restore,
    commit,
    removeDescent,
  };
}

export default useTrace;

// ========================================
// Trace d'exemple - pour voir le moteur en action
// ========================================

export function seedExampleTrace(createTrace: () => string): string {
  return createTrace();
}

export function makeUserPathId(): string {
  return generateId();
}