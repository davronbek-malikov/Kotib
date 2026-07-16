import type { Task } from './types';

export interface DaySummary {
  total: number;
  done: number;
  /** Tasks with a clock time — shown as "uchrashuv" in the summary line. */
  timed: number;
  /** 0–1, drives the Today card's progress ring. */
  ratio: number;
}

export function daySummary(tasks: Task[]): DaySummary {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const timed = tasks.filter((t) => t.time).length;
  return { total, done, timed, ratio: total === 0 ? 0 : done / total };
}
