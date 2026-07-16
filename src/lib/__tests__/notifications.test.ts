import { describe, expect, it, vi } from 'vitest';
import { addTask, createInitialState } from '../store';
import { setLang } from '../i18n';
import {
  HORIZON_DAYS,
  dueReminders,
  fireTimeFor,
  notificationIdFor,
  syncReminders,
  type NotificationBridge,
  type ScheduledReminder,
} from '../notifications';
import type { Task } from '../types';

function task(over: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Stomatolog',
    date: '2026-07-16',
    time: '15:00',
    category: 'shaxsiy',
    done: false,
    reminderOffsetMin: 0,
    createdAt: 0,
    ...over,
  };
}

function stubBridge(): NotificationBridge {
  return {
    schedule: vi.fn(async () => {}),
    cancelAll: vi.fn(async () => {}),
    scheduleDigest: vi.fn(async () => {}),
  };
}

describe('fireTimeFor', () => {
  it('fires at the task time when the offset is 0', () => {
    expect(fireTimeFor(task())).toEqual(new Date(2026, 6, 16, 15, 0));
  });

  it('subtracts the offset', () => {
    expect(fireTimeFor(task({ reminderOffsetMin: 30 }))).toEqual(
      new Date(2026, 6, 16, 14, 30),
    );
    expect(fireTimeFor(task({ reminderOffsetMin: 60 }))).toEqual(
      new Date(2026, 6, 16, 14, 0),
    );
  });

  it('crosses midnight for a 1-day offset', () => {
    expect(fireTimeFor(task({ reminderOffsetMin: 1440 }))).toEqual(
      new Date(2026, 6, 15, 15, 0),
    );
  });

  it('has no fire time without a time', () => {
    expect(fireTimeFor(task({ time: undefined }))).toBeNull();
  });

  it('has no fire time without a reminder', () => {
    expect(fireTimeFor(task({ reminderOffsetMin: undefined }))).toBeNull();
  });
});

describe('notificationIdFor', () => {
  it('is stable for the same task', () => {
    expect(notificationIdFor('abc')).toBe(notificationIdFor('abc'));
  });

  it('differs across tasks', () => {
    expect(notificationIdFor('abc')).not.toBe(notificationIdFor('abd'));
  });

  it('is a positive 32-bit int, as Android requires', () => {
    const id = notificationIdFor('some-task-id-9');
    expect(Number.isInteger(id)).toBe(true);
    expect(id).toBeGreaterThan(0);
    expect(id).toBeLessThan(2 ** 31);
  });
});

describe('dueReminders', () => {
  const now = new Date(2026, 6, 16, 12, 0);

  it('includes a reminder later today', () => {
    let s = createInitialState();
    s = addTask(s, {
      title: 'Stomatolog', date: '2026-07-16', time: '15:00',
      category: 'shaxsiy', reminderOffsetMin: 0,
    });
    expect(dueReminders(s, now)).toHaveLength(1);
  });

  it('skips reminders already in the past', () => {
    let s = createInitialState();
    s = addTask(s, {
      title: 'Ertalabki', date: '2026-07-16', time: '09:00',
      category: 'ish', reminderOffsetMin: 0,
    });
    expect(dueReminders(s, now)).toHaveLength(0);
  });

  it('skips completed tasks', () => {
    let s = createInitialState();
    s = addTask(s, {
      title: 'Bajarilgan', date: '2026-07-16', time: '15:00',
      category: 'ish', reminderOffsetMin: 0,
    });
    s = { ...s, tasks: s.tasks.map((x) => ({ ...x, done: true })) };
    expect(dueReminders(s, now)).toHaveLength(0);
  });

  it('skips tasks with no reminder set', () => {
    let s = createInitialState();
    s = addTask(s, {
      title: 'Eslatmasiz', date: '2026-07-16', time: '15:00', category: 'ish',
    });
    expect(dueReminders(s, now)).toHaveLength(0);
  });

  it(`registers nothing beyond the ${HORIZON_DAYS}-day horizon`, () => {
    let s = createInitialState();
    s = addTask(s, {
      title: 'Uzoq', date: '2026-09-30', time: '15:00',
      category: 'ish', reminderOffsetMin: 0,
    });
    expect(dueReminders(s, now)).toHaveLength(0);
  });

  it('includes a reminder just inside the horizon', () => {
    let s = createInitialState();
    s = addTask(s, {
      title: 'Chegarada', date: '2026-08-10', time: '15:00',
      category: 'ish', reminderOffsetMin: 0,
    });
    expect(dueReminders(s, now)).toHaveLength(1);
  });

  it('builds a spoken-friendly body from the task title', () => {
    setLang('uz');
    let s = createInitialState();
    s = addTask(s, {
      title: 'Stomatolog', date: '2026-07-16', time: '15:00',
      category: 'shaxsiy', reminderOffsetMin: 0,
    });
    const [r] = dueReminders(s, now);
    expect(r.title).toBe('Stomatolog');
    expect(r.body).toContain('15:00');
  });

  it('returns reminders in fire order', () => {
    let s = createInitialState();
    s = addTask(s, {
      title: 'Kech', date: '2026-07-16', time: '18:00',
      category: 'ish', reminderOffsetMin: 0,
    });
    s = addTask(s, {
      title: 'Erta', date: '2026-07-16', time: '14:00',
      category: 'ish', reminderOffsetMin: 0,
    });
    expect(dueReminders(s, now).map((r) => r.title)).toEqual(['Erta', 'Kech']);
  });
});

describe('syncReminders', () => {
  const now = new Date(2026, 6, 16, 12, 0);

  it('cancels everything before rescheduling, so edits cannot double-fire', async () => {
    const calls: string[] = [];
    const bridge: NotificationBridge = {
      cancelAll: vi.fn(async () => { calls.push('cancel'); }),
      schedule: vi.fn(async (_rs: ScheduledReminder[]) => { calls.push('schedule'); }),
      scheduleDigest: vi.fn(async () => {}),
    };
    let s = createInitialState();
    s = addTask(s, {
      title: 'A', date: '2026-07-16', time: '15:00',
      category: 'ish', reminderOffsetMin: 0,
    });

    await syncReminders(s, bridge, now);
    expect(calls).toEqual(['cancel', 'schedule']);
  });

  it('schedules nothing when reminders are disabled', async () => {
    const bridge = stubBridge();
    let s = createInitialState();
    s = addTask(s, {
      title: 'A', date: '2026-07-16', time: '15:00',
      category: 'ish', reminderOffsetMin: 0,
    });
    s = {
      ...s,
      settings: {
        ...s.settings,
        notifications: { ...s.settings.notifications, enabled: false },
      },
    };

    const scheduled = await syncReminders(s, bridge, now);
    expect(scheduled).toEqual([]);
    expect(bridge.schedule).not.toHaveBeenCalled();
    // Still cancelled, so turning the master switch off silences pending alarms.
    expect(bridge.cancelAll).toHaveBeenCalled();
  });

  it('never rejects when the bridge throws', async () => {
    const bridge: NotificationBridge = {
      cancelAll: vi.fn(async () => { throw new Error('no bridge'); }),
      schedule: vi.fn(async () => {}),
      scheduleDigest: vi.fn(async () => {}),
    };
    await expect(syncReminders(createInitialState(), bridge, now)).resolves.toEqual([]);
  });

  it('schedules the daily digest at the configured time', async () => {
    const bridge = stubBridge();
    await syncReminders(createInitialState(), bridge, now);
    expect(bridge.scheduleDigest).toHaveBeenCalledWith('08:00', expect.any(String));
  });
});

describe('digestBody', () => {
  it('summarises the day like the Phase 2 Telegram briefing will', async () => {
    const { digestBody } = await import('../notifications');
    setLang('uz');
    let s = createInitialState();
    s = addTask(s, {
      title: 'Planyorka', date: '2026-07-16', time: '09:00', category: 'ish',
    });
    s = addTask(s, { title: 'Non', date: '2026-07-16', category: 'oila' });
    expect(digestBody(s, '2026-07-16')).toBe('2 vazifa · 1 uchrashuv');
  });

  it('says so when the day is empty', async () => {
    const { digestBody } = await import('../notifications');
    setLang('uz');
    expect(digestBody(createInitialState(), '2026-07-16')).toBe('0 vazifa');
  });

  it('ignores other days', async () => {
    const { digestBody } = await import('../notifications');
    setLang('uz');
    let s = createInitialState();
    s = addTask(s, { title: 'Ertaga', date: '2026-07-17', category: 'ish' });
    expect(digestBody(s, '2026-07-16')).toBe('0 vazifa');
  });
});
