import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/http.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.token;
  if (!token) throw new ApiError(401, 'Please sign in to continue.');
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'Please sign in to continue.');
  req.user = user;
  next();
});

/** Blocks cross-site form posts: browsers cannot send this custom header cross-origin without a CORS preflight. */
export function csrfGuard(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('x-requested-with') !== 'XMLHttpRequest') return next(new ApiError(403, 'Blocked request.'));
  next();
}
