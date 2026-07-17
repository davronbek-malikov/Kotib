import { defineConfig } from 'vitest/config';
import { loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json' with { type: 'json' };
import { handleAi, type AiRequestBody } from './src/server/aiHandler';

/**
 * Serves /api/ai during `npm run dev` with the key from .env (gitignored),
 * mirroring the Vercel function in api/ai.ts. Same pattern as Hamyon.
 */
function aiDevBridge(env: Record<string, string>): Plugin {
  return {
    name: 'kotib-ai-dev-bridge',
    configureServer(server) {
      server.middlewares.use('/api/ai', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'method not allowed' }));
          return;
        }
        let raw = '';
        req.on('data', (chunk) => (raw += chunk));
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');
          try {
            const body = JSON.parse(raw) as AiRequestBody;
            const result = await handleAi(body, { GROQ_API_KEY: env.GROQ_API_KEY });
            res.statusCode = 200;
            res.end(JSON.stringify(result));
          } catch {
            res.statusCode = 503;
            res.end(JSON.stringify({ error: 'ai unavailable' }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), aiDevBridge(env)],
    define: {
      // Surfaced in Settings → Haqida so an auto-update is visible to the eye.
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    test: {
      globals: true,
      environment: 'jsdom',
    },
  };
});
