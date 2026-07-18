import type {
  AppSettings,
  AppState,
  Category,
  Checklist,
  DoneStyle,
  FontChoice,
  Language,
  NotificationSettings,
  PeriodScope,
  Priority,
  ReminderOffset,
  Skin,
  Task,
  TaskMode,
  TaskScope,
  ThemeMode,
  WeekStart,
} from './types';
import { PRIORITIES } from './types';

const STORAGE_KEY = 'kotib-state-v1';
/** Read by the pre-paint script in index.html before React mounts. */
const THEME_KEY = 'kotib.theme';
const SKIN_KEY = 'kotib.skin';
const FONT_KEY = 'kotib.font';
const LANG_KEY = 'kotib.lang';

export function createInitialState(): AppState {
  return {
    schemaVersion: 1,
    settings: {
      theme: 'light',
      skin: 'klassik',
      taskMode: 'simple',
      doneStyle: 'chiziq',
      font: 'manrope',
      // Period plans are available by default; a daily-only user turns them off.
      planScopes: { week: true, month: true, year: true },
      lang: 'uz',
      weekStart: 'mon',
      notifications: {
        enabled: true,
        sound: true,
        voice: false,
        digestTime: '08:00',
      },
    },
    tasks: [],
    checklists: [],
  };
}

let idCounter = 0;
/** Same id scheme as Hamyon's store. */
function nextId(): string {
  idCounter += 1;
  return `${Date.now().toString(36)}-${idCounter}`;
}

/* --- Persistence --- */

function isAppState(v: unknown): v is AppState {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Partial<AppState>;
  return (
    s.schemaVersion === 1 &&
    Array.isArray(s.tasks) &&
    Array.isArray(s.checklists) &&
    typeof s.settings === 'object' &&
    s.settings !== null
  );
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed: unknown = JSON.parse(raw);
    if (!isAppState(parsed)) return createInitialState();
    const initial = createInitialState();
    // Backfill settings added after a user's last save.
    return {
      ...parsed,
      settings: {
        ...initial.settings,
        ...parsed.settings,
        notifications: {
          ...initial.settings.notifications,
          ...parsed.settings.notifications,
        },
      },
    };
  } catch {
    return createInitialState();
  }
}

export function saveState(s: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    // The pre-paint script can't parse the whole blob, so mirror what it needs.
    localStorage.setItem(THEME_KEY, s.settings.theme);
    localStorage.setItem(SKIN_KEY, s.settings.skin);
    localStorage.setItem(FONT_KEY, s.settings.font);
    localStorage.setItem(LANG_KEY, s.settings.lang);
  } catch {
    /* Quota or private mode — the in-memory state still works this session. */
  }
}

export function exportJSON(s: AppState): string {
  return JSON.stringify(s, null, 2);
}

/** Returns null rather than throwing, so a bad file can never corrupt state. */
export function importJSON(raw: string): AppState | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isAppState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/* --- Tasks --- */

export interface NewTask {
  title: string;
  date: string;
  time?: string;
  category: Category;
  scope?: TaskScope;
  priority?: Priority;
  reminderOffsetMin?: ReminderOffset;
  checklistId?: string;
}

export function buildTask(t: NewTask): Task {
  const scope = t.scope ?? 'day';
  const isPeriod = scope !== 'day';
  return {
    id: nextId(),
    title: t.title.trim(),
    date: t.date,
    // A period plan has no clock time or reminder — it is a goal, not an event.
    time: isPeriod ? undefined : t.time,
    category: t.category,
    scope,
    // Tasks written in simple mode still need a bucket if the user later
    // switches to advanced — 'muhim' is the neutral default.
    priority: t.priority ?? 'muhim',
    done: false,
    reminderOffsetMin: isPeriod ? undefined : t.reminderOffsetMin,
    checklistId: t.checklistId,
    createdAt: Date.now(),
  };
}

/** A day task unless it carries a period scope. */
function isDayTask(t: Task): boolean {
  return (t.scope ?? 'day') === 'day';
}

export function addTask(s: AppState, t: NewTask): AppState {
  if (!t.title.trim()) return s;
  return { ...s, tasks: [...s.tasks, buildTask(t)] };
}

export function toggleTask(s: AppState, id: string): AppState {
  return {
    ...s,
    tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
  };
}

export function removeTask(s: AppState, id: string): AppState {
  return { ...s, tasks: s.tasks.filter((t) => t.id !== id) };
}

/** Re-inserts a removed task — backs the 5-second undo toast (plan.md §3.1). */
export function restoreTask(s: AppState, task: Task): AppState {
  if (s.tasks.some((t) => t.id === task.id)) return s;
  return { ...s, tasks: [...s.tasks, task] };
}

export interface TaskPatch {
  title?: string;
  date?: string;
  time?: string;
  category?: Category;
  priority?: Priority;
  reminderOffsetMin?: ReminderOffset;
  checklistId?: string;
}

export function updateTask(s: AppState, id: string, patch: TaskPatch): AppState {
  return {
    ...s,
    tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  };
}

/** Timed tasks in clock order, then untimed ones ("Vaqtsiz"). Day tasks only —
 *  a month plan anchored to the 1st must never leak into that day's list. */
export function tasksForDate(s: AppState, dateISO: string): Task[] {
  return s.tasks
    .filter((t) => isDayTask(t) && t.date === dateISO)
    .sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return a.createdAt - b.createdAt;
    });
}

/**
 * Unfinished tasks from before today move onto today, so nothing is silently
 * lost (plan.md §3.1). `rolledFrom` keeps the original date — that is what the
 * UI reads to show the "Kechikkan" badge — and survives a second roll.
 */
export function rollOverdue(s: AppState, todayISO: string): AppState {
  return {
    ...s,
    tasks: s.tasks.map((t) =>
      // Period plans belong to their period and never roll — only day tasks do.
      isDayTask(t) && !t.done && t.date < todayISO
        ? { ...t, date: todayISO, rolledFrom: t.rolledFrom ?? t.date }
        : t,
    ),
  };
}

/**
 * Plans for one period (week / month / year), identified by the period's
 * anchor date. Newest first, undone before done so the open goals lead.
 */
export function plansForPeriod(
  s: AppState,
  scope: TaskScope,
  anchorISO: string,
): Task[] {
  return s.tasks
    .filter((t) => t.scope === scope && t.date === anchorISO)
    .sort((a, b) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt);
}

/**
 * A day split into priority buckets, most urgent first — the shape 'advanced'
 * task mode renders. Empty buckets are dropped so the screen never shows a
 * heading with nothing under it.
 */
export function tasksByPriority(
  s: AppState,
  dateISO: string,
): { priority: Priority; tasks: Task[] }[] {
  const day = tasksForDate(s, dateISO);
  return PRIORITIES.map((priority) => ({
    priority,
    // Tasks predating advanced mode have no priority; treat them as 'muhim'.
    tasks: day.filter((t) => (t.priority ?? 'muhim') === priority),
  })).filter((group) => group.tasks.length > 0);
}

/* --- Checklists --- */

export function addChecklist(s: AppState, name: string, icon?: string): AppState {
  const trimmed = name.trim();
  if (!trimmed) return s;
  const list: Checklist = { id: nextId(), name: trimmed, icon, items: [] };
  return { ...s, checklists: [...s.checklists, list] };
}

export function removeChecklist(s: AppState, id: string): AppState {
  return {
    ...s,
    checklists: s.checklists.filter((c) => c.id !== id),
    // Tasks pointing at a deleted list keep working, just unlinked.
    tasks: s.tasks.map((t) =>
      t.checklistId === id ? { ...t, checklistId: undefined } : t,
    ),
  };
}

function mapList(
  s: AppState,
  listId: string,
  fn: (c: Checklist) => Checklist,
): AppState {
  return {
    ...s,
    checklists: s.checklists.map((c) => (c.id === listId ? fn(c) : c)),
  };
}

export function addChecklistItem(s: AppState, listId: string, text: string): AppState {
  const trimmed = text.trim();
  if (!trimmed) return s;
  return mapList(s, listId, (c) => ({
    ...c,
    items: [
      ...c.items,
      { id: nextId(), text: trimmed, done: false, order: c.items.length },
    ],
  }));
}

export function toggleChecklistItem(
  s: AppState,
  listId: string,
  itemId: string,
): AppState {
  return mapList(s, listId, (c) => ({
    ...c,
    items: c.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)),
  }));
}

export function removeChecklistItem(
  s: AppState,
  listId: string,
  itemId: string,
): AppState {
  return mapList(s, listId, (c) => ({
    ...c,
    items: c.items
      .filter((i) => i.id !== itemId)
      .map((i, idx) => ({ ...i, order: idx })),
  }));
}

export function reorderChecklistItem(
  s: AppState,
  listId: string,
  itemId: string,
  newOrder: number,
): AppState {
  return mapList(s, listId, (c) => {
    const sorted = [...c.items].sort((a, b) => a.order - b.order);
    const from = sorted.findIndex((i) => i.id === itemId);
    if (from < 0) return c;
    const [moved] = sorted.splice(from, 1);
    sorted.splice(Math.max(0, Math.min(newOrder, sorted.length)), 0, moved);
    return { ...c, items: sorted.map((i, idx) => ({ ...i, order: idx })) };
  });
}

/** "Yana boshlash" — the point of a recurring list (plan.md §3.2). */
export function resetChecklist(s: AppState, listId: string): AppState {
  return mapList(s, listId, (c) => ({
    ...c,
    items: c.items.map((i) => ({ ...i, done: false })),
  }));
}

/* --- Settings --- */

export function setTheme(s: AppState, theme: ThemeMode): AppState {
  return { ...s, settings: { ...s.settings, theme } };
}

export function setSkin(s: AppState, skin: Skin): AppState {
  return { ...s, settings: { ...s.settings, skin } };
}

export function setTaskMode(s: AppState, taskMode: TaskMode): AppState {
  return { ...s, settings: { ...s.settings, taskMode } };
}

export function setDoneStyle(s: AppState, doneStyle: DoneStyle): AppState {
  return { ...s, settings: { ...s.settings, doneStyle } };
}

export function setFont(s: AppState, font: FontChoice): AppState {
  return { ...s, settings: { ...s.settings, font } };
}

export function setPlanScope(s: AppState, scope: PeriodScope, on: boolean): AppState {
  return {
    ...s,
    settings: { ...s.settings, planScopes: { ...s.settings.planScopes, [scope]: on } },
  };
}

export function setPriority(s: AppState, id: string, priority: Priority): AppState {
  return {
    ...s,
    tasks: s.tasks.map((t) => (t.id === id ? { ...t, priority } : t)),
  };
}

export function markAnnouncementSeen(s: AppState, id: string): AppState {
  return { ...s, settings: { ...s.settings, seenAnnouncement: id } };
}

export function setLanguage(s: AppState, lang: Language): AppState {
  return { ...s, settings: { ...s.settings, lang } };
}

export function setWeekStart(s: AppState, weekStart: WeekStart): AppState {
  return { ...s, settings: { ...s.settings, weekStart } };
}

export function setNotifications(
  s: AppState,
  patch: Partial<NotificationSettings>,
): AppState {
  return {
    ...s,
    settings: {
      ...s.settings,
      notifications: { ...s.settings.notifications, ...patch },
    },
  };
}

export function setSettings(s: AppState, settings: AppSettings): AppState {
  return { ...s, settings };
}
