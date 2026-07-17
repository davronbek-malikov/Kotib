import type { AppState } from '../types';
import { getLang } from '../i18n';
import { buildContext } from './context';

export interface ChatTurn {
  role: 'user' | 'bot';
  text: string;
}

/**
 * In the Android shell the page is served from the Vercel origin, so a relative
 * /api/ai resolves correctly there too — no base URL needed.
 */
const ENDPOINT = '/api/ai';

export class AiUnavailable extends Error {}

/**
 * Ask the assistant. Throws AiUnavailable on any failure (offline, no key,
 * provider down) so the UI can say something useful instead of showing a stack.
 */
export async function ask(
  question: string,
  state: AppState,
  history: ChatTurn[] = [],
  now: Date = new Date(),
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        lang: getLang(),
        context: buildContext(state, now),
        history,
      }),
    });
  } catch {
    // Offline, or the shell has no connectivity.
    throw new AiUnavailable('network');
  }

  if (!res.ok) throw new AiUnavailable(`http ${res.status}`);

  const data = (await res.json()) as { answer?: string };
  if (!data.answer) throw new AiUnavailable('empty');
  return data.answer;
}
