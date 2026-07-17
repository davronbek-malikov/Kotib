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
  'nav.chat':       { uz: 'AI yordamchi', tr: 'AI asistan', en: 'AI assistant' },
  'nav.settings':   { uz: 'Sozlamalar', tr: 'Ayarlar',  en: 'Settings' },

  /* --- AI assistant --- */
  'chat.title': { uz: 'AI yordamchi', tr: 'AI asistan', en: 'AI assistant' },
  'chat.intro': {
    uz: "Istalgan savolni bering — men rejalaringizni ham bilaman.",
    tr: 'Her şeyi sorabilirsiniz — planlarınızı da biliyorum.',
    en: 'Ask me anything — I also know your plans.',
  },
  'chat.placeholder': {
    uz: "Savolingizni yozing…",
    tr: 'Sorunuzu yazın…',
    en: 'Type your question…',
  },
  'chat.send':  { uz: 'Yuborish',      tr: 'Gönder',     en: 'Send' },
  'chat.clear': { uz: 'Yangi suhbat',  tr: 'Yeni sohbet', en: 'New chat' },
  'chat.s1': {
    uz: 'Bugun nima rejam bor?',
    tr: 'Bugün planım ne?',
    en: "What's on my plate today?",
  },
  'chat.s2': {
    uz: 'Bu hafta qachon bo\'shman?',
    tr: 'Bu hafta ne zaman boşum?',
    en: "When am I free this week?",
  },
  'chat.s3': {
    uz: 'Qanday qilib eslatma qo\'yaman?',
    tr: 'Nasıl hatırlatma kurarım?',
    en: 'How do I set a reminder?',
  },
  'chat.offline': {
    uz: "Internet yo'q — AI yordamchi uchun ulanish kerak. Rejalaringiz esa oflayn ham ishlaydi.",
    tr: 'İnternet yok — AI asistan için bağlantı gerekli. Planlarınız çevrimdışı da çalışır.',
    en: 'No connection — the assistant needs internet. Your plans still work offline.',
  },
  'chat.error': {
    uz: "Javob ololmadim. Birozdan keyin qayta urinib ko'ring.",
    tr: 'Cevap alamadım. Birazdan tekrar deneyin.',
    en: "Couldn't get an answer. Try again in a moment.",
  },

  /* --- Support --- */
  'support.title': {
    uz: 'Kotib — bepul ilova',
    tr: 'Kotib — ücretsiz uygulama',
    en: 'Kotib is free',
  },
  'support.body': {
    uz: "Loyihani Tirikchilik orqali qo'llab-quvvatlashingiz mumkin",
    tr: 'Projeyi Tirikchilik üzerinden destekleyebilirsiniz',
    en: 'You can support the project via Tirikchilik',
  },

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

  /* --- Priorities (advanced task mode) --- */
  'pri.shoshilinch': { uz: 'Shoshilinch',          tr: 'Acil',              en: 'Urgent' },
  'pri.muhim':       { uz: 'Muhim',                tr: 'Önemli',            en: 'Must do' },
  'pri.rivojlanish': { uz: 'Shaxsiy rivojlanish',  tr: 'Kişisel gelişim',   en: 'Growth' },
  'pri.kam':         { uz: 'Kam muhim',            tr: 'Daha az önemli',    en: 'Less important' },

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
  'set.theme':         { uz: "Ko'rinish",       tr: 'Görünüm',       en: 'Appearance' },
  'set.notif.on':      { uz: 'Yoqilgan',        tr: 'Açık',          en: 'On' },
  'set.notif.off':     { uz: "O'chirilgan",     tr: 'Kapalı',        en: 'Off' },
  'set.data.value':    { uz: 'Zaxira · Tiklash', tr: 'Yedek · Geri yükle', en: 'Backup · Restore' },
  'set.about.hamyon': {
    uz: 'Pulingiz nazoratda — opa-singil ilova',
    tr: 'Kardeş uygulama',
    en: 'Our sister app for money',
  },
  'common.back':       { uz: 'Orqaga',          tr: 'Geri',          en: 'Back' },
  'set.theme.light':   { uz: "Yorug'",          tr: 'Açık',          en: 'Light' },
  'set.theme.dark':    { uz: "Qorong'i",        tr: 'Koyu',          en: 'Dark' },
  'set.theme.auto':    { uz: 'Avto',            tr: 'Otomatik',      en: 'Auto' },
  'set.language':      { uz: 'Til',             tr: 'Dil',           en: 'Language' },
  'set.search': {
    uz: 'Sozlamalardan qidirish',
    tr: 'Ayarlarda ara',
    en: 'Search settings',
  },
  'set.search.empty': {
    uz: 'Mos sozlama topilmadi',
    tr: 'Eşleşen ayar yok',
    en: 'No matching settings',
  },

  /* --- Skin --- */
  'set.skin':          { uz: 'Uslub',           tr: 'Tema',          en: 'Style' },
  'set.skin.klassik':  { uz: 'Klassik',         tr: 'Klasik',        en: 'Classic' },
  'set.skin.registon': { uz: 'Registon',        tr: 'Registon',      en: 'Registon' },
  'set.skin.hint': {
    uz: "Registon — Registon koshinlari ranglari. Har bir toifa o'z rangiga ega.",
    tr: 'Registon — Registan çini renkleri. Her kategorinin kendi rengi var.',
    en: 'Registon uses Registan tile colours. Every category gets its own.',
  },

  /* --- Task mode --- */
  'set.taskMode':          { uz: 'Vazifa rejimi', tr: 'Görev modu',  en: 'Task mode' },
  'set.taskMode.simple':   { uz: 'Oddiy',         tr: 'Basit',       en: 'Simple' },
  'set.taskMode.advanced': { uz: 'Kengaytirilgan', tr: 'Gelişmiş',   en: 'Advanced' },
  'set.taskMode.hint': {
    uz: "Oddiy — hamma vazifa bitta ro'yxatda. Kengaytirilgan — muhimligi bo'yicha ajratiladi.",
    tr: 'Basit — tek liste. Gelişmiş — önceliğe göre ayrılır.',
    en: 'Simple keeps one list. Advanced splits the day by priority.',
  },

  /* --- Done style --- */
  'set.doneStyle':        { uz: 'Bajarilgan vazifa', tr: 'Tamamlanan görev', en: 'Completed task' },
  'set.doneStyle.chiziq': { uz: 'Chizilgan',         tr: 'Üstü çizili',      en: 'Struck through' },
  'set.doneStyle.marker': { uz: 'Marker',            tr: 'Fosforlu kalem',   en: 'Highlighter' },
  'set.doneStyle.xira':   { uz: 'Xira',              tr: 'Soluk',            en: 'Faded' },
  'set.doneStyle.preview': {
    uz: 'Bajarilgan vazifa shunday ko\'rinadi',
    tr: 'Tamamlanan görev böyle görünür',
    en: 'A completed task looks like this',
  },
  'set.doneStyle.hint': {
    uz: "Marker — qog'ozdagidek marker bilan chizib qo'yiladi.",
    tr: 'Fosforlu kalem — kağıttaki gibi üzeri boyanır.',
    en: 'Highlighter strikes the task out the way you would on paper.',
  },

  /* --- Font --- */
  'set.font':          { uz: 'Shrift',      tr: 'Yazı tipi',   en: 'Font' },
  'set.font.manrope':  { uz: 'Oddiy',       tr: 'Normal',      en: 'Standard' },
  'set.font.qolyozma': { uz: "Qo'lyozma",   tr: 'El yazısı',   en: 'Handwritten' },
  'set.font.hint': {
    uz: "Qo'lyozma — planshet va qalam bilan yozadiganlar uchun.",
    tr: 'El yazısı — tablet ve kalemle yazanlar için.',
    en: 'Handwritten suits tablet and stylus users.',
  },

  /* --- Progress --- */
  'today.progress': { uz: 'bajarildi', tr: 'tamamlandı', en: 'done' },
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
