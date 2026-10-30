import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export const answerSchema = z.object({
  answer: z.string().min(1),
  supported: z.boolean().catch(true),
  sourcePages: z.array(z.coerce.number().int()).nullish().transform((v) => v ?? []).catch([]),
});

export const quizItem = z.object({
  question: z.string().min(5),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.coerce.number().int().min(0).max(3),
  explanation: z.string().min(1),
  topic: z.string().min(1).catch('General'),
});

export const cardItem = z.object({
  front: z.string().min(2),
  back: z.string().min(1),
  topic: z.string().min(1).catch('General'),
});

const AI_FORMAT_ERROR = 'The AI returned an unexpected format. Please try again.';

export function extractJson(raw) {
  const text = String(raw).replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    return JSON.parse(text);
  } catch {
    // Fallback: take the part between the first { or [ and the last } or ]
    const start = text.search(/[{[]/);
    const end = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch { /* fall through */ }
    }
    console.error(`[ai] could not parse JSON (length ${text.length}, starts with "${text.slice(0, 20).replace(/\s+/g, ' ')}")`);
    throw new ApiError(502, AI_FORMAT_ERROR);
  }
}

export function parseJson(raw, schema) {
  let json = extractJson(raw);
  if (Array.isArray(json) && json.length === 1) json = json[0]; // model sometimes wraps the object in an array
  const r = schema.safeParse(json);
  if (!r.success) {
    console.error('[ai] schema mismatch:', r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
    throw new ApiError(502, AI_FORMAT_ERROR);
  }
  return r.data;
}

/** Keeps valid items from a list and drops malformed ones; fails only if nothing usable remains. */
export function parseList(raw, key, itemSchema) {
  const json = extractJson(raw);
  const arr = Array.isArray(json) ? json : json?.[key];
  if (!Array.isArray(arr)) {
    console.error('[ai] expected a list under key:', key);
    throw new ApiError(502, AI_FORMAT_ERROR);
  }
  const items = arr.map((x) => itemSchema.safeParse(x)).filter((r) => r.success).map((r) => r.data);
  if (!items.length) {
    console.error('[ai] no valid items in the list');
    throw new ApiError(502, AI_FORMAT_ERROR);
  }
  return items;
}