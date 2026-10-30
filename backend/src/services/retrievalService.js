import Chunk from '../models/Chunk.js';
import { embedTexts } from './aiService.js';

const STOP = new Set('the a an and or of to in on for with is are was were be what which who how why when does do did this that it as by from at about'.split(' '));

export function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

export function keywordScore(question, text) {
  const words = question.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)?.filter((w) => !STOP.has(w)) || [];
  const hay = text.toLowerCase();
  return words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
}

/**
 * Semantic retrieval over this document's chunks (in-memory cosine similarity: a practical local/dev
 * approach). Falls back to keyword scoring when embeddings are unavailable.
 */
export async function retrieve(userId, documentId, question, k = 6) {
  const chunks = await Chunk.find({ user: userId, document: documentId }).select('+embedding').lean();
  let scored = null;
  if (chunks.some((c) => c.embedding?.length)) {
    try {
      const [qv] = await embedTexts([question], 'RETRIEVAL_QUERY');
      scored = chunks.map((c) => ({ c, score: c.embedding?.length ? cosine(qv, c.embedding) : 0 }));
    } catch {
      scored = null; // quota/timeouts on embeddings should not block chat
    }
  }
  if (!scored) scored = chunks.map((c) => ({ c, score: keywordScore(question, c.text) }));
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .filter((s) => s.score > 0)
    .map((s) => ({ page: s.c.page, text: s.c.text }));
}

const MAX_SOURCE_CHARS = 60_000;

/** Reads a document's text back (page-marked) for notes/quizzes/flashcards, sampling evenly if too long. */
export async function getDocumentText(userId, documentId, maxChars = MAX_SOURCE_CHARS) {
  const chunks = await Chunk.find({ user: userId, document: documentId }).sort({ page: 1, index: 1 }).select('page text').lean();
  const total = chunks.reduce((s, c) => s + c.text.length, 0);
  const keep = total > maxChars ? maxChars / total : 1;
  let out = '';
  let lastPage = 0;
  chunks.forEach((c, i) => {
    if (keep < 1 && Math.floor(i * keep) === Math.floor((i - 1) * keep) && i > 0) return;
    if (c.page !== lastPage) {
      out += `\n[Page ${c.page}]\n`;
      lastPage = c.page;
    }
    out += `${c.text}\n`;
  });
  return out.trim();
}
