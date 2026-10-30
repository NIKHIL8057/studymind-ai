import { Router } from 'express';
import * as c from '../controllers/chatController.js';
import { aiLimiter, aiQuota } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { chatSchema } from '../validators/index.js';

const r = Router();
r.get('/conversations', c.listConversations);
r.get('/conversations/:id/messages', c.getMessages);
r.delete('/conversations/:id', c.deleteConversation);
r.post('/:docId/messages', aiLimiter, aiQuota, validate(chatSchema), c.sendMessage);
export default r;
