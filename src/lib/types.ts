export type Category = 'ish' | 'shaxsiy' | 'oila' | 'boshqa';
export type ThemeMode = 'light' | 'dark' | 'auto';
export type Language = 'uz' | 'uz-cyrl' | 'tr' | 'en';
export type WeekStart = 'mon' | 'sun';

/**
 * Visual identity. 'klassik' is the original calm green set (plan.md §2.2);
 * 'registon' takes its palette from Uzbek tilework — cobalt, turquoise,
 * pomegranate, saffron — and uses colour as information: every category and
 * priority owns one, so a day is readable at a glance.
 */
export type Skin = 'klassik' | 'registon';

/**
 * 'simple' keeps one flat list. 'advanced' groups the day by priority for
 * people who triage rather than just list.
 */
export type TaskMode = 'simple' | 'advanced';

export type Priority = 'shoshilinch' | 'muhim' | 'rivojlanish' | 'kam';

/**
 * A task's planning horizon. 'day' is an ordinary dated task; the others are
 * goals for a whole week, month or year. A period plan stores its period's
 * anchor date (Monday of the week, the 1st of the month, Jan 1 of the year).
 */
export type TaskScope = 'day' | 'week' | 'month' | 'year';

/** The period scopes shown beside the calendar, each toggleable in Settings. */
export const PERIOD_SCOPES = ['week', 'month', 'year'] as const;
export type PeriodScope = (typeof PERIOD_SCOPES)[number];

/**
 * How a completed task reads. 'marker' mimics striking a line through with a
 * highlighter, which is what people actually do on paper.
 */
export type DoneStyle = 'chiziq' | 'marker' | 'xira';

/**
 * 'qolyozma' is a handwriting face — for tablet and stylus users who want the
 * page to feel written rather than typed. Manrope stays the default and keeps
 * Kotib and Hamyon one family (plan.md §2.2).
 */
export type FontChoice = 'manrope' | 'qolyozma';

/** Fixed display order, most urgent first. */
export const PRIORITIES: Priority[] = [
  'shoshilinch', 'muhim', 'rivojlanish', 'kam',
];

/** Minutes before the task time. 0 = at the time itself. */
export type ReminderOffset = 0 | 5 | 30 | 60 | 1440;

export interface Task {
  id: string;
  title: string;
  /** ISO yyyy-mm-dd */
  date: string;
  /** "HH:mm" — absent means an untimed task ("Vaqtsiz"). */
  time?: string;
  category: Category;
  /** Absent means 'day' — an ordinary dated task. See TaskScope. */
  scope?: TaskScope;
  /** Only surfaced in 'advanced' task mode; defaults to 'muhim'. */
  priority?: Priority;
  done: boolean;
  reminderOffsetMin?: ReminderOffset;
  checklistId?: string;
  /** Original date, set when rollOverdue moves an unfinished task to today. */
  rolledFrom?: string;
  /** epoch ms */
  createdAt: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  order: number;
}

export interface Checklist {
  id: string;
  name: string;
  icon?: string;
  items: ChecklistItem[];
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  voice: boolean;
  /** "HH:mm" — the daily digest (plan.md §3.3). */
  digestTime: string;
}

export interface AppSettings {
  theme: ThemeMode;
  skin: Skin;
  taskMode: TaskMode;
  doneStyle: DoneStyle;
  font: FontChoice;
  /** Which period-plan tabs are shown. All off = daily-only, calendar as before. */
  planScopes: Record<PeriodScope, boolean>;
  lang: Language;
  weekStart: WeekStart;
  notifications: NotificationSettings;
  /** Id of the last broadcast this device has shown; see lib/announcement. */
  seenAnnouncement?: string;
}

export interface AppState {
  schemaVersion: 1;
  settings: AppSettings;
  tasks: Task[];
  checklists: Checklist[];
}
