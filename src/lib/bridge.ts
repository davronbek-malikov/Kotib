import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import {
  DIGEST_ID,
  type NotificationBridge,
  type ScheduledReminder,
} from './notifications';
import { t } from './i18n';

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Asked when the user first sets a reminder, never on cold start (spec §4).
 * Android 13+ requires POST_NOTIFICATIONS at runtime.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (isNative()) {
      const { display } = await LocalNotifications.requestPermissions();
      return display === 'granted';
    }
    if (typeof Notification === 'undefined') return false;
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

/** Exact alarms via AlarmManager — a 15:00 reminder must not fire at 15:07. */
function nativeBridge(): NotificationBridge {
  return {
    async schedule(reminders: ScheduledReminder[]) {
      await LocalNotifications.schedule({
        notifications: reminders.map((r) => ({
          id: r.id,
          title: r.title,
          body: r.body,
          schedule: { at: r.at, allowWhileIdle: true },
          extra: { taskId: r.taskId },
        })),
      });
    },
    async cancelAll() {
      const { notifications } = await LocalNotifications.getPending();
      if (notifications.length > 0) {
        await LocalNotifications.cancel({ notifications });
      }
    },
    async scheduleDigest(hhmm: string, body: string) {
      const [hour, minute] = hhmm.split(':').map(Number);
      await LocalNotifications.schedule({
        notifications: [{
          id: DIGEST_ID,
          title: t('notif.digest'),
          body,
          // `on` repeats daily at this wall-clock time.
          schedule: { on: { hour, minute }, allowWhileIdle: true },
        }],
      });
    },
  };
}

/**
 * The browser cannot fire a reminder once the tab is closed — that is exactly
 * why the APK exists (spec §10.1). While the app IS open, timers give parity.
 */
function webBridge(onFire: (r: ScheduledReminder) => void): NotificationBridge {
  let timers: ReturnType<typeof setTimeout>[] = [];

  return {
    async schedule(reminders: ScheduledReminder[]) {
      for (const r of reminders) {
        const delay = r.at.getTime() - Date.now();
        // setTimeout caps at ~24.8 days; anything longer is picked up by the
        // next sync on reload.
        if (delay <= 0 || delay > 2 ** 31 - 1) continue;
        timers.push(setTimeout(() => onFire(r), delay));
      }
    },
    async cancelAll() {
      timers.forEach(clearTimeout);
      timers = [];
    },
    async scheduleDigest() {
      /* No closed-app delivery on web; the Today card is the digest. */
    },
  };
}

export function createBridge(
  onFire: (r: ScheduledReminder) => void,
): NotificationBridge {
  return isNative() ? nativeBridge() : webBridge(onFire);
}
