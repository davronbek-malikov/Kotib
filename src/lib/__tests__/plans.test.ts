import { describe, expect, it } from 'vitest';
import {
  addTask, createInitialState, plansForPeriod, rollOverdue,
  setPlanScope, tasksForDate, toggleTask,
} from '../store';
import { monthAnchor, weekAnchor, yearAnchor } from '../dates';
import { buildContext } from '../ai/context';

describe('period plans', () => {
  it('defaults new users to all period scopes on', () => {
    const s = createInitialState();
    expect(s.settings.planScopes).toEqual({ week: true, month: true, year: true });
  });

  it('stores a plan under its period anchor and reads it back', () => {
    const anchor = monthAnchor('2026-07-17');
    let s = addTask(createInitialState(), {
      title: 'Loyihani tugatish', date: anchor, category: 'ish', scope: 'month',
    });
    const plans = plansForPeriod(s, 'month', anchor);
    expect(plans).toHaveLength(1);
    expect(plans[0].title).toBe('Loyihani tugatish');
  });

  it('strips time and reminder from a period plan — it is a goal, not an event', () => {
    let s = addTask(createInitialState(), {
      title: 'Sport', date: weekAnchor('2026-07-17', 'mon'), category: 'shaxsiy',
      scope: 'week', time: '09:00', reminderOffsetMin: 30,
    });
    expect(s.tasks[0].time).toBeUndefined();
    expect(s.tasks[0].reminderOffsetMin).toBeUndefined();
  });

  it('never leaks a period plan into the day it is anchored to', () => {
    // A month plan anchored to 2026-07-01 must not appear on July 1st's list.
    let s = addTask(createInitialState(), {
      title: 'Oylik maqsad', date: '2026-07-01', category: 'ish', scope: 'month',
    });
    s = addTask(s, { title: 'Kunlik ish', date: '2026-07-01', category: 'ish' });

    const day = tasksForDate(s, '2026-07-01');
    expect(day.map((t) => t.title)).toEqual(['Kunlik ish']);
  });

  it('never rolls a period plan onto today the way an overdue day task rolls', () => {
    let s = addTask(createInitialState(), {
      title: 'Yillik maqsad', date: yearAnchor('2020-01-01'), category: 'ish', scope: 'year',
    });
    s = rollOverdue(s, '2026-07-17');
    // The plan keeps its year anchor; it did not jump to today.
    expect(s.tasks[0].date).toBe('2020-01-01');
  });

  it('sorts undone plans before done ones', () => {
    const a = monthAnchor('2026-07-17');
    let s = createInitialState();
    s = addTask(s, { title: 'Bajarilgan', date: a, category: 'ish', scope: 'month' });
    s = toggleTask(s, s.tasks[0].id);
    s = addTask(s, { title: 'Ochiq', date: a, category: 'ish', scope: 'month' });
    expect(plansForPeriod(s, 'month', a).map((p) => p.title)).toEqual(['Ochiq', 'Bajarilgan']);
  });

  it('lets a user turn a scope off', () => {
    const s = setPlanScope(createInitialState(), 'year', false);
    expect(s.settings.planScopes.year).toBe(false);
    expect(s.settings.planScopes.week).toBe(true);
  });
});

describe('AI context with plans', () => {
  it('lists period plans separately from day tasks', () => {
    const now = new Date(2026, 6, 17);
    let s = createInitialState();
    s = addTask(s, { title: 'Bugungi ish', date: '2026-07-17', category: 'ish' });
    s = addTask(s, {
      title: 'Oylik maqsad', date: monthAnchor('2026-07-17'), category: 'ish', scope: 'month',
    });

    const ctx = buildContext(s, now);
    expect((ctx.vazifalar as { nomi: string }[]).map((t) => t.nomi)).toEqual(['Bugungi ish']);
    expect((ctx.rejalar as { nomi: string; muddat: string }[])[0]).toMatchObject({
      nomi: 'Oylik maqsad', muddat: 'month',
    });
  });
});
