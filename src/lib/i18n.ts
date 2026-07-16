import type { Language } from './types';
import { toCyrillic } from './translit';

/**
 * Module-level active language (same pattern as Hamyon's lib/i18n).
 * App.tsx keeps it in sync with state.settings.lang; components call t('key').
 */
let active: Language = 'uz';

export function setLang(lang: Language): void {
  active = lang;
}

export function getLang(): Language {
  return active;
}

/** The Latin Uzbek source plus its translations. Cyrillic is generated. */
type Entry = { uz: string; tr: string; en: string };

const STRINGS: Record<string, Entry> = {
  /* --- Nav (plan.md §3.6) --- */
  'nav.today':      { uz: 'Bugun',      tr: 'Bugün',    en: 'Today' },
  'nav.calendar':   { uz: 'Taqvim',     tr: 'Takvim',   en: 'Calendar' },
  'nav.lists':      { uz: "Ro'yxatlar", tr: 'Listeler', en: 'Lists' },
  'nav.settings':   { uz: 'Sozlamalar', tr: 'Ayarlar',  en: 'Settings' },

  /* --- Today (plan.md §3.1) --- */
  'today.summary.tasks':   { uz: 'vazifa',    tr: 'görev',     en: 'tasks' },
  'today.summary.meeting': { uz: 'uchrashuv', tr: 'toplantı',  en: 'meetings' },
  'today.untimed':         { uz: 'Vaqtsiz',   tr: 'Saatsiz',   en: 'No time' },
  'today.overdue':         { uz: 'Kechikkan', tr: 'Gecikmiş',  en: 'Overdue' },
  'today.empty': {
    uz: "Bugun hali reja yo'q. Birinchisini qo'shing ＋",
    tr: 'Bugün için plan yok. İlkini ekleyin ＋',
    en: 'No plans yet today. Add your first ＋',
  },
  'today.done':    { uz: 'Bajarildi',   tr: 'Tamamlandı', en: 'Done' },
  'today.undo':    { uz: 'Qaytarish',   tr: 'Geri al',    en: 'Undo' },
  'today.deleted': { uz: "O'chirildi",  tr: 'Silindi',    en: 'Deleted' },

  /* --- Quick add (plan.md §3.1) --- */
  'add.title':       { uz: 'Yangi vazifa',  tr: 'Yeni görev',       en: 'New task' },
  'add.placeholder': { uz: 'Nima qilasiz?', tr: 'Ne yapacaksınız?', en: 'What needs doing?' },
  'add.time':        { uz: 'Vaqt',          tr: 'Saat',             en: 'Time' },
  'add.date':        { uz: 'Sana',          tr: 'Tarih',            en: 'Date' },
  'add.reminder':    { uz: 'Eslatma',       tr: 'Hatırlatma',       en: 'Reminder' },
  'add.save':        { uz: 'Saqlash',       tr: 'Kaydet',           en: 'Save' },
  'add.cancel':      { uz: 'Bekor qilish',  tr: 'İptal',            en: 'Cancel' },

  /* --- Categories (plan.md §3.7) --- */
  'cat.ish':     { uz: 'Ish',     tr: 'İş',      en: 'Work' },
  'cat.shaxsiy': { uz: 'Shaxsiy', tr: 'Kişisel', en: 'Personal' },
  'cat.oila':    { uz: 'Oila',    tr: 'Aile',    en: 'Family' },
  'cat.boshqa':  { uz: 'Boshqa',  tr: 'Diğer',   en: 'Other' },

  /* --- Reminder offsets (plan.md §3.3) --- */
  'rem.none':   { uz: "Yo'q",            tr: 'Yok',            en: 'None' },
  'rem.0':      { uz: 'Vaqtida',         tr: 'Tam zamanında',  en: 'On time' },
  'rem.5':      { uz: '5 daqiqa oldin',  tr: '5 dakika önce',  en: '5 minutes before' },
  'rem.30':     { uz: '30 daqiqa oldin', tr: '30 dakika önce', en: '30 minutes before' },
  'rem.60':     { uz: '1 soat oldin',    tr: '1 saat önce',    en: '1 hour before' },
  'rem.1440':   { uz: '1 kun oldin',     tr: '1 gün önce',     en: '1 day before' },
  'rem.prefix': { uz: 'Eslatma',         tr: 'Hatırlatma',     en: 'Reminder' },

  /* --- Checklists (plan.md §3.2) --- */
  'lists.title':     { uz: "Ro'yxatlar",      tr: 'Listeler',      en: 'Lists' },
  'lists.new':       { uz: "Yangi ro'yxat",   tr: 'Yeni liste',    en: 'New list' },
  'lists.name':      { uz: 'Nomi',            tr: 'Adı',           en: 'Name' },
  'lists.addItem':   { uz: "Element qo'shish", tr: 'Öğe ekle',     en: 'Add item' },
  'lists.reset':     { uz: 'Yana boshlash',   tr: 'Yeniden başla', en: 'Start over' },
  'lists.doneCount': { uz: 'bajarildi',       tr: 'tamamlandı',    en: 'done' },
  'lists.empty': {
    uz: "Hali ro'yxat yo'q. Birinchisini yarating ＋",
    tr: 'Henüz liste yok. İlkini oluşturun ＋',
    en: 'No lists yet. Create your first ＋',
  },

  /* --- Notifications (plan.md §3.3) --- */
  'notif.title':    { uz: 'Eslatmalar',   tr: 'Hatırlatmalar',  en: 'Reminders' },
  'notif.upcoming': { uz: 'Kutilmoqda',   tr: 'Yaklaşan',       en: 'Upcoming' },
  'notif.past':     { uz: "O'tgan",       tr: 'Geçmiş',         en: 'Past' },
  'notif.empty':    { uz: "Eslatma yo'q", tr: 'Hatırlatma yok', en: 'No reminders' },
  'notif.permission': {
    uz: 'Eslatmalar uchun ruxsat bering',
    tr: 'Hatırlatmalar için izin verin',
    en: 'Allow notifications for reminders',
  },
  'notif.digest': { uz: 'Bugun', tr: 'Bugün', en: 'Today' },

  /* --- Settings (plan.md §3.5) --- */
  'set.appearance':    { uz: "Ko'rinish",       tr: 'Görünüm',       en: 'Appearance' },
  'set.theme.light':   { uz: "Yorug'",          tr: 'Açık',          en: 'Light' },
  'set.theme.dark':    { uz: "Qorong'i",        tr: 'Koyu',          en: 'Dark' },
  'set.theme.auto':    { uz: 'Avto',            tr: 'Otomatik',      en: 'Auto' },
  'set.language':      { uz: 'Til',             tr: 'Dil',           en: 'Language' },
  'set.notifications': { uz: 'Eslatmalar',      tr: 'Hatırlatmalar', en: 'Reminders' },
  'set.notif.enabled': { uz: 'Yoqilgan',        tr: 'Açık',          en: 'Enabled' },
  'set.notif.sound':   { uz: 'Signal',          tr: 'Ses',           en: 'Sound' },
  'set.notif.voice':   { uz: "Ovozli o'qish",   tr: 'Sesli okuma',   en: 'Spoken' },
  'set.notif.digest':  { uz: 'Kunlik xulosa',   tr: 'Günlük özet',   en: 'Daily digest' },
  'set.weekStart':     { uz: 'Hafta boshi',     tr: 'Hafta başı',    en: 'Week starts' },
  'set.weekStart.mon': { uz: 'Dushanba',        tr: 'Pazartesi',     en: 'Monday' },
  'set.weekStart.sun': { uz: 'Yakshanba',       tr: 'Pazar',         en: 'Sunday' },
  'set.data':          { uz: "Ma'lumotlar",     tr: 'Veriler',       en: 'Data' },
  'set.export':        { uz: 'Zaxira nusxa',    tr: 'Yedekle',       en: 'Export backup' },
  'set.import':        { uz: 'Tiklash',         tr: 'Geri yükle',    en: 'Import backup' },
  'set.deleteAll':     { uz: "Hammasini o'chirish", tr: 'Tümünü sil', en: 'Delete everything' },
  'set.deleteConfirm': {
    uz: "Hamma ma'lumot o'chiriladi. Ishonchingiz komilmi?",
    tr: 'Tüm veriler silinecek. Emin misiniz?',
    en: 'All data will be deleted. Are you sure?',
  },
  'set.importFailed': {
    uz: "Fayl yaroqsiz — hech narsa o'zgarmadi.",
    tr: 'Dosya geçersiz — hiçbir şey değişmedi.',
    en: 'Invalid file — nothing was changed.',
  },
  'set.about':   { uz: 'Haqida',  tr: 'Hakkında', en: 'About' },
  'set.version': { uz: 'Versiya', tr: 'Sürüm',    en: 'Version' },

  /* --- Update banner (spec §3.2) --- */
  'update.needed': {
    uz: 'Yangi versiya mavjud — ilovani yangilang',
    tr: 'Yeni sürüm mevcut — uygulamayı güncelleyin',
    en: 'A new version is available — please update the app',
  },
  'update.action': { uz: 'Yangilash', tr: 'Güncelle', en: 'Update' },

  /* --- Common --- */
  'common.delete': { uz: "O'chirish", tr: 'Sil',   en: 'Delete' },
  'common.close':  { uz: 'Yopish',    tr: 'Kapat', en: 'Close' },
};

export const STRING_KEYS = Object.keys(STRINGS);

export function t(key: string): string {
  const entry = STRINGS[key];
  if (!entry) return key;
  if (active === 'uz-cyrl') return toCyrillic(entry.uz);
  if (active === 'tr') return entry.tr;
  if (active === 'en') return entry.en;
  return entry.uz;
}
