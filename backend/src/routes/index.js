import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import analytics from './analyticsRoutes.js';
import auth from './authRoutes.js';
import chat from './chatRoutes.js';
import documents from './documentRoutes.js';
import flashcards from './flashcardRoutes.js';
import notes from './noteRoutes.js';
import quizzes from './quizRoutes.js';
import users from './userRoutes.js';

const r = Router();
r.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
r.use('/auth', auth);
// Everything below requires a signed-in user.
r.use(requireAuth);
r.use('/users', users);
r.use('/documents', documents);
r.use('/chat', chat);
r.use('/notes', notes);
r.use('/quizzes', quizzes);
r.use('/flashcards', flashcards);
r.use('/analytics', analytics);
export default r;
