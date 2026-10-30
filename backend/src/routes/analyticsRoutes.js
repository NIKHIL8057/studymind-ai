import { Router } from 'express';
import * as c from '../controllers/analyticsController.js';
import { aiLimiter, aiQuota } from '../middleware/rateLimit.js';

const r = Router();
r.get('/', c.overview);
r.post('/recommendations', aiLimiter, aiQuota, c.recommendations);
export default r;
