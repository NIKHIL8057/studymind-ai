import { Router } from 'express';
import * as c from '../controllers/noteController.js';
import { aiLimiter, aiQuota } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { noteUpdateSchema, notesGenerateSchema } from '../validators/index.js';

const r = Router();
r.post('/generate', aiLimiter, aiQuota, validate(notesGenerateSchema), c.generate);
r.get('/', c.list);
r.get('/:id', c.getOne);
r.patch('/:id', validate(noteUpdateSchema), c.update);
r.delete('/:id', c.remove);
export default r;
