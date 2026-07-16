import { useState } from 'react';
import { ProgressRing } from './ProgressRing';
import { QuickAdd } from './QuickAdd';
import { TaskRow } from './TaskRow';
import { Toast } from './Toast';
import { WeekStrip } from './WeekStrip';
import { Icon } from '../icons/Icon';
import { formatLongDate, todayISO } from '../lib/dates';
import { t } from '../lib/i18n';
import { daySummary } from '../lib/summary';
import {
  addTask, removeTask, restoreTask, tasksForDate, toggleTask,
} from '../lib/store';
import type { AppState, Task } from '../lib/types';

interface Props {
  state: AppState;
  setState: (s: AppState) => void;
}

export function Today({ state, setState }: Props) {
  const [selected, setSelected] = useState(todayISO());
  const [adding, setAdding] = useState(false);
  const [undo, setUndo] = useState<Task | null>(null);

  const tasks = tasksForDate(state, selected);
  const summary = daySummary(tasks);
  const timed = tasks.filter((task) => task.time);
  const untimed = tasks.filter((task) => !task.time);

  function remove(task: Task) {
    setState(removeTask(state, task.id));
    setUndo(task);
  }

  function renderRow(task: Task) {
    return (
      <TaskRow
        key={task.id}
        task={task}
        onToggle={() => setState(toggleTask(state, task.id))}
        onDelete={() => remove(task)}
      />
    );
  }

  return (
    <section className="screen">
      {/* The signature element — the only generous use of accent (plan.md §2.1). */}
      <div className="todaycard">
        <div>
          <h1 className="todaycard__date">{formatLongDate(selected)}</h1>
          <p className="todaycard__summary">
            {summary.total} {t('today.summary.tasks')}
            {summary.timed > 0 && ` · ${summary.timed} ${t('today.summary.meeting')}`}
          </p>
        </div>
        <ProgressRing ratio={summary.ratio} />
      </div>

      <WeekStrip
        selected={selected}
        weekStart={state.settings.weekStart}
        state={state}
        onSelect={setSelected}
      />

      {tasks.length === 0 ? (
        // An invitation, not a void (plan.md §3.1).
        <p className="empty">{t('today.empty')}</p>
      ) : (
        <>
          <ul className="tasklist">{timed.map(renderRow)}</ul>
          {untimed.length > 0 && (
            <>
              <h2 className="section-label">{t('today.untimed')}</h2>
              <ul className="tasklist">{untimed.map(renderRow)}</ul>
            </>
          )}
        </>
      )}

      <button className="fab" onClick={() => setAdding(true)} aria-label={t('add.title')}>
        <Icon name="plus" size={26} />
      </button>

      {adding && (
        <QuickAdd
          date={selected}
          onSave={(task) => setState(addTask(state, task))}
          onClose={() => setAdding(false)}
        />
      )}

      {undo && (
        <Toast
          message={t('today.deleted')}
          actionLabel={t('today.undo')}
          onAction={() => {
            setState(restoreTask(state, undo));
            setUndo(null);
          }}
          onDismiss={() => setUndo(null)}
        />
      )}
    </section>
  );
}
