import { describe, expect, it } from 'vitest';
import {
  addTask, createInitialState, markAnnouncementSeen, setPriority,
  setSkin, setTaskMode, tasksByPriority,
} from '../store';
import { ANNOUNCEMENT, pendingAnnouncement } from '../announcement';

describe('defaults', () => {
  it('starts on the Klassik skin and Simple mode, so nothing changes for existing users', () => {
    const s = createInitialState();
    expect(s.settings.skin).toBe('klassik');
    expect(s.settings.taskMode).toBe('simple');
  });
});

describe('settings transitions', () => {
  it('switches skin and task mode', () => {
    let s = createInitialState();
    s = setSkin(s, 'registon');
    s = setTaskMode(s, 'advanced');
    expect(s.settings.skin).toBe('registon');
    expect(s.settings.taskMode).toBe('advanced');
  });
});

describe('tasksByPriority', () => {
  it('orders buckets most urgent first', () => {
    let s = createInitialState();
    s = addTask(s, { title: 'Kam', date: '2026-07-16', category: 'ish', priority: 'kam' });
    s = addTask(s, { title: 'Shosh', date: '2026-07-16', category: 'ish', priority: 'shoshilinch' });
    s = addTask(s, { title: 'Rivoj', date: '2026-07-16', category: 'ish', priority: 'rivojlanish' });

    expect(tasksByPriority(s, '2026-07-16').map((g) => g.priority)).toEqual([
      'shoshilinch', 'rivojlanish', 'kam',
    ]);
  });

  it('drops empty buckets rather than showing a heading with nothing under it', () => {
    let s = createInitialState();
    s = addTask(s, { title: 'A', date: '2026-07-16', category: 'ish', priority: 'muhim' });
    const groups = tasksByPriority(s, '2026-07-16');
    expect(groups).toHaveLength(1);
    expect(groups[0].priority).toBe('muhim');
  });

  it("defaults a task with no priority to 'muhim', so simple-mode tasks survive the switch", () => {
    let s = createInitialState();
    s = addTask(s, { title: 'Oddiy', date: '2026-07-16', category: 'ish' });
    // Simulate data written before priorities existed.
    s = { ...s, tasks: s.tasks.map((t) => ({ ...t, priority: undefined })) };

    const groups = tasksByPriority(s, '2026-07-16');
    expect(groups).toHaveLength(1);
    expect(groups[0].priority).toBe('muhim');
    expect(groups[0].tasks[0].title).toBe('Oddiy');
  });

  it('only includes the requested day', () => {
    let s = createInitialState();
    s = addTask(s, { title: 'Bugun', date: '2026-07-16', category: 'ish', priority: 'muhim' });
    s = addTask(s, { title: 'Ertaga', date: '2026-07-17', category: 'ish', priority: 'muhim' });
    expect(tasksByPriority(s, '2026-07-16')[0].tasks).toHaveLength(1);
  });

  it('reassigns a task to another bucket', () => {
    let s = createInitialState();
    s = addTask(s, { title: 'A', date: '2026-07-16', category: 'ish' });
    s = setPriority(s, s.tasks[0].id, 'shoshilinch');
    expect(tasksByPriority(s, '2026-07-16')[0].priority).toBe('shoshilinch');
  });
});

describe('announcement broadcast', () => {
  it('is pending for a user who has not seen it', () => {
    expect(pendingAnnouncement(createInitialState())).toBe(ANNOUNCEMENT);
  });

  it('is shown once and never again', () => {
    let s = createInitialState();
    const a = pendingAnnouncement(s);
    expect(a).not.toBeNull();
    s = markAnnouncementSeen(s, a!.id);
    expect(pendingAnnouncement(s)).toBeNull();
  });

  it('reappears when a new one is broadcast', () => {
    let s = createInitialState();
    s = markAnnouncementSeen(s, 'some-older-announcement');
    // The shipped id differs from the seen one, so it is pending again.
    expect(pendingAnnouncement(s)).toBe(ANNOUNCEMENT);
  });
});
