import DocumentModel from '../models/Document.js';
import Note from '../models/Note.js';
import { ApiError } from '../utils/ApiError.js';
import { findOwned } from '../utils/http.js';
import { getDocumentText } from './retrievalService.js';

/** Resolves study text from a document or a note the user owns. */
export async function resolveSource(userId, { documentId, noteId }) {
  if (noteId) {
    const note = await findOwned(Note, noteId, userId);
    return { text: note.content.slice(0, 60_000), title: note.title, document: note.document || null };
  }
  const doc = await findOwned(DocumentModel, documentId, userId);
  if (doc.status !== 'ready') throw new ApiError(409, 'This document is not ready yet.');
  const text = await getDocumentText(userId, doc._id);
  if (!text) throw new ApiError(422, 'No text is available for this document.');
  return { text, title: doc.title, document: doc._id };
}
