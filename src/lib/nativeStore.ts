import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import type { AppState } from './types';

/**
 * Native backup of the app state. localStorage lives inside the WebView and
 * Android can clear it; Capacitor Preferences writes to SharedPreferences,
 * which survives that. Every save is mirrored here and restored only when the
 * WebView copy is missing. (Same pattern as Hamyon's nativeStore.)
 */
const KEY = 'kotib-state-v1';

interface PreferencesLike {
  set(options: { key: string; value: string }): Promise<void>;
  get(options: { key: string }): Promise<{ value: string | null }>;
}

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/** Fire-and-forget; never throws into the UI. */
export function mirrorToNative(
  state: AppState,
  prefs: PreferencesLike = Preferences,
): void {
  if (!isNativeApp()) return;
  void prefs.set({ key: KEY, value: JSON.stringify(state) }).catch(() => {});
}

/** The backed-up state, or null when there is none / it is invalid. */
export async function restoreFromNative(
  prefs: PreferencesLike = Preferences,
): Promise<AppState | null> {
  try {
    const { value } = await prefs.get({ key: KEY });
    if (!value) return null;
    const parsed = JSON.parse(value) as AppState;
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.tasks)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Only safe when this install has no data — never overwrite the user's work. */
export function shouldRestore(current: AppState): boolean {
  return current.tasks.length === 0 && current.checklists.length === 0;
}
