// ========================================
// IMAGINE - Trace AI Service
// Le moteur cognitif : lecture, projection, descente,
// confrontation, arbitrage
// ========================================

import type {
  ComparisonCriterion,
  ConfrontationPayload,
  DescentPayload,
  PathPayload,
  PathScoreRow,
  ReadRequest,
  ReadingPayload,
  VerdictPayload,
} from '@/types';
import {
  callGroq,
  safeJsonParse,
  asString,
  asStringList,
  normalizeScore,
  average,
  GROQ_MODEL,
} from '@/lib/groq';

// ========================================
// 1. Lecture - comprendre avant de répondre
// ========================================

async function readIdea(input: ReadRequest): Promise<ReadingPayload> {
  const corrections: string[] = [];

  if (input.draft) {
    corrections.push(
      [
        'Lecture déjà produite, que l\'utilisateur a corrigée. C\'est ton point de départ.',
        `Reformulation actuelle : ${input.draft.restatement}`,
        `Sujet actuel : ${input.draft.subject}`,
        `Intention actuelle : ${input.draft.intent}`,
        input.draft.implicits.length ? `Présupposés actuels : ${input.draft.implicits.join(' ; ')}` : '',
        input.draft.tensions.length ? `Tensions actuelles : ${input.draft.tensions.join(' ; ')}` : '',
        input.draft.constraints.length ? `Contraintes actuelles : ${input.draft.constraints.join(' ; ')}` : '',
        input.draft.unknowns.length ? `Inconnues actuelles : ${input.draft.unknowns.join(' ; ')}` : '',
        input.draft.stakes ? `Enjeu actuel : ${input.draft.stakes}` : '',
        `Question décisive actuelle : ${input.draft.decisiveQuestion}`,
      ]
        .filter(Boolean)
        .join('\n')
    );
  }

  if (input.rejected?.length) {
    corrections.push(
      `Éléments rejetés par l'utilisateur — ne les réutilise pas, ne les reformule pas, ne les rebuilds pas autrement :\n${input.rejected
        .map((r) => `- ${r}`)
        .join('\n')}`
    );
  }

  if (input.added?.length) {
    corrections.push(
      `Éléments que l'utilisateur ajoute et qui font autorité :\n${input.added
        .map((a) => `- ${a}`)
        .join('\n')}`
    );
  }

  if (input.note?.trim()) {
    corrections.push(`Précision de l'utilisateur, elle fait autorité :\n${input.note.trim()}`);
  }

  const correctionBlock = corrections.length
    ? `\n\n--- CORRECTIONS DE L'UTILISATEUR ---\n${corrections.join('\n\n')}\n\nRègles sur ces corrections :\n- Elles priment sur ton jugement. Si tu les contredis, c'est toi qui as tort.\n- Conserve ce qui était juste. N'efface pas ce qui n'a pas été contesté.\n- Si une correction te paraît absurde, respecte-la quand même : c'est sa décision, pas la tienne.`
    : '';

  const material = [
    `Idée :\n${input.spark}`,
    input.context ? `Contexte :\n${input.context}` : '',
    input.horizon ? `Horizon souhaité :\n${input.horizon}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const response = await callGroq(
    [
      {
        role: 'system',
        content: `Tu es le lecteur d'IMAGINE. Quelqu'un te confie une idée. Ton travail n'est PAS de l'encourager, ni de proposer des idées, ni de faire un plan. Ton travail est de montrer que tu as compris, et de révéler ce que la formulation cache.

Tu écris comme un stratège lucide et sans complaisance. Tu ne flatteras jamais. Si l'énoncé est flou, tu le dis. S'il se contredit, tu le montres. S'il est faible, tu le dis aussi, précisément.

Retourne STRICTEMENT ce JSON, sans texte autour, sans markdown :
{
  "restatement": "Reformulation fidèle en 1 à 3 phrases, dans tes mots, plus précise que l'original. Pas un résumé : une reformulation que l'utilisateur pourrait signer.",
  "subject": "Le sujet réel, en une phrase. De quoi parle-t-on vraiment ?",
  "intent": "Ce que l'utilisateur cherche vraiment à obtenir, même s'il ne l'a pas dit. Une à deux phrases.",
  "implicits": ["3 à 5 présupposés contenus dans l'énoncé sans être énoncés. Chacun reformule un postulat précis."],
  "tensions": ["0 à 3 contradictions internes à l'énoncé. Chacune formulée comme 'X implique Y, mais...' ou '...alors que...'."],
  "constraints": ["0 à 4 ce qui est non négociable : moyens, convictions, interdits explicites ou implicites."],
  "unknowns": ["2 à 4 ce qui manque pour pouvoir décider. Chacune doit être une information qui, si on l'avait, changerait la décision."],
  "stakes": "Ce qui se joue réellement. Ce qui se passe si ça réussit, et ce qui se passe si ça échoue.",
  "decisiveQuestion": "LA seule question dont la réponse trancherait. Une question, pas une liste. Précise et vérifiable."
}

Écris en français. Sois dense, pas bavard.

N'invente jamais de chiffre, de statistique, de citation, de nom d'étude ni de source. Si une donnée chiffrée est nécessaire pour trancher et que tu ne la connais pas, écris « [à vérifier] » et explique pourquoi elle serait décisive. Une décision fondée sur des chiffres inventés est pire que pas de décision.`,
      },
      { role: 'user', content: material + correctionBlock },
    ],
    { temperature: 0.4, maxTokens: 1600, json: true }
  );

  const parsed = safeJsonParse(response.choices[0]?.message?.content || '{}');

  return {
    restatement: asString(parsed.restatement, input.spark),
    subject: asString(parsed.subject),
    intent: asString(parsed.intent),
    implicits: asStringList(parsed.implicits),
    tensions: asStringList(parsed.tensions),
    constraints: asStringList(parsed.constraints),
    unknowns: asStringList(parsed.unknowns),
    stakes: asString(parsed.stakes),
    decisiveQuestion: asString(parsed.decisiveQuestion),
  };
}

// ========================================
// 2. Projection - des trajectoires, pas des variantes
// ========================================

async function projectPaths(input: {
  spark: string;
  reading: ReadingPayload | null;
  count: number;
  avoid?: string[];
}): Promise<PathPayload[]> {
  const count = Math.max(2, Math.min(6, input.count || 4));

  const readingBlock = input.reading
    ? [
        `Reformulation : ${input.reading.restatement}`,
        `Sujet réel : ${input.reading.subject}`,
        `Intention perçue : ${input.reading.intent}`,
        input.reading.implicits.length
          ? `Présupposés : ${input.reading.implicits.join(' ; ')}`
          : '',
        input.reading.tensions.length
          ? `Tensions : ${input.reading.tensions.join(' ; ')}`
          : '',
        input.reading.constraints.length
          ? `Contraintes : ${input.reading.constraints.join(' ; ')}`
          : '',
        `Enjeu : ${input.reading.stakes}`,
        `Question décisive : ${input.reading.decisiveQuestion}`,
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  const response = await callGroq(
    [
      {
        role: 'system',
        content: `Tu es le projecteur d'IMAGINE. À partir d'une idée, tu produis des TRAJECTOIRES : des stratégies qui mènent vraiment ailleurs.

Règle absolue : deux trajectoires qui pourraient être fusionnées en une seule ne sont pas deux trajectoires, ce sont des variantes. Écris-les pour qu'elles soient IRRÉCONCILABLES comme stratégie — elles ne peuvent pas être entreprises ensemble. Chacune engage différemment, postule différemment, et possède son propre mode d'échec.

Une trajectoire n'est pas « une variante de A ». C'est un engagement qu'on ne pourrait pas tenir en même temps qu'un autre.

Retourne STRICTEMENT ce JSON :
{
  "paths": [
    {
      "title": "3 à 5 mots. Un nom de stratégie, pas un thème. Ex : « Réduire le périmètre », « Changer de contrainte ».",
      "thesis": "L'hypothèse centrale, en une phrase affirmative. Ce qu'on décide de croire et de défendre.",
      "angle": "Sous quel angle cette trajectoire traite le problème. Une phrase.",
      "keyMoves": ["3 à 4 gestes concrets, spécifiques, faisables. Des actions, pas des abstractions."],
      "risks": ["2 à 3 risques réels et spécifiques de cette trajectoire. Pas des risques génériques."],
      "payoff": "Ce qu'elle produit si elle réussit. Une phrase concrète.",
      "divergence": "En quoi elle se sépare des autres, et quel engagement elle exclut. Une phrase."
    }
  ]
}

Écris en français. Aucun remplissage.`,
      },
      {
        role: 'user',
        content: `Idée :\n${input.spark}\n\n${readingBlock}\n\n${
          input.avoid?.length
            ? `Trajectoires déjà proposées, à ne pas répéter : ${input.avoid.join(' ; ')}\n\n`
            : ''
        }Produis exactement ${count} trajectoires.`,
      },
    ],
    { temperature: 0.9, maxTokens: 2200, json: true }
  );

  const parsed = safeJsonParse(response.choices[0]?.message?.content || '{}');

  return (Array.isArray(parsed.paths) ? parsed.paths : [])
    .filter((p: any) => typeof p?.title === 'string' && typeof p?.thesis === 'string')
    .slice(0, count)
    .map((p: any) => ({
      title: p.title,
      thesis: p.thesis,
      angle: asString(p.angle),
      keyMoves: asStringList(p.keyMoves),
      risks: asStringList(p.risks),
      payoff: asString(p.payoff),
      divergence: asString(p.divergence),
    }));
}

// ========================================
// 3. Descente - pousser une trajectoire jusqu'au mur
// ========================================

async function deepenPath(input: {
  spark: string;
  reading: ReadingPayload | null;
  path: { title: string; thesis: string; angle: string; keyMoves: string[] };
  timeline: Array<{ question: string; analysis: string; wall: string }>;
  probe: string;
}): Promise<DescentPayload> {
  const history = input.timeline.length
    ? input.timeline
        .map(
          (e, i) =>
            `Passage ${i + 1} — ${e.question}\n${e.analysis}${
              e.wall ? `\nMur rencontré : ${e.wall}` : ''
            }`
        )
        .join('\n\n')
    : 'Aucun passage encore. Premier état des lieux.';

  const response = await callGroq(
    [
      {
        role: 'system',
        content: `Tu es l'explorateur d'IMAGINE. Tu descends dans UNE trajectoire et tu avances jusqu'au bout.

Tu ne produis pas des idées, tu produis du mouvement. Tu prends la trajectoire au sérieux, tu la pousses, et tu avances jusqu'où elle tient réellement. Si elle s'effondre, tu le dis clairement et tu nommes le mur. Ne ménage pas la trajectoire : elle n'est pas fragile, elle est en train d'être testée.

Retourne STRICTEMENT ce JSON :
{
  "question": "La question que ce passage tranche. Reformule-la si la question de l'utilisateur est vague.",
  "analysis": "Le développement. 150 à 300 mots. Denses, concrets, avec des noms, des chiffres, des acteurs quand c'est possible. Pas de généralités.",
  "consequences": ["3 à 5 conséquences. Ce qui change dans le monde si on prend cette trajectoire."],
  "decision": "La décision que ce passage permet de prendre. Une phrase, directement actionnable.",
  "produces": "Ce que cette trajectoire produit concrètement si on la mène jusqu'au bout. Une phrase.",
  "costs": "Ce qu'elle coûte réellement : temps, énergie, capital, attention, options fermées. Une phrase.",
  "unknowns": ["1 à 3 inconnues qui subsistent APRÈS ce passage."],
  "wall": "Le point où cette trajectoire cesse d'être tenable sans décision supplémentaire — ou la condition exacte à remplir pour qu'elle reste ouverte. Une phrase. Si aucun mur n'existe encore, écris ce qu'il faudrait explorer pour en trouver un."
}

Écris en français.

N'invente jamais de chiffre, de statistique, de citation, de nom d'étude ni de source. Si une donnée chiffrée est nécessaire pour trancher et que tu ne la connais pas, écris « [à vérifier] » et explique pourquoi elle serait décisive.`,
      },
      {
        role: 'user',
        content: `Idée initiale :\n${input.spark}\n\nTrajectoire :\n${
          input.path.title
        } — ${input.path.thesis}\n${input.path.angle}\n${input.path.keyMoves
          .map((m) => `- ${m}`)
          .join('\n')}\n\n${history}\n\nQuestion à trancher :\n${
          input.probe ||
          "Avance jusqu'où cette trajectoire tient. Ne t'arrête pas au premier résultat confortable : cherche le mur."
        }`,
      },
    ],
    { temperature: 0.7, maxTokens: 2000, json: true }
  );

  const parsed = safeJsonParse(response.choices[0]?.message?.content || '{}');

  return {
    question: asString(parsed.question, input.probe || 'État des lieux'),
    analysis: asString(parsed.analysis),
    consequences: asStringList(parsed.consequences),
    decision: asString(parsed.decision),
    produces: asString(parsed.produces),
    costs: asString(parsed.costs),
    unknowns: asStringList(parsed.unknowns),
    wall: asString(parsed.wall),
  };
}

// ========================================
// 4. Confrontation - mesurer, pas préférer
// ========================================

async function comparePaths(input: {
  spark: string;
  reading: ReadingPayload | null;
  paths: Array<{
    id: string;
    title: string;
    thesis: string;
    angle: string;
    payoff: string;
    risks: string[];
    timeline: Array<{ question: string; analysis: string; wall: string }>;
  }>;
  criteria: ComparisonCriterion[];
}): Promise<ConfrontationPayload> {
  const live = input.paths;
  if (live.length === 0) {
    return { criteria: input.criteria, rows: [], synthesis: '', discriminator: '' };
  }

  const numbered = live
    .map(
      (p, i) =>
        `Trajectoire ${i + 1}\nTitre : ${p.title}\nHypothèse : ${p.thesis}\nAngle : ${p.angle}\nProduit : ${p.payoff}\nRisques : ${p.risks.join(' ; ')}\n${
          p.timeline.length
            ? `Descentes réalisées :\n${p.timeline
                .map(
                  (e) =>
                    `  - ${e.question} → ${e.analysis}${e.wall ? ` [mur : ${e.wall}]` : ''}`
                )
                .join('\n')}`
            : 'Aucune descente réalisée.'
        }`
    )
    .join('\n\n');

  const criteriaBlock = input.criteria
    .map((c) => `- ${c.key} : ${c.label} — ${c.description} (0 = très faible, 100 = très fort)`)
    .join('\n');

  const response = await callGroq(
    [
      {
        role: 'system',
        content: `Tu es l'arbitre d'IMAGINE. Tu confrontes des trajectoires sur des critères communs. Tu ne classes pas selon tes préférences : tu mesures.

Règles :
- Les notes vont de 0 à 100. Sois sévère : si tout est à 80, tu n'as rien mesuré. Utilise toute l'échelle.
- Pour un critère où moins vaut mieux (coût, risque), 100 signifie « faible coût / faible risque ».
- Chaque note porte une justification d'une phrase qui cite un élément précis de la trajectoire.
- Le total est la moyenne des notes. Ne le truque pas.

Retourne STRICTEMENT ce JSON :
{
  "criteria": [{"key": "...", "label": "...", "description": "..."}],
  "rows": [
    {
      "index": 0,
      "values": { "feasibility": 62, "impact": 81, "cost": 45, "risk": 70, "coherence": 88 },
      "rationale": {
        "feasibility": "une phrase",
        "impact": "une phrase",
        "cost": "une phrase",
        "risk": "une phrase",
        "coherence": "une phrase"
      },
      "total": 69
    }
  ],
  "synthesis": "250 à 400 mots. Le vrai arbitrage : ce qu'on gagne, ce qu'on perd, et pourquoi le choix est difficile ou ne l'est pas. Cite les trajectoires par leur titre.",
  "discriminator": "LA question unique dont la réponse changerait le classement. Une question, précise et vérifiable. Si rien ne peut départager, écris ce qu'il faudrait savoir."
}

Réutilise exactement les clés de critères fournies. L'index de chaque row correspond à l'ordre des trajectoires données (0 pour la première). Écris en français.

N'invente jamais de chiffre, de statistique, de citation, de nom d'étude ni de source. Si une donnée chiffrée est nécessaire pour trancher et que tu ne la connais pas, écris « [à vérifier] » et explique pourquoi elle serait décisive.`,
      },
      {
        role: 'user',
        content: `Idée initiale :\n${input.spark}\n\n${
          input.reading
            ? `Intention : ${input.reading.intent}\nEnjeu : ${input.reading.stakes}\n`
            : ''
        }Critères :\n${criteriaBlock}\n\n${numbered}`,
      },
    ],
    { temperature: 0.35, maxTokens: 2600, json: true }
  );

  const parsed = safeJsonParse(response.choices[0]?.message?.content || '{}');

  const criteria: ComparisonCriterion[] =
    Array.isArray(parsed.criteria) && parsed.criteria.length
      ? parsed.criteria
          .filter((c: any) => typeof c?.key === 'string')
          .map((c: any) => ({
            key: c.key,
            label: asString(c.label, c.key),
            description: asString(c.description),
          }))
      : input.criteria;

  const keys = criteria.map((c) => c.key);

  const rows: PathScoreRow[] = (
    (Array.isArray(parsed.rows) ? parsed.rows : []) as any[]
  )
    .map((r: any) => {
      const index = typeof r?.index === 'number' ? r.index : -1;
      if (index < 0 || index >= live.length) return null;
      const values: Record<string, number> = {};
      const rationale: Record<string, string> = {};
      keys.forEach((k) => {
        values[k] = normalizeScore(k, r.values?.[k]);
        rationale[k] = asString(r.rationale?.[k]);
      });
      return {
        pathId: live[index].id,
        values,
        rationale,
        total: typeof r.total === 'number' ? r.total : average(values),
      };
    })
    .filter((r): r is PathScoreRow => r !== null && r !== undefined);

  return {
    criteria,
    rows: rows.length > 0 ? rows : live.map((p) => ({ pathId: p.id, values: {}, rationale: {}, total: 0 })),
    synthesis: asString(parsed.synthesis),
    discriminator: asString(parsed.discriminator),
  };
}

// ========================================
// 5. Arbitrage - trancher
// ========================================

async function arbitrate(input: {
  spark: string;
  reading: ReadingPayload | null;
  paths: Array<{ id: string; title: string; thesis: string; payoff: string }>;
  confrontation: ConfrontationPayload | null;
}): Promise<VerdictPayload> {
  if (input.paths.length === 0) {
    throw new Error('Aucune trajectoire à arbitrer');
  }

  const numbered = input.paths
    .map((p, i) => `Trajectoire ${i + 1} — ${p.title}\nHypothèse : ${p.thesis}\nProduit : ${p.payoff}`)
    .join('\n\n');

  const scoresBlock = input.confrontation
    ? input.confrontation.rows
        .map((r) => {
          const p = input.paths.find((x) => x.id === r.pathId);
          const values = Object.entries(r.values)
            .map(([k, v]) => `${k}:${v}`)
            .join(' ');
          return `- ${p?.title ?? r.pathId} → total ${r.total} (${values})`;
        })
        .join('\n')
    : '';

  const response = await callGroq(
    [
      {
        role: 'system',
        content: `Tu es le juge d'IMAGINE. Tu tranches. On ne peut pas tout retenir : une décision exige d'abandonner.

Tu ne lisses pas vers le consensus. Si une trajectoire est meilleure, tu le dis sans trembler. Si elles sont équivalentes, tu le dis aussi, et tu proposes la plus réversible. Tu ne recommandes jamais par défaut.

Retourne STRICTEMENT ce JSON :
{
  "index": 0,
  "confidence": 0.0,
  "why": "150 à 300 mots. Pourquoi celle-là. Cite les éléments précis qui départagent. Assume le choix.",
  "decisiveFactors": ["2 à 4 facteurs qui ont réellement fait la différence."],
  "whatItImplies": ["3 à 5 conséquences concrètes de ce choix, y compris ce qu'on perd."],
  "falsifiers": ["2 à 4 observations ou résultats qui prouveraient que ce choix est faux. Ils doivent être vérifiables."],
  "nextActions": ["3 à 5 premiers gestes, du plus immédiat au plus structurant."],
  "changeConditions": ["1 à 3 conditions qui justifieraient de rouvrir la décision."],
  "closing": "Une seule phrase. Le bilan net de la décision. Elle doit pouvoir servir de conclusion du tracé."
}

"index" désigne la trajectoire retenue, par sa position (0 pour la première). "confidence" entre 0 et 1. Écris en français.

N'invente jamais de chiffre, de statistique, de citation, de nom d'étude ni de source. Si une donnée chiffrée est nécessaire pour trancher et que tu ne la connais pas, écris « [à vérifier] » et explique pourquoi elle serait décisive.`,
      },
      {
        role: 'user',
        content: `Idée initiale :\n${input.spark}\n\n${
          input.reading
            ? `Reformulation : ${input.reading.restatement}\nIntention : ${input.reading.intent}\nQuestion décisive : ${input.reading.decisiveQuestion}\n`
            : ''
        }${numbered}\n\n${
          scoresBlock
            ? `Notes de la confrontation :\n${scoresBlock}\n\nSynthèse : ${input.confrontation?.synthesis}\nDiscriminant : ${input.confrontation?.discriminator}\n`
            : ''
        }`,
      },
    ],
    { temperature: 0.35, maxTokens: 2000, json: true }
  );

  const parsed = safeJsonParse(response.choices[0]?.message?.content || '{}');

  const index = typeof parsed.index === 'number' ? parsed.index : 0;
  const clamped = Math.max(0, Math.min(input.paths.length - 1, index));

  return {
    recommendedPathId: input.paths[clamped].id,
    confidence: Math.max(
      0,
      Math.min(1, typeof parsed.confidence === 'number' ? parsed.confidence : 0.6)
    ),
    why: asString(parsed.why),
    decisiveFactors: asStringList(parsed.decisiveFactors),
    whatItImplies: asStringList(parsed.whatItImplies),
    falsifiers: asStringList(parsed.falsifiers),
    nextActions: asStringList(parsed.nextActions),
    changeConditions: asStringList(parsed.changeConditions),
    closing: asString(parsed.closing),
  };
}

// ========================================
// Export
// ========================================

export const traceAI = {
  readIdea,
  projectPaths,
  deepenPath,
  comparePaths,
  arbitrate,
  model: GROQ_MODEL,
};

export default traceAI;