import Note from '../models/Note.js';
import { generateNotes } from '../services/aiService.js';
import { logActivity } from '../services/activityService.js';
import { resolveSource } from '../services/sourceService.js';
import { asyncHandler, escapeRegex, findOwned, ok, parsePaging } from '../utils/http.js';

const LABELS = {
  summary: 'Summary', detailed: 'Detailed notes', chapter: 'Chapter notes', concepts: 'Key concepts',
  definitions: 'Definitions', revision: 'Revision notes', beginner: 'Beginner guide',
};

export const generate = asyncHandler(async (req, res) => {
  const { documentId, ...opts } = req.body;
  const src = await resolveSource(req.user._id, { documentId });
  const content = await generateNotes({ text: src.text, ...opts });
  const note = await Note.create({
    user: req.user._id,
    document: src.document,
    title: `${LABELS[opts.type]}: ${src.title}`.slice(0, 120),
    content,
    type: opts.type,
    options: opts,
  });
  logActivity(req.user._id, 'note', `Generated ${LABELS[opts.type].toLowerCase()}`, note._id);
  ok(res, note, null, 201);
});

export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);
  const filter = { user: req.user._id };
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q).slice(0, 80)), 'i');
    filter.$or = [{ title: rx }, { content: rx }];
  }
  const [items, total] = await Promise.all([
    Note.find(filter).select('-content').sort({ updatedAt: -1 }).skip(skip).limit(limit).populate('document', 'title'),
    Note.countDocuments(filter),
  ]);
  ok(res, items, { page, limit, total, pages: Math.ceil(total / limit) });
});

export const getOne = asyncHandler(async (req, res) => {
  const note = await findOwned(Note, req.params.id, req.user._id);
  ok(res, await note.populate('document', 'title'));
});

export const update = asyncHandler(async (req, res) => {
  const note = await findOwned(Note, req.params.id, req.user._id);
  Object.assign(note, req.body);
  await note.save();
  ok(res, note);
});

export const remove = asyncHandler(async (req, res) => {
  await (await findOwned(Note, req.params.id, req.user._id)).deleteOne();
  ok(res, { deleted: true });
});
