import type { AppState, Task } from './types';
import { t } from './i18n';

/**
 * Android caps pending alarms (~500), so only reminders inside this window are
 * registered with the OS. Every launch/resume re-syncs the window, which also
 * pulls in tasks that have since entered it (spec §4).
 */
export const HORIZON_DAYS = 30;

/** Reserved id, outside notificationIdFor's [1, 2_000_000_000] range. */
export const DIGEST_ID = 2_000_000_001;

export interface ScheduledReminder {
  /** Stable per task, so a reschedule replaces rather than duplicates. */
  id: number;
  taskId: string;
  title: string;
  body: string;
  at: Date;
}

/**
 * The seam between scheduling rules and Capacitor. Keeping the platform behind
 * this interface is what lets the rules here be unit-tested with no bridge, and
 * what lets the web build run with no bridge at all (spec §10.1).
 */
export interface NotificationBridge {
  schedule(reminders: ScheduledReminder[]): Promise<void>;
  cancelAll(): Promise<void>;
  /** Repeating daily notification at `hhmm` ("08:00"). */
  scheduleDigest(hhmm: string, body: string): Promise<void>;
}

/** When a task's reminder should fire, or null if it has none. */
export function fireTimeFor(task: Task): Date | null {
  if (!task.time || task.reminderOffsetMin === undefined) return null;
  const [y, m, d] = task.date.split('-').map(Number);
  const [hh, mm] = task.time.split(':').map(Number);
  const at = new Date(y, m - 1, d, hh, mm);
  at.setMinutes(at.getMinutes() - task.reminderOffsetMin);
  return at;
}

/**
 * Android notification ids must be 32-bit ints, but our task ids are strings —
 * so hash them (djb2). Stable across runs, unlike a counter.
 */
export function notificationIdFor(taskId: string): number {
  let hash = 5381;
  for (let i = 0; i < taskId.length; i += 1) {
    hash = ((hash << 5) + hash + taskId.charCodeAt(i)) | 0;
  }
  // Keep it positive and clear of DIGEST_ID.
  return (Math.abs(hash) % 2_000_000_000) + 1;
}

/** Reminders that should be registered right now, within the horizon. */
export function dueReminders(
  s: AppState,
  from: Date,
  horizonDays: number = HORIZON_DAYS,
): ScheduledReminder[] {
  const limit = new Date(from);
  limit.setDate(limit.getDate() + horizonDays);

  const out: ScheduledReminder[] = [];
  for (const task of s.tasks) {
    if (task.done) continue;
    const at = fireTimeFor(task);
    if (!at) continue;
    if (at <= from || at > limit) continue;
    out.push({
      id: notificationIdFor(task.id),
      taskId: task.id,
      title: task.title,
      // Read aloud when voice is on ("Eslatma: 15:00 — Stomatolog").
      body: `${t('rem.prefix')}: ${task.time} — ${task.title}`,
      at,
    });
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/**
 * The 8:00 morning line — "3 vazifa · 1 uchrashuv" (plan.md §3.3). This is the
 * seed of the Phase 2 Telegram briefing, so the wording is deliberate.
 */
export function digestBody(s: AppState, todayISO: string): string {
  const tasks = s.tasks.filter((task) => task.date === todayISO);
  const timed = tasks.filter((task) => task.time).length;
  const line = `${tasks.length} ${t('today.summary.tasks')}`;
  return timed > 0 ? `${line} · ${timed} ${t('today.summary.meeting')}` : line;
}

/** Local-date ISO without importing dates.ts (which would be a cycle via i18n). */
function toISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Cancel-then-reschedule the whole horizon. Simpler and safer than diffing: an
 * edited or deleted task can never leave a stale alarm behind.
 * Never rejects — a missing bridge must not break the UI.
 */
export async function syncReminders(
  s: AppState,
  bridge: NotificationBridge,
  now: Date = new Date(),
): Promise<ScheduledReminder[]> {
  try {
    await bridge.cancelAll();
    if (!s.settings.notifications.enabled) return [];
    const reminders = dueReminders(s, now);
    if (reminders.length > 0) await bridge.schedule(reminders);
    await bridge.scheduleDigest(
      s.settings.notifications.digestTime,
      digestBody(s, toISODateLocal(now)),
    );
    return reminders;
  } catch {
    return [];
  }
}
