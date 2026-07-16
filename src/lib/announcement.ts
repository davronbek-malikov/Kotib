import type { AppState } from './types';
import { getLang } from './i18n';
import { toCyrillic } from './translit';

/**
 * A broadcast to every user, carried by the web build itself.
 *
 * There is no server and no push service, so we cannot wake a phone up
 * unprompted — that needs Firebase, which means a native plugin and a backend
 * (Phase 2, via Telegram). What we *do* have is that every install loads the
 * live build from Vercel, so anything shipped here reaches everyone on their
 * next app open. Deploy an announcement, and it lands for all users with no
 * reinstall.
 *
 * To broadcast: change `id` to something new and edit the text. Every device
 * shows it once, then records the id in settings.seenAnnouncement and never
 * shows it again. Set to `null` to broadcast nothing.
 */
export interface Announcement {
  /** Change this to send a new one. Devices dedupe on it. */
  id: string;
  title: { uz: string; tr: string; en: string };
  body: { uz: string; tr: string; en: string };
}

export const ANNOUNCEMENT: Announcement | null = {
  id: '2026-07-16-phase1-update',
  title: {
    uz: 'Kotib yangilandi ✨',
    tr: 'Kotib güncellendi ✨',
    en: 'Kotib just updated ✨',
  },
  body: {
    uz: "Yangi: Registon ko'rinishi, Kengaytirilgan rejim va kun foizi. Ilovani qayta o'rnatish shart emas — o'zi yangilandi.",
    tr: 'Yeni: Registon teması, Gelişmiş mod ve günlük yüzde. Yeniden yüklemeye gerek yok — kendisi güncellendi.',
    en: 'New: Registon theme, Advanced mode, and daily progress. No reinstall needed — it updated itself.',
  },
};

/** The one the user hasn't seen yet, or null. */
export function pendingAnnouncement(s: AppState): Announcement | null {
  if (!ANNOUNCEMENT) return null;
  return s.settings.seenAnnouncement === ANNOUNCEMENT.id ? null : ANNOUNCEMENT;
}

/**
 * Announcement text in the user's language. Cyrillic is generated from the
 * Uzbek source, same rule as lib/i18n — never a second hand-written copy.
 */
export function announcementText(a: Announcement): { title: string; body: string } {
  const lang = getLang();
  if (lang === 'tr') return { title: a.title.tr, body: a.body.tr };
  if (lang === 'en') return { title: a.title.en, body: a.body.en };
  if (lang === 'uz-cyrl') {
    return { title: toCyrillic(a.title.uz), body: toCyrillic(a.body.uz) };
  }
  return { title: a.title.uz, body: a.body.uz };
}
