import { Router } from 'express';
import * as c from '../controllers/flashcardController.js';
import { aiLimiter, aiQuota } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { flashGenerateSchema, reviewSchema } from '../validators/index.js';

const r = Router();
r.post('/generate', aiLimiter, aiQuota, validate(flashGenerateSchema), c.generate);
r.get('/', c.listDecks);
r.patch('/cards/:cardId/review', validate(reviewSchema), c.review);
r.get('/:id', c.getDeck);
r.delete('/:id', c.removeDeck);
export default r;
