import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok } from '../utils/http.js';

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProd || env.cookieSameSite === 'none',
  sameSite: env.cookieSameSite,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
});

const issue = (res, user) =>
  res.cookie('token', jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: '7d' }), cookieOptions());

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists.');
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
  issue(res, user);
  ok(res, user, null, 201);
});

const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO5X1R0c0oJ0wQK1m0oH4vYhQy0zV7pJe';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  // Always run a hash comparison so response time does not reveal whether the email exists.
  const valid = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
  if (!user || !valid) throw new ApiError(401, 'Incorrect email or password.');
  issue(res, user);
  ok(res, user);
});

export const logout = (_req, res) => {
  res.clearCookie('token', { ...cookieOptions(), maxAge: undefined });
  ok(res, { loggedOut: true });
};

export const me = (req, res) => ok(res, req.user);
