import { useState } from 'react';
import { Icon } from '../icons/Icon';
import { t } from '../lib/i18n';
import {
  addChecklist, addChecklistItem, removeChecklist, removeChecklistItem,
  reorderChecklistItem, resetChecklist, toggleChecklistItem,
} from '../lib/store';
import type { AppState } from '../lib/types';

interface Props {
  state: AppState;
  setState: (s: AppState) => void;
}

/**
 * Reorder uses up/down controls rather than drag: accessible, works on touch
 * with no gesture library, and satisfies plan.md §3.2's reorder requirement.
 */
export function Checklists({ state, setState }: Props) {
  const [newList, setNewList] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <section className="screen">
      <h1 className="screen__title">{t('lists.title')}</h1>

      <form
        className="listadd"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newList.trim()) return;
          setState(addChecklist(state, newList));
          setNewList('');
        }}
      >
        <input
          className="input"
          value={newList}
          onChange={(e) => setNewList(e.target.value)}
          placeholder={t('lists.new')}
          aria-label={t('lists.new')}
        />
        <button className="btn btn--primary" type="submit" disabled={!newList.trim()}>
          <Icon name="plus" size={20} />
        </button>
      </form>

      {state.checklists.length === 0 && <p className="empty">{t('lists.empty')}</p>}

      {state.checklists.map((list) => {
        const items = [...list.items].sort((a, b) => a.order - b.order);
        const done = items.filter((i) => i.done).length;
        const ratio = items.length === 0 ? 0 : done / items.length;

        return (
          <article key={list.id} className="card">
            <header className="card__head">
              <h2 className="card__title">
                {list.icon && <span>{list.icon} </span>}
                {list.name}
              </h2>
              <button
                className="linkbtn"
                onClick={() => setState(removeChecklist(state, list.id))}
                aria-label={t('common.delete')}
              >
                <Icon name="trash" size={16} />
              </button>
            </header>

            <div className="progress" aria-hidden="true">
              <div className="progress__fill" style={{ width: `${ratio * 100}%` }} />
            </div>
            <p className="card__meta">
              {done}/{items.length} {t('lists.doneCount')}
            </p>

            <ul className="tasklist">
              {items.map((item, idx) => (
                <li key={item.id} className={`taskrow${item.done ? ' is-done' : ''}`}>
                  <button
                    className="taskrow__check"
                    onClick={() => setState(toggleChecklistItem(state, list.id, item.id))}
                    aria-label={item.text}
                    aria-pressed={item.done}
                  >
                    {item.done && <Icon name="check" size={16} />}
                  </button>
                  <span className="taskrow__body">
                    <span className="taskrow__title">{item.text}</span>
                  </span>
                  <button
                    className="linkbtn" aria-label="↑" disabled={idx === 0}
                    onClick={() =>
                      setState(reorderChecklistItem(state, list.id, item.id, idx - 1))
                    }
                  >↑</button>
                  <button
                    className="linkbtn" aria-label="↓" disabled={idx === items.length - 1}
                    onClick={() =>
                      setState(reorderChecklistItem(state, list.id, item.id, idx + 1))
                    }
                  >↓</button>
                  <button
                    className="linkbtn"
                    onClick={() => setState(removeChecklistItem(state, list.id, item.id))}
                    aria-label={t('common.delete')}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </li>
              ))}
            </ul>

            <form
              className="listadd"
              onSubmit={(e) => {
                e.preventDefault();
                const text = drafts[list.id] ?? '';
                if (!text.trim()) return;
                setState(addChecklistItem(state, list.id, text));
                setDrafts({ ...drafts, [list.id]: '' });
              }}
            >
              <input
                className="input"
                value={drafts[list.id] ?? ''}
                onChange={(e) => setDrafts({ ...drafts, [list.id]: e.target.value })}
                placeholder={t('lists.addItem')}
                aria-label={t('lists.addItem')}
              />
              <button className="btn btn--ghost" type="submit">
                <Icon name="plus" size={20} />
              </button>
            </form>

            {/* The point of a recurring list (plan.md §3.2). */}
            <button
              className="btn btn--ghost"
              onClick={() => setState(resetChecklist(state, list.id))}
            >
              {t('lists.reset')}
            </button>
          </article>
        );
      })}
    </section>
  );
}
