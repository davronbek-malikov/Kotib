import { describe, expect, it, vi } from 'vitest';
import { restoreFromNative, shouldRestore } from '../nativeStore';
import { addTask, createInitialState } from '../store';

function prefs(value: string | null) {
  return {
    set: vi.fn(async () => {}),
    get: vi.fn(async () => ({ value })),
  };
}

describe('restoreFromNative', () => {
  it('returns the mirrored state', async () => {
    const s = addTask(createInitialState(), {
      title: 'Tiklandi', date: '2026-07-16', category: 'ish',
    });
    const restored = await restoreFromNative(prefs(JSON.stringify(s)));
    expect(restored?.tasks[0].title).toBe('Tiklandi');
  });

  it('returns null when there is no backup', async () => {
    expect(await restoreFromNative(prefs(null))).toBeNull();
  });

  it('returns null on corrupt data rather than throwing', async () => {
    expect(await restoreFromNative(prefs('{ not json'))).toBeNull();
  });

  it('returns null when the backup is the wrong shape', async () => {
    expect(await restoreFromNative(prefs('{"schemaVersion":99}'))).toBeNull();
  });
});

describe('shouldRestore', () => {
  it('restores only into an empty install', () => {
    expect(shouldRestore(createInitialState())).toBe(true);
  });

  it('never overwrites data the user already has', () => {
    const s = addTask(createInitialState(), {
      title: 'Mavjud', date: '2026-07-16', category: 'ish',
    });
    expect(shouldRestore(s)).toBe(false);
  });

  it('treats existing checklists as data worth keeping', () => {
    const s = createInitialState();
    expect(
      shouldRestore({
        ...s,
        checklists: [{ id: 'a', name: 'Bozorlik', items: [] }],
      }),
    ).toBe(false);
  });
});
