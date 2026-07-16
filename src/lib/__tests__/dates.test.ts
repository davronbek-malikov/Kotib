import { describe, expect, it } from 'vitest';
import { setLang } from '../i18n';
import {
  formatLongDate,
  monthGrid,
  monthName,
  startOfWeek,
  toISODate,
  weekDays,
  weekdayShort,
} from '../dates';

describe('toISODate', () => {
  it('formats local dates without UTC drift', () => {
    expect(toISODate(new Date(2026, 6, 16))).toBe('2026-07-16');
    expect(toISODate(new Date(2026, 0, 1))).toBe('2026-01-01');
  });
});

describe('startOfWeek', () => {
  it('is Monday-first by default', () => {
    // 2026-07-16 is a Thursday.
    expect(toISODate(startOfWeek(new Date(2026, 6, 16), 'mon'))).toBe('2026-07-13');
  });

  it('supports Sunday-first', () => {
    expect(toISODate(startOfWeek(new Date(2026, 6, 16), 'sun'))).toBe('2026-07-12');
  });

  it('handles a Sunday correctly when Monday-first', () => {
    expect(toISODate(startOfWeek(new Date(2026, 6, 19), 'mon'))).toBe('2026-07-13');
  });
});

describe('weekDays', () => {
  it('returns 7 consecutive days for the week strip', () => {
    const days = weekDays(new Date(2026, 6, 16), 'mon').map(toISODate);
    expect(days).toEqual([
      '2026-07-13', '2026-07-14', '2026-07-15', '2026-07-16',
      '2026-07-17', '2026-07-18', '2026-07-19',
    ]);
  });
});

describe('monthGrid', () => {
  it('pads leading blanks so the 1st lands on its weekday', () => {
    // July 2026 starts on a Wednesday -> 2 blanks when Monday-first.
    const grid = monthGrid(2026, 6, 'mon');
    expect(grid[0]).toBeNull();
    expect(grid[1]).toBeNull();
    expect(grid[2]).toBe('2026-07-01');
  });

  it('covers every day of the month', () => {
    const grid = monthGrid(2026, 6, 'mon');
    expect(grid.filter(Boolean)).toHaveLength(31);
    expect(grid[grid.length - 1]).toBe('2026-07-31');
  });

  it('handles a leap February', () => {
    expect(monthGrid(2024, 1, 'mon').filter(Boolean)).toHaveLength(29);
  });
});

describe('Uzbek names', () => {
  it('uses Uzbek month names, not Intl defaults', () => {
    setLang('uz');
    expect(monthName(6)).toBe('iyul');
    expect(monthName(0)).toBe('yanvar');
  });

  it('formats the Today card date (plan.md §3.1)', () => {
    setLang('uz');
    expect(formatLongDate('2026-07-16')).toBe('Payshanba, 16-iyul');
  });

  it('transliterates names for the Cyrillic locale', () => {
    setLang('uz-cyrl');
    expect(monthName(6)).toBe('июл');
  });

  it('switches names with the locale', () => {
    setLang('en');
    expect(formatLongDate('2026-07-16')).toBe('Thursday, 16 July');
    setLang('uz');
  });

  it('returns Monday-first weekday abbreviations', () => {
    setLang('uz');
    expect(weekdayShort(0)).toBe('Du');
    expect(weekdayShort(6)).toBe('Ya');
  });
});
