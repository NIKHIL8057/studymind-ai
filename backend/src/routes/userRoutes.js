import { Router } from 'express';
import * as c from '../controllers/userController.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { deleteAccountSchema, passwordChangeSchema, profileSchema } from '../validators/index.js';

const r = Router();
r.patch('/me', validate(profileSchema), c.updateProfile);
r.patch('/me/password', authLimiter, validate(passwordChangeSchema), c.changePassword);
r.delete('/me', authLimiter, validate(deleteAccountSchema), c.deleteAccount);
export default r;
