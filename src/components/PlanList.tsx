import { useState } from 'react';
import { Icon } from '../icons/Icon';
import { t } from '../lib/i18n';
import { addTask, plansForPeriod, removeTask, toggleTask } from '../lib/store';
import type { AppState, PeriodScope } from '../lib/types';

interface Props {
  scope: PeriodScope;
  /** Current period's anchor date, and how to move it. */
  anchor: string;
  label: string;
  onShift: (by: number) => void;
  state: AppState;
  setState: (s: AppState) => void;
  onComplete: (title: string) => void;
}

/**
 * Plans for one period — a week, month or year. Deliberately simpler than a
 * day task: no time, no reminder, no swipe. A goal you tick off, not an event.
 */
export function PlanList({
  scope, anchor, label, onShift, state, setState, onComplete,
}: Props) {
  const [draft, setDraft] = useState('');
  const plans = plansForPeriod(state, scope, anchor);
  const done = plans.filter((p) => p.done).length;

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setState(addTask(state, {
      title: draft, date: anchor, category: 'shaxsiy', scope,
    }));
    setDraft('');
  }

  return (
    <section className="plans">
      <header className="plans__head">
        <button className="linkbtn" onClick={() => onShift(-1)} aria-label="‹">‹</button>
        <div className="plans__label">
          <span className="plans__period">{label}</span>
          {plans.length > 0 && (
            <span className="plans__count">{done}/{plans.length}</span>
          )}
        </div>
        <button className="linkbtn" onClick={() => onShift(1)} aria-label="›">›</button>
      </header>

      {plans.length === 0 ? (
        <p className="empty plans__empty">{t(`plan.empty.${scope}`)}</p>
      ) : (
        <ul className="tasklist">
          {plans.map((plan) => (
            <li key={plan.id} className={`taskrow${plan.done ? ' is-done' : ''}`}>
              <button
                className="taskrow__check"
                onClick={() => {
                  if (!plan.done) onComplete(plan.title);
                  setState(toggleTask(state, plan.id));
                }}
                aria-label={t('today.done')}
                aria-pressed={plan.done}
              >
                <Icon name="check" size={16} />
              </button>
              <span className="taskrow__body">
                <span className="taskrow__title">{plan.title}</span>
              </span>
              <button
                className="taskrow__delete"
                onClick={() => setState(removeTask(state, plan.id))}
                aria-label={t('common.delete')}
              >
                <Icon name="trash" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="listadd plans__add" onSubmit={add}>
        <input
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t(`plan.add.${scope}`)}
          aria-label={t(`plan.add.${scope}`)}
        />
        <button
          className="btn btn--primary"
          type="submit"
          disabled={!draft.trim()}
          aria-label={t('add.save')}
        >
          <Icon name="plus" size={20} />
        </button>
      </form>
    </section>
  );
}
