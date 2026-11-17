import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApp, ensureSupabaseSeeded } from './src/server/app.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = createApp();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  try {
    await ensureSupabaseSeeded();
  } catch (err: unknown) {
    console.warn(
      'Supabase startup check:',
      err instanceof Error ? err.message : String(err)
    );
  }
  app.listen(port, '0.0.0.0', () => {
    console.log(`MomCare AI server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start MomCare AI server:', err);
  process.exit(1);
});
