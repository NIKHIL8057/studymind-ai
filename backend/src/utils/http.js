import mongoose from 'mongoose';
import { ApiError } from './ApiError.js';

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const ok = (res, data, meta, status = 200) =>
  res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });

export function parsePaging(q) {
  const page = Math.max(1, parseInt(q.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(q.limit) || 12));
  return { page, limit, skip: (page - 1) * limit };
}

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Ownership check used by every resource: returns the doc only if it belongs to the user. */
export async function findOwned(Model, id, userId, select) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, 'Not found');
  const doc = await Model.findOne({ _id: id, user: userId }).select(select || '');
  if (!doc) throw new ApiError(404, 'Not found');
  return doc;
}
