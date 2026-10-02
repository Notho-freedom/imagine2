// ========================================
// IMAGINE - Trace API
// Moteur de décision : lecture, projection, descente,
// confrontation, arbitrage
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { traceAI } from '@/lib/ai-trace';
import { DEFAULT_CRITERIA } from '@/lib/trace';
import type { ReadingPayload } from '@/types';

function readingFrom(data: any): ReadingPayload | null {
  const r = data?.reading;
  if (!r || typeof r.restatement !== 'string') return null;
  return {
    restatement: r.restatement,
    subject: typeof r.subject === 'string' ? r.subject : '',
    intent: typeof r.intent === 'string' ? r.intent : '',
    implicits: Array.isArray(r.implicits) ? r.implicits : [],
    tensions: Array.isArray(r.tensions) ? r.tensions : [],
    constraints: Array.isArray(r.constraints) ? r.constraints : [],
    unknowns: Array.isArray(r.unknowns) ? r.unknowns : [],
    stakes: typeof r.stakes === 'string' ? r.stakes : '',
    decisiveQuestion: typeof r.decisiveQuestion === 'string' ? r.decisiveQuestion : '',
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body ?? {};

    switch (action) {
      // ------------------------------------------------
      // 1. LECTURE
      // ------------------------------------------------
      case 'readIdea': {
        const spark = (data?.spark || '').trim();
        if (!spark) {
          return NextResponse.json(
            { success: false, error: 'Aucune idée à lire' },
            { status: 400 }
          );
        }
        const reading = await traceAI.readIdea({
          spark,
          context: data?.context || '',
          horizon: data?.horizon || '',
        });
        return NextResponse.json({ success: true, result: reading });
      }

      // ------------------------------------------------
      // 2. PROJECTION
      // ------------------------------------------------
      case 'projectPaths': {
        const spark = (data?.spark || '').trim();
        if (!spark) {
          return NextResponse.json(
            { success: false, error: 'Aucune idée à projeter' },
            { status: 400 }
          );
        }
        const paths = await traceAI.projectPaths({
          spark,
          reading: readingFrom(data),
          count: typeof data?.count === 'number' ? data.count : 4,
          avoid: Array.isArray(data?.avoid) ? data.avoid : [],
        });
        return NextResponse.json({ success: true, result: { paths } });
      }

      // ------------------------------------------------
      // 3. DESCENTE
      // ------------------------------------------------
      case 'deepenPath': {
        const path = data?.path;
        if (!path) {
          return NextResponse.json(
            { success: false, error: 'Aucune trajectoire à descendre' },
            { status: 400 }
          );
        }
        const entry = await traceAI.deepenPath({
          spark: data?.spark || '',
          reading: readingFrom(data),
          path: {
            title: path.title || '',
            thesis: path.thesis || '',
            angle: path.angle || '',
            keyMoves: Array.isArray(path.keyMoves) ? path.keyMoves : [],
          },
          timeline: Array.isArray(data?.timeline) ? data.timeline : [],
          probe: data?.probe || '',
        });
        return NextResponse.json({ success: true, result: entry });
      }

      // ------------------------------------------------
      // 4. CONFRONTATION
      // ------------------------------------------------
      case 'comparePaths': {
        const paths = Array.isArray(data?.paths) ? data.paths : [];
        if (paths.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Aucune trajectoire à confronter' },
            { status: 400 }
          );
        }
        const confrontation = await traceAI.comparePaths({
          spark: data?.spark || '',
          reading: readingFrom(data),
          paths: paths.map((p: any) => ({
            id: p.id,
            title: p.title || '',
            thesis: p.thesis || '',
            angle: p.angle || '',
            payoff: p.payoff || '',
            risks: Array.isArray(p.risks) ? p.risks : [],
            timeline: Array.isArray(p.timeline) ? p.timeline : [],
          })),
          criteria: Array.isArray(data?.criteria) && data.criteria.length
            ? data.criteria
            : DEFAULT_CRITERIA,
        });
        return NextResponse.json({ success: true, result: confrontation });
      }

      // ------------------------------------------------
      // 5. ARBITRAGE
      // ------------------------------------------------
      case 'arbitrate': {
        const paths = Array.isArray(data?.paths) ? data.paths : [];
        if (paths.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Aucune trajectoire à arbitrer' },
            { status: 400 }
          );
        }
        const verdict = await traceAI.arbitrate({
          spark: data?.spark || '',
          reading: readingFrom(data),
          paths: paths.map((p: any) => ({
            id: p.id,
            title: p.title || '',
            thesis: p.thesis || '',
            payoff: p.payoff || '',
          })),
          confrontation: data?.confrontation || null,
        });
        return NextResponse.json({ success: true, result: verdict });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Action inconnue : ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Trace API Error]', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Erreur serveur du moteur de trace';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  const hasApiKey = !!process.env.GROQ_API_KEY;

  return NextResponse.json({
    status: hasApiKey ? 'ok' : 'missing_api_key',
    service: 'trace',
    model: traceAI.model,
    capabilities: [
      'readIdea',
      'projectPaths',
      'deepenPath',
      'comparePaths',
      'arbitrate',
    ],
    configured: hasApiKey,
  });
}