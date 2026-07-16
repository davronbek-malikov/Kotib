import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskRow } from '../components/TaskRow';
import { setLang } from '../lib/i18n';
import type { Task } from '../lib/types';

function task(over: Partial<Task> = {}): Task {
  return {
    id: 't1', title: 'Koding', date: '2026-07-16',
    category: 'ish', done: false, createdAt: 0, ...over,
  };
}

setLang('uz');

describe('TaskRow completion', () => {
  it('toggles when the check button is clicked with a mouse', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<TaskRow task={task()} onToggle={onToggle} onDelete={vi.fn()} />);

    await user.click(screen.getByLabelText('Bajarildi'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('marks the row done so the strikethrough style applies', () => {
    const { container } = render(
      <TaskRow task={task({ done: true })} onToggle={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(container.querySelector('.taskrow')?.className).toContain('is-done');
  });

  it('does not fire toggle or delete on a plain click (no drag)', async () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <TaskRow task={task()} onToggle={onToggle} onDelete={onDelete} />,
    );

    // Clicking the row body itself must not complete or delete anything.
    const swipe = container.querySelector('.taskrow__swipe') as HTMLElement;
    await user.click(swipe);
    expect(onToggle).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });
});
