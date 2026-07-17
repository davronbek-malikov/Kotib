import { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons/Icon';
import { t } from '../lib/i18n';
import { AiUnavailable, ask, type ChatTurn } from '../lib/ai/client';
import type { AppState } from '../lib/types';

interface Props {
  state: AppState;
  /**
   * Owned by App, not by this component: switching tabs unmounts the screen,
   * and an assistant that forgets the conversation the moment you check your
   * calendar is not an assistant.
   */
  turns: ChatTurn[];
  setTurns: (fn: (cur: ChatTurn[]) => ChatTurn[]) => void;
}

/** Openers that show what the assistant can actually do with real data. */
const SUGGESTIONS = ['chat.s1', 'chat.s2', 'chat.s3'];

export function Chat({ state, turns, setTurns }: Props) {
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Not implemented in every environment (jsdom, some older WebViews) —
    // scrolling is a nicety, never a reason to break the conversation.
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [turns, thinking]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || thinking) return;

    const history = turns;
    setTurns((cur) => [...cur, { role: 'user', text: q }]);
    setDraft('');
    setThinking(true);

    try {
      const answer = await ask(q, state, history);
      setTurns((cur) => [...cur, { role: 'bot', text: answer }]);
    } catch (err) {
      // Say what happened and what to do — never a stack, never a shrug.
      setTurns((cur) => [
        ...cur,
        {
          role: 'bot',
          text: err instanceof AiUnavailable ? t('chat.offline') : t('chat.error'),
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <section className="screen chat">
      {turns.length === 0 ? (
        <div className="chat__intro">
          <span className="chat__avatar"><Icon name="chat" size={22} /></span>
          <h1 className="chat__title">{t('chat.title')}</h1>
          <p className="chat__hint">{t('chat.intro')}</p>
          <div className="chat__suggestions">
            {SUGGESTIONS.map((key) => (
              <button key={key} className="chip" onClick={() => void send(t(key))}>
                {t(key)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="chat__log">
          <button className="chat__clear" onClick={() => setTurns(() => [])}>
            {t('chat.clear')}
          </button>
          {turns.map((turn, i) => (
            <div key={i} className={`bubble bubble--${turn.role}`}>
              {turn.text}
            </div>
          ))}
          {thinking && (
            <div className="bubble bubble--bot bubble--thinking" aria-live="polite">
              <span /><span /><span />
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      <form
        className="chat__composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
      >
        <input
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('chat.placeholder')}
          aria-label={t('chat.title')}
        />
        <button
          className="btn btn--primary chat__send"
          type="submit"
          disabled={!draft.trim() || thinking}
          aria-label={t('chat.send')}
        >
          <Icon name="send" size={20} />
        </button>
      </form>
    </section>
  );
}
