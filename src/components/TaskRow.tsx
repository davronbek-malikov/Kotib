import { useRef, useState } from 'react';
import { Icon } from '../icons/Icon';
import { t } from '../lib/i18n';
import type { Task } from '../lib/types';

/** Drag distance that commits the action (plan.md §3.1). */
const THRESHOLD = 72;

interface Props {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}

export function TaskRow({ task, onToggle, onDelete }: Props) {
  const [dx, setDx] = useState(0);
  const startX = useRef(0);
  const dragging = useRef(false);

  function down(e: React.PointerEvent) {
    dragging.current = true;
    startX.current = e.clientX;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }

  function move(e: React.PointerEvent) {
    if (!dragging.current) return;
    setDx(e.clientX - startX.current);
  }

  function up() {
    if (!dragging.current) return;
    dragging.current = false;
    // Swipe right = done, swipe left = delete.
    if (dx > THRESHOLD) onToggle();
    else if (dx < -THRESHOLD) onDelete();
    setDx(0);
  }

  return (
    <li className={`taskrow${task.done ? ' is-done' : ''}`}>
      <div
        className="taskrow__swipe"
        style={{ transform: `translateX(${dx}px)` }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        <button
          className="taskrow__check"
          onClick={onToggle}
          aria-label={t('today.done')}
          aria-pressed={task.done}
        >
          {task.done && <Icon name="check" size={16} />}
        </button>

        <div className="taskrow__body">
          <span className="taskrow__title">{task.title}</span>
          {task.rolledFrom && !task.done && (
            <span className="taskrow__badge">{t('today.overdue')}</span>
          )}
        </div>

        {task.time && <span className="taskrow__time">{task.time}</span>}

        {/* Keyboard/screen-reader path — swipe alone is not accessible. */}
        <button
          className="taskrow__delete"
          onClick={onDelete}
          aria-label={t('common.delete')}
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
    </li>
  );
}
