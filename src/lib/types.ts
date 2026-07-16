export type Category = 'ish' | 'shaxsiy' | 'oila' | 'boshqa';
export type ThemeMode = 'light' | 'dark' | 'auto';
export type Language = 'uz' | 'uz-cyrl' | 'tr' | 'en';
export type WeekStart = 'mon' | 'sun';

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
  lang: Language;
  weekStart: WeekStart;
  notifications: NotificationSettings;
}

export interface AppState {
  schemaVersion: 1;
  settings: AppSettings;
  tasks: Task[];
  checklists: Checklist[];
}
