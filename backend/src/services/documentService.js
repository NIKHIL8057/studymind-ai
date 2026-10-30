import fs from 'node:fs/promises';
import path from 'node:path';
import Chunk from '../models/Chunk.js';
import Conversation from '../models/Conversation.js';
import DocumentModel from '../models/Document.js';
import Message from '../models/Message.js';
import { embedTexts } from './aiService.js';
import { chunkPages, extractPages } from './pdfService.js';

const MAX_CHUNKS = 600;
const MIN_CHARS_PER_PAGE = 40;

async function fail(doc, message) {
  doc.status = 'failed';
  doc.error = message;
  await doc.save();
}

/** Runs in the background after upload: extract text -> chunk -> embed -> mark ready. */
export async function processDocument(docId) {
  const doc = await DocumentModel.findById(docId).select('+filePath');
  if (!doc) return;
  try {
    const pages = await extractPages(await fs.readFile(doc.filePath));
    const chars = pages.join('').replace(/\s/g, '').length;
    if (!pages.length || chars / pages.length < MIN_CHARS_PER_PAGE) {
      return await fail(doc, 'No selectable text was found. This looks like a scanned PDF, which needs OCR before it can be used. Run it through an OCR tool and upload the result.');
    }
    const chunks = chunkPages(pages).slice(0, MAX_CHUNKS);
    const rows = await Chunk.insertMany(chunks.map((c) => ({ ...c, user: doc.user, document: doc._id })));
    doc.pageCount = pages.length;
    doc.chunkCount = rows.length;

    try {
      const vectors = await embedTexts(rows.map((r) => r.text));
      await Chunk.bulkWrite(rows.map((r, i) => ({ updateOne: { filter: { _id: r._id }, update: { $set: { embedding: vectors[i] } } } })));
      doc.embedded = true;
    } catch (e) {
      console.error('[embeddings] skipped, keyword search will be used:', e.message);
    }
    doc.status = 'ready';
    await doc.save();
  } catch (e) {
    console.error('[process] failed:', e.message);
    await fail(doc, 'This PDF could not be read. It may be corrupted or password-protected.').catch(() => {});
  }
}

export async function deleteDocumentData(doc, userId) {
  const convos = await Conversation.find({ document: doc._id, user: userId }).select('_id');
  await Promise.all([
    Message.deleteMany({ conversation: { $in: convos.map((c) => c._id) } }),
    Conversation.deleteMany({ document: doc._id, user: userId }),
    Chunk.deleteMany({ document: doc._id, user: userId }),
    doc.filePath ? fs.rm(path.resolve(doc.filePath), { force: true }) : null,
  ]);
  await doc.deleteOne();
}
