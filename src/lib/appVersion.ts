import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * The minimum installed (native) versionCode this web build needs. Bump it
 * only when a release depends on a plugin or permission an older shell lacks;
 * those shells then show the update banner until the user installs a new APK.
 *
 * Web-only changes need NO bump — they arrive from Vercel automatically. That
 * is the whole point of the live-web-shell architecture (spec §3).
 */
export const REQUIRED_NATIVE_BUILD = 1;

/** Where the banner sends people. Play Store replaces this if we ever publish. */
export const APK_URL = 'https://github.com/davronbek-malikov/Kotib/releases/latest';

/** True when the app runs in an outdated native shell. */
export async function nativeUpdateNeeded(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const info = await App.getInfo();
    const build = parseInt(info.build, 10);
    return Number.isFinite(build) ? build < REQUIRED_NATIVE_BUILD : false;
  } catch {
    return false;
  }
}
