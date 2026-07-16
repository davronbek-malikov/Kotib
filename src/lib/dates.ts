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
