import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { csrfGuard } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/error.js';
import { apiLimiter } from './middleware/rateLimit.js';
import routes from './routes/index.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.clientUrl.split(',').map((s) => s.trim()), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
// 'tiny' logs method, URL, status and timing only: never bodies, cookies or document text.
app.use(morgan(env.isProd ? 'tiny' : 'dev'));
app.use('/api', apiLimiter, csrfGuard, routes);
app.use(notFound);
app.use(errorHandler);

export default app;
