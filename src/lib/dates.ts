import type { WeekStart } from './types';
import { getLang } from './i18n';
import { toCyrillic } from './translit';

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/**
 * plan.md §3.4 requires Uzbek month and weekday names; Intl has no dependable
 * uz-Latn data across browsers, so they are spelled out. Cyrillic is
 * transliterated from these, never listed twice (plan.md §8).
 */
const MONTHS_UZ = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
];
const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Index 0 = Monday, matching the default week start. */
const WEEKDAYS_UZ = [
  'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba',
  'Juma', 'Shanba', 'Yakshanba',
];
const WEEKDAYS_TR = [
  'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe',
  'Cuma', 'Cumartesi', 'Pazar',
];
const WEEKDAYS_EN = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday',
];

const WEEKDAYS_SHORT_UZ = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
const WEEKDAYS_SHORT_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const WEEKDAYS_SHORT_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function monthName(month: number): string {
  const lang = getLang();
  if (lang === 'tr') return MONTHS_TR[month];
  if (lang === 'en') return MONTHS_EN[month];
  const uz = MONTHS_UZ[month];
  return lang === 'uz-cyrl' ? toCyrillic(uz) : uz;
}

/** `dow`: 0 = Monday … 6 = Sunday. */
export function weekdayName(dow: number): string {
  const lang = getLang();
  if (lang === 'tr') return WEEKDAYS_TR[dow];
  if (lang === 'en') return WEEKDAYS_EN[dow];
  const uz = WEEKDAYS_UZ[dow];
  return lang === 'uz-cyrl' ? toCyrillic(uz) : uz;
}

/** `dow`: 0 = Monday … 6 = Sunday. */
export function weekdayShort(dow: number): string {
  const lang = getLang();
  if (lang === 'tr') return WEEKDAYS_SHORT_TR[dow];
  if (lang === 'en') return WEEKDAYS_SHORT_EN[dow];
  const uz = WEEKDAYS_SHORT_UZ[dow];
  return lang === 'uz-cyrl' ? toCyrillic(uz) : uz;
}

/** Monday-indexed day of week: Mon=0 … Sun=6. */
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function startOfWeek(now: Date, weekStart: WeekStart): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const offset = weekStart === 'mon' ? mondayIndex(d) : d.getDay();
  d.setDate(d.getDate() - offset);
  return d;
}

/** The 7 day chips on the Today screen (plan.md §3.4). */
export function weekDays(now: Date, weekStart: WeekStart): Date[] {
  const start = startOfWeek(now, weekStart);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/**
 * A month grid padded with leading nulls so day 1 sits under its weekday.
 * `month` is 0-indexed. Returns ISO strings, or null for blanks.
 */
export function monthGrid(
  year: number,
  month: number,
  weekStart: WeekStart,
): (string | null)[] {
  const first = new Date(year, month, 1);
  const lead = weekStart === 'mon' ? mondayIndex(first) : first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (string | null)[] = Array(lead).fill(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toISODate(new Date(year, month, day)));
  }
  return cells;
}

/** "2026-07-16" -> "Payshanba, 16-iyul" (plan.md §3.1). */
export function formatLongDate(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = weekdayName(mondayIndex(date));
  const lang = getLang();
  if (lang === 'tr' || lang === 'en') return `${weekday}, ${d} ${monthName(m - 1)}`;
  // Uzbek uses the "16-iyul" ordinal-dash form.
  return `${weekday}, ${d}-${monthName(m - 1)}`;
}

/* --- Period plan anchors: the one date that identifies a week / month / year.
   Storing the anchor lets a period plan reuse the same `date` field as a day
   task while never colliding with one (the store filters by scope). --- */

function parseISO(dateISO: string): Date {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function weekAnchor(dateISO: string, weekStart: WeekStart): string {
  return toISODate(startOfWeek(parseISO(dateISO), weekStart));
}

export function monthAnchor(dateISO: string): string {
  return `${dateISO.slice(0, 7)}-01`;
}

export function yearAnchor(dateISO: string): string {
  return `${dateISO.slice(0, 4)}-01-01`;
}

/** Move a period anchor forward/back by whole weeks / months / years. */
export function shiftPeriod(
  anchorISO: string,
  scope: 'week' | 'month' | 'year',
  by: number,
): string {
  const d = parseISO(anchorISO);
  if (scope === 'week') d.setDate(d.getDate() + by * 7);
  else if (scope === 'month') d.setMonth(d.getMonth() + by);
  else d.setFullYear(d.getFullYear() + by);
  return toISODate(d);
}

/** "13–19-iyul" — the week's span, collapsing a shared month. */
export function weekLabel(anchorISO: string): string {
  const start = parseISO(anchorISO);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const sd = start.getDate();
  const ed = end.getDate();
  const lang = getLang();
  const sep = lang === 'tr' || lang === 'en' ? '–' : '–';
  if (start.getMonth() === end.getMonth()) {
    const mon = monthName(start.getMonth());
    return lang === 'uz' || lang === 'uz-cyrl'
      ? `${sd}${sep}${ed}-${mon}`
      : `${sd}${sep}${ed} ${mon}`;
  }
  return `${sd} ${monthName(start.getMonth())} ${sep} ${ed} ${monthName(end.getMonth())}`;
}

/** "Iyul 2026" */
export function monthLabel(anchorISO: string): string {
  const [y, m] = anchorISO.split('-').map(Number);
  const mon = monthName(m - 1);
  return `${mon.charAt(0).toUpperCase()}${mon.slice(1)} ${y}`;
}

/** "2026" */
export function yearLabel(anchorISO: string): string {
  return anchorISO.slice(0, 4);
}
