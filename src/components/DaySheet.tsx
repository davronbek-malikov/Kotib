import { useState } from 'react';
import { QuickAdd } from './QuickAdd';
import { Icon } from '../icons/Icon';
import { formatLongDate } from '../lib/dates';
import { t } from '../lib/i18n';
import { addTask, tasksForDate, toggleTask } from '../lib/store';
import type { AppState } from '../lib/types';

interface Props {
  date: string;
  state: AppState;
  setState: (s: AppState) => void;
  onClose: () => void;
}

/** Tapping a day opens its list; "＋" adds straight to that date (plan.md §3.4). */
export function DaySheet({ date, state, setState, onClose }: Props) {
  const [adding, setAdding] = useState(false);
  const tasks = tasksForDate(state, date);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <header className="card__head">
          <h2 className="sheet__title">{formatLongDate(date)}</h2>
          <button className="linkbtn" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </header>

        {tasks.length === 0 ? (
          <p className="empty">{t('today.empty')}</p>
        ) : (
          <ul className="tasklist">
            {tasks.map((task) => (
              <li key={task.id} className={`taskrow${task.done ? ' is-done' : ''}`}>
                <button
                  className="taskrow__check"
                  onClick={() => setState(toggleTask(state, task.id))}
                  aria-label={t('today.done')}
                  aria-pressed={task.done}
                >
                  {task.done && <Icon name="check" size={16} />}
                </button>
                <span className="taskrow__body">
                  <span className="taskrow__title">{task.title}</span>
                </span>
                {task.time && <span className="taskrow__time">{task.time}</span>}
              </li>
            ))}
          </ul>
        )}

        <button className="btn btn--primary" onClick={() => setAdding(true)}>
          {t('add.title')}
        </button>

        {adding && (
          <QuickAdd
            date={date}
            onSave={(task) => setState(addTask(state, task))}
            onClose={() => setAdding(false)}
          />
        )}
      </div>
    </div>
  );
}
