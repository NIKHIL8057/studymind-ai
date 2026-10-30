import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/http.js';

const json = (message) => (_req, res) => res.status(429).json({ success: false, message });

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json('Too many attempts. Please wait a few minutes and try again.'),
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json('Too many requests. Please slow down.'),
});

// Per-user burst limit for expensive AI endpoints (must run after requireAuth).
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user._id),
  handler: json('You are sending AI requests too quickly. Try again in a minute.'),
});

// Daily per-user quota.
export const aiQuota = asyncHandler(async (req, _res, next) => {
  const today = new Date().toISOString().slice(0, 10);
  const u = await User.findById(req.user._id).select('aiUsage');
  const used = u.aiUsage?.date === today ? u.aiUsage.count : 0;
  if (used >= env.dailyAiLimit) throw new ApiError(429, `Daily AI limit reached (${env.dailyAiLimit}). It resets tomorrow.`);
  await User.updateOne(
    { _id: u._id },
    u.aiUsage?.date === today ? { $inc: { 'aiUsage.count': 1 } } : { $set: { aiUsage: { date: today, count: 1 } } }
  );
  next();
});
