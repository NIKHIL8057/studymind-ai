import { Router } from 'express';
import * as c from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, signupSchema } from '../validators/index.js';

const r = Router();
r.post('/signup', authLimiter, validate(signupSchema), c.signup);
r.post('/login', authLimiter, validate(loginSchema), c.login);
r.post('/logout', c.logout);
r.get('/me', requireAuth, c.me);
export default r;
