import { handleAi, type AiRequestBody } from '../src/server/aiHandler.js';

/**
 * Vercel serverless function. Deployed with the web build, so the assistant
 * reaches installed phones the same way everything else does — no new APK.
 *
 * The Groq key is read from the environment here and never sent to the client.
 */

interface VercelRequest {
  method?: string;
  body?: unknown;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: unknown) => void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  try {
    const body = (typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body) as AiRequestBody;

    if (!body?.question?.trim()) {
      res.status(400).json({ error: 'invalid body' });
      return;
    }

    const result = await handleAi(body, { GROQ_API_KEY: process.env.GROQ_API_KEY });
    res.status(200).json(result);
  } catch {
    // Deliberately opaque: never leak provider errors or key state.
    res.status(503).json({ error: 'ai unavailable' });
  }
}
