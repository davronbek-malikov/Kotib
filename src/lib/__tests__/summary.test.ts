import { describe, expect, it } from 'vitest';
import { daySummary } from '../summary';
import type { Task } from '../types';

function task(over: Partial<Task> = {}): Task {
  return {
    id: 'x', title: 'A', date: '2026-07-16', category: 'ish',
    done: false, createdAt: 0, ...over,
  };
}

describe('daySummary', () => {
  it('counts an empty day as zero, not NaN', () => {
    expect(daySummary([])).toEqual({ total: 0, done: 0, timed: 0, ratio: 0 });
  });

  it('counts totals, completions and timed items', () => {
    const s = daySummary([
      task({ id: '1', time: '09:00' }),
      task({ id: '2', time: '10:00', done: true }),
      task({ id: '3' }),
    ]);
    expect(s).toEqual({ total: 3, done: 1, timed: 2, ratio: 1 / 3 });
  });

  it('reports a fully done day as ratio 1', () => {
    expect(daySummary([task({ done: true })]).ratio).toBe(1);
  });
});
