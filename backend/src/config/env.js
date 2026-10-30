import 'dotenv/config';

const num = (v, d) => (v !== undefined && v !== '' && Number.isFinite(+v) ? +v : d);
const isProd = process.env.NODE_ENV === 'production';

export const env = {
  isProd,
  port: num(process.env.PORT, 5000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  cookieSameSite: process.env.COOKIE_SAMESITE || (isProd ? 'none' : 'lax'),
  geminiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  embedModel: process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001',
  maxFileMb: num(process.env.MAX_FILE_MB, 20),
  dailyAiLimit: num(process.env.DAILY_AI_LIMIT, 100),
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
};

export function assertEnv() {
  const missing = ['MONGODB_URI', 'JWT_SECRET', 'GEMINI_API_KEY'].filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters.');
}
