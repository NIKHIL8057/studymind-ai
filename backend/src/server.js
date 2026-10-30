import app from './app.js';
import { connectDB } from './config/db.js';
import { assertEnv, env } from './config/env.js';

async function main() {
  assertEnv();
  await connectDB();
  app.listen(env.port, () => console.log(`StudyMind API listening on http://localhost:${env.port}`));
}

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running successfully"
  });
});

main().catch((e) => {
  console.error('Startup failed:', e.message);
  process.exit(1);
});

process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e?.message || e));
