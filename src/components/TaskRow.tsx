import { useRef, useState } from 'react';
import { Icon } from '../icons/Icon';
import { t } from '../lib/i18n';
import type { Task } from '../lib/types';

/** Drag distance that commits the action (plan.md §3.1). */
const THRESHOLD = 72;
/** Movement before we treat a pointer down as a drag rather than a tap. */
const SLOP = 8;

interface Props {
  task: Task;
  /** Registon reads a day by colour, so it shows the category stripe. */
  showCategory?: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export function TaskRow({ task, showCategory = false, onToggle, onDelete }: Props) {
  const [dx, setDx] = useState(0);
  const startX = useRef(0);
  const pressed = useRef(false);
  const dragging = useRef(false);

  function down(e: React.PointerEvent) {
    // Never hijack a press that starts on a control — capturing the pointer
    // steals the click and the button would stop working (this is what broke
    // completing a task with a mouse).
    if ((e.target as HTMLElement).closest('button')) return;
    pressed.current = true;
    startX.current = e.clientX;
  }

  function move(e: React.PointerEvent) {
    if (!pressed.current) return;
    const delta = e.clientX - startX.current;

    // Only claim the pointer once this is unambiguously a horizontal drag, so
    // taps and vertical scrolls are left alone.
    if (!dragging.current) {
      if (Math.abs(delta) < SLOP) return;
      dragging.current = true;
      // Not implemented in every environment (jsdom, older WebViews).
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    setDx(delta);
  }

  function up() {
    const wasDragging = dragging.current;
    pressed.current = false;
    dragging.current = false;
    if (!wasDragging) return;
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
          <Icon name="check" size={16} />
        </button>

        {showCategory && (
          <span
            className="taskrow__cat"
            style={{ background: `var(--cat-${task.category})` }}
            aria-hidden="true"
          />
        )}

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
