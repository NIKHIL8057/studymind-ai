import fs from 'node:fs/promises';
import path from 'node:path';
import DocumentModel from '../models/Document.js';
import { logActivity } from '../services/activityService.js';
import { deleteDocumentData, processDocument } from '../services/documentService.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, escapeRegex, findOwned, ok, parsePaging } from '../utils/http.js';

const SORTS = { '-createdAt': { createdAt: -1 }, createdAt: { createdAt: 1 }, title: { title: 1 }, '-title': { title: -1 }, '-size': { size: -1 } };

export const upload = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Choose a PDF file to upload.');
  // Verify the real file signature, not just the declared MIME type.
  const fh = await fs.open(req.file.path, 'r');
  const head = Buffer.alloc(5);
  await fh.read(head, 0, 5, 0);
  await fh.close();
  if (head.toString('latin1') !== '%PDF-') {
    await fs.rm(req.file.path, { force: true });
    throw new ApiError(400, 'This file is not a valid PDF.');
  }
  const doc = await DocumentModel.create({
    user: req.user._id,
    title: path.parse(req.file.originalname).name.slice(0, 120) || 'Untitled',
    originalName: req.file.originalname.slice(0, 255),
    filePath: req.file.path,
    size: req.file.size,
  });
  logActivity(req.user._id, 'upload', `Uploaded ${doc.title}`, doc._id);
  processDocument(doc._id).catch((e) => console.error('[process] unhandled:', e.message));
  const { filePath, ...safe } = doc.toObject();
  ok(res, safe, null, 201);
});

export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);
  const filter = { user: req.user._id };
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.q) filter.title = new RegExp(escapeRegex(String(req.query.q).slice(0, 80)), 'i');
  const [items, total] = await Promise.all([
    DocumentModel.find(filter).sort(SORTS[req.query.sort] || SORTS['-createdAt']).skip(skip).limit(limit),
    DocumentModel.countDocuments(filter),
  ]);
  ok(res, items, { page, limit, total, pages: Math.ceil(total / limit) });
});

export const getOne = asyncHandler(async (req, res) => ok(res, await findOwned(DocumentModel, req.params.id, req.user._id)));

export const file = asyncHandler(async (req, res) => {
  const doc = await findOwned(DocumentModel, req.params.id, req.user._id, '+filePath');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline');
  res.sendFile(path.resolve(doc.filePath), (err) => err && !res.headersSent && res.status(404).json({ success: false, message: 'File not found' }));
});

export const rename = asyncHandler(async (req, res) => {
  const doc = await findOwned(DocumentModel, req.params.id, req.user._id);
  doc.title = req.body.title;
  await doc.save();
  ok(res, doc);
});

export const remove = asyncHandler(async (req, res) => {
  const doc = await findOwned(DocumentModel, req.params.id, req.user._id, '+filePath');
  await deleteDocumentData(doc, req.user._id);
  ok(res, { deleted: true });
});
