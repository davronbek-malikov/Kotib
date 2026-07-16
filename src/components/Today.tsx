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
  addTask, removeTask, restoreTask, tasksByPriority, tasksForDate, toggleTask,
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
  const advanced = state.settings.taskMode === 'advanced';

  function remove(task: Task) {
    setState(removeTask(state, task.id));
    setUndo(task);
  }

  function renderRow(task: Task) {
    return (
      <TaskRow
        key={task.id}
        task={task}
        showCategory={state.settings.skin === 'registon'}
        onToggle={() => setState(toggleTask(state, task.id))}
        onDelete={() => remove(task)}
      />
    );
  }

  function simpleList() {
    const timed = tasks.filter((task) => task.time);
    const untimed = tasks.filter((task) => !task.time);
    return (
      <>
        <ul className="tasklist">{timed.map(renderRow)}</ul>
        {untimed.length > 0 && (
          <>
            <h2 className="section-label">{t('today.untimed')}</h2>
            <ul className="tasklist">{untimed.map(renderRow)}</ul>
          </>
        )}
      </>
    );
  }

  /** Advanced mode trades the timed/untimed split for triage by priority. */
  function priorityList() {
    return tasksByPriority(state, selected).map(({ priority, tasks: group }) => (
      <section key={priority} className="pri">
        <h2 className={`section-label pri__label pri__label--${priority}`}>
          <span className="pri__dot" />
          {t(`pri.${priority}`)}
          <span className="pri__count">{group.filter((x) => !x.done).length}</span>
        </h2>
        <ul className="tasklist">{group.map(renderRow)}</ul>
      </section>
    ));
  }

  return (
    <section className="screen">
      {/* The signature element — the only generous use of accent (plan.md §2.1). */}
      <div className="todaycard">
        <div className="todaycard__main">
          <div>
            <h1 className="todaycard__date">{formatLongDate(selected)}</h1>
            <p className="todaycard__summary">
              {summary.total} {t('today.summary.tasks')}
              {summary.timed > 0 && ` · ${summary.timed} ${t('today.summary.meeting')}`}
              {summary.total > 0 && ` · ${summary.done}/${summary.total} ${t('today.progress')}`}
            </p>
          </div>
          <ProgressRing ratio={summary.ratio} />
        </div>
        {/* The day's progress, flush along the card's edge: one bar, no label. */}
        <div className="todaycard__meter" aria-hidden="true">
          <div
            className="todaycard__meter-fill"
            style={{ width: `${summary.ratio * 100}%` }}
          />
        </div>
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
      ) : advanced ? (
        priorityList()
      ) : (
        simpleList()
      )}

      <button className="fab" onClick={() => setAdding(true)} aria-label={t('add.title')}>
        <Icon name="plus" size={26} />
      </button>

      {adding && (
        <QuickAdd
          date={selected}
          advanced={advanced}
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
