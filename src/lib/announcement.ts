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
  id: '2026-07-17-assistant-answers-anything',
  title: {
    uz: 'AI yordamchi endi hamma savolga javob beradi 🤖',
    tr: 'AI asistan artık her soruyu yanıtlıyor 🤖',
    en: 'The AI assistant now answers anything 🤖',
  },
  body: {
    uz: "Istalgan narsani so'rang — rejalaringizni ham biladi. Suhbat endi sahifa almashtirsangiz ham yo'qolmaydi. Yana: maxfiylik siyosati va har sahifada «Orqaga» tugmasi. Qayta o'rnatish shart emas.",
    tr: 'Her şeyi sorun — planlarınızı da biliyor. Sohbet artık sekme değiştirince kaybolmuyor. Ayrıca: gizlilik politikası ve her sayfada «Geri» düğmesi. Yeniden yükleme yok.',
    en: 'Ask it anything — it still knows your plans. Your chat no longer disappears when you switch tabs. Plus: a privacy policy and a Back button on every page. No reinstall needed.',
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
