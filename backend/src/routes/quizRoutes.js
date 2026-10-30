import { Router } from 'express';
import * as c from '../controllers/quizController.js';
import { aiLimiter, aiQuota } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { attemptSchema, quizGenerateSchema } from '../validators/index.js';

const r = Router();
r.post('/generate', aiLimiter, aiQuota, validate(quizGenerateSchema), c.generate);
r.get('/', c.list);
r.get('/attempts/:attemptId', c.getAttempt);
r.get('/:id', c.getOne);
r.get('/:id/attempts', c.attempts);
r.post('/:id/attempts', validate(attemptSchema), c.submit);
r.delete('/:id', c.remove);
export default r;
