import { beforeEach, describe, expect, it } from 'vitest';
import {
  addChecklist,
  addChecklistItem,
  addTask,
  createInitialState,
  exportJSON,
  importJSON,
  loadState,
  removeTask,
  reorderChecklistItem,
  resetChecklist,
  restoreTask,
  rollOverdue,
  saveState,
  tasksForDate,
  toggleChecklistItem,
  toggleTask,
} from '../store';

beforeEach(() => localStorage.clear());

describe('createInitialState', () => {
  it('defaults to light theme, Uzbek, Monday-first', () => {
    const s = createInitialState();
    expect(s.schemaVersion).toBe(1);
    expect(s.settings.theme).toBe('light');
    expect(s.settings.lang).toBe('uz');
    expect(s.settings.weekStart).toBe('mon');
    expect(s.tasks).toEqual([]);
  });
});

describe('tasks', () => {
  it('adds a task with generated id and createdAt', () => {
    const s = addTask(createInitialState(), {
      title: 'Stomatolog',
      date: '2026-07-16',
      time: '15:00',
      category: 'shaxsiy',
    });
    expect(s.tasks).toHaveLength(1);
    expect(s.tasks[0].title).toBe('Stomatolog');
    expect(s.tasks[0].done).toBe(false);
    expect(s.tasks[0].id).toBeTruthy();
  });

  it('gives every task a distinct id', () => {
    let s = createInitialState();
    s = addTask(s, { title: 'A', date: '2026-07-16', category: 'ish' });
    s = addTask(s, { title: 'B', date: '2026-07-16', category: 'ish' });
    expect(s.tasks[0].id).not.toBe(s.tasks[1].id);
  });

  it('ignores a blank title', () => {
    const s = addTask(createInitialState(), {
      title: '   ', date: '2026-07-16', category: 'ish',
    });
    expect(s.tasks).toHaveLength(0);
  });

  it('toggles done', () => {
    let s = addTask(createInitialState(), {
      title: 'A', date: '2026-07-16', category: 'ish',
    });
    const id = s.tasks[0].id;
    s = toggleTask(s, id);
    expect(s.tasks[0].done).toBe(true);
    s = toggleTask(s, id);
    expect(s.tasks[0].done).toBe(false);
  });

  it('removes a task and can restore it for undo', () => {
    let s = addTask(createInitialState(), {
      title: 'A', date: '2026-07-16', category: 'ish',
    });
    const task = s.tasks[0];
    s = removeTask(s, task.id);
    expect(s.tasks).toHaveLength(0);
    s = restoreTask(s, task);
    expect(s.tasks).toHaveLength(1);
    expect(s.tasks[0].id).toBe(task.id);
  });

  it('sorts a day: timed tasks by time, untimed last', () => {
    let s = createInitialState();
    s = addTask(s, { title: 'Vaqtsiz', date: '2026-07-16', category: 'boshqa' });
    s = addTask(s, { title: 'Kech', date: '2026-07-16', time: '18:00', category: 'ish' });
    s = addTask(s, { title: 'Erta', date: '2026-07-16', time: '09:00', category: 'ish' });
    s = addTask(s, { title: 'Boshqa kun', date: '2026-07-17', time: '09:00', category: 'ish' });

    const day = tasksForDate(s, '2026-07-16');
    expect(day.map((t) => t.title)).toEqual(['Erta', 'Kech', 'Vaqtsiz']);
  });
});

describe('rollOverdue', () => {
  it('moves unfinished past tasks onto today (plan.md §3.1)', () => {
    let s = createInitialState();
    s = addTask(s, { title: 'Kechagi', date: '2026-07-15', time: '10:00', category: 'ish' });
    s = rollOverdue(s, '2026-07-16');
    expect(s.tasks[0].date).toBe('2026-07-16');
  });

  it('leaves completed past tasks where they are', () => {
    let s = createInitialState();
    s = addTask(s, { title: 'Bajarilgan', date: '2026-07-15', category: 'ish' });
    s = toggleTask(s, s.tasks[0].id);
    s = rollOverdue(s, '2026-07-16');
    expect(s.tasks[0].date).toBe('2026-07-15');
  });

  it('leaves future tasks alone', () => {
    let s = createInitialState();
    s = addTask(s, { title: 'Ertangi', date: '2026-07-17', category: 'ish' });
    s = rollOverdue(s, '2026-07-16');
    expect(s.tasks[0].date).toBe('2026-07-17');
  });

  it('records where a rolled task came from, so the UI can mark it Kechikkan', () => {
    let s = createInitialState();
    s = addTask(s, { title: 'Kechagi', date: '2026-07-15', category: 'ish' });
    s = rollOverdue(s, '2026-07-16');
    expect(s.tasks[0].rolledFrom).toBe('2026-07-15');
  });

  it('keeps the original date when a task rolls twice', () => {
    let s = createInitialState();
    s = addTask(s, { title: 'Eski', date: '2026-07-14', category: 'ish' });
    s = rollOverdue(s, '2026-07-15');
    s = rollOverdue(s, '2026-07-16');
    expect(s.tasks[0].rolledFrom).toBe('2026-07-14');
    expect(s.tasks[0].date).toBe('2026-07-16');
  });
});

describe('checklists', () => {
  it('adds items and resets all checks (plan.md §3.2)', () => {
    let s = addChecklist(createInitialState(), 'Bozorlik', '🛒');
    const listId = s.checklists[0].id;
    s = addChecklistItem(s, listId, 'Non');
    s = addChecklistItem(s, listId, 'Sut');
    s = toggleChecklistItem(s, listId, s.checklists[0].items[0].id);
    expect(s.checklists[0].items[0].done).toBe(true);

    s = resetChecklist(s, listId);
    expect(s.checklists[0].items.every((i) => !i.done)).toBe(true);
    expect(s.checklists[0].items).toHaveLength(2);
  });

  it('reorders items and renumbers them contiguously', () => {
    let s = addChecklist(createInitialState(), 'Safar');
    const listId = s.checklists[0].id;
    s = addChecklistItem(s, listId, 'Pasport');
    s = addChecklistItem(s, listId, 'Chipta');
    s = addChecklistItem(s, listId, 'Zaryadchi');

    const last = s.checklists[0].items[2].id;
    s = reorderChecklistItem(s, listId, last, 0);

    const items = [...s.checklists[0].items].sort((a, b) => a.order - b.order);
    expect(items.map((i) => i.text)).toEqual(['Zaryadchi', 'Pasport', 'Chipta']);
    expect(items.map((i) => i.order)).toEqual([0, 1, 2]);
  });
});

describe('persistence', () => {
  it('round-trips through localStorage', () => {
    const s = addTask(createInitialState(), {
      title: 'Saqlash', date: '2026-07-16', category: 'ish',
    });
    saveState(s);
    expect(loadState().tasks[0].title).toBe('Saqlash');
  });

  it('mirrors theme and lang for the pre-paint script', () => {
    const s = createInitialState();
    saveState({ ...s, settings: { ...s.settings, theme: 'dark', lang: 'tr' } });
    expect(localStorage.getItem('kotib.theme')).toBe('dark');
    expect(localStorage.getItem('kotib.lang')).toBe('tr');
  });

  it('falls back to initial state on corrupt data', () => {
    localStorage.setItem('kotib-state-v1', '{ not json');
    expect(loadState().tasks).toEqual([]);
  });

  it('exports and imports JSON (plan.md §3.5)', () => {
    const s = addTask(createInitialState(), {
      title: 'Zaxira', date: '2026-07-16', category: 'oila',
    });
    const imported = importJSON(exportJSON(s));
    expect(imported?.tasks[0].title).toBe('Zaxira');
  });

  it('rejects junk on import rather than corrupting state', () => {
    expect(importJSON('{ not json')).toBeNull();
    expect(importJSON('{"nope":1}')).toBeNull();
  });
});
