// ========================================
// IMAGINE - Groq Client
// Client bas niveau partagé par les services IA
// ========================================

export const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface CallOptions {
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
}

// ========================================
// JSON extraction
// Les modèles enveloppent parfois le JSON dans du markdown
// ou l'accompagnent d'un raisonnement.
// ========================================

export function parseJsonContent(raw: string): string {
  let content = (raw ?? '').trim();

  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) content = fenced[1].trim();

  if (!content.startsWith('{') && !content.startsWith('[')) {
    const start = content.search(/[[{]/);
    const end = Math.max(content.lastIndexOf('}'), content.lastIndexOf(']'));
    if (start !== -1 && end > start) {
      content = content.slice(start, end + 1);
    }
  }

  return content;
}

export function safeJsonParse(raw: string): any {
  try {
    return JSON.parse(parseJsonContent(raw));
  } catch (error) {
    console.error('[Groq] JSON parse error:', error, '\nRaw:', raw?.slice(0, 500));
    return {};
  }
}

// ========================================
// Coercions défensives
// Un modèle ne respecte pas toujours le schéma demandé.
// ========================================

export function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string' && !!v.trim())
    .map((v) => v.trim());
}

export function normalizeScore(_key: string, value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function average(values: Record<string, number>): number {
  const nums = Object.values(values).filter((v) => typeof v === 'number');
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

// ========================================
// Client
// ========================================

export async function callGroq(
  messages: GroqMessage[],
  options: CallOptions = {}
): Promise<GroqResponse> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY non configurée');
  }

  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      ...(options.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  return response.json();
}