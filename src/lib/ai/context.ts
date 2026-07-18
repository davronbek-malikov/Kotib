import type { AppState } from '../types';
import { toISODate } from '../dates';

/**
 * Everything the assistant is allowed to know, as plain JSON.
 *
 * This is the difference between a chatbot and a secretary: it gets the real
 * tasks and the real dates, so "ertaga nima bor?" is answered from data rather
 * than guessed. It also gets a description of the app itself, so "qanday
 * eslatma qo'yaman?" is answered correctly instead of invented.
 *
 * Nothing here leaves the user's phone except to the app's own /api/ai proxy.
 */

/** Kept in sync with the real UI by ai.test.ts. */
const APP_GUIDE = {
  nomi: 'Kotib',
  tavsif: "O'zbek tilidagi aqlli shaxsiy kotib: kunlik reja, taqvim, ro'yxatlar, eslatmalar.",
  sahifalar: {
    Bugun:
      "Kunlik reja. Yuqorida bugungi sana, nechta vazifa borligi va bajarilgan foizi (halqa + chiziq). Pastda vazifalar ro'yxati. ＋ tugmasi orqali yangi vazifa qo'shiladi. Vazifani o'ngga surish = bajarildi, chapga surish = o'chirish (5 soniya ichida qaytarish mumkin). Kechagi bajarilmagan vazifalar bugunga ko'chadi va 'Kechikkan' deb belgilanadi.",
    Taqvim:
      "Oylik ko'rinish. Nuqta = o'sha kunda vazifa bor, halqa = hammasi bajarilgan. Kunni bosing — o'sha kunning vazifalari ochiladi va ＋ orqali o'sha kunga vazifa qo'shiladi.",
    "Ro'yxatlar":
      "Qayta ishlatiladigan belgilar ro'yxatlari (masalan 'Bozorlik'). Element qo'shish, belgilash, tartibini o'zgartirish (↑↓), o'chirish mumkin. 'Yana boshlash' hamma belgini tozalaydi, elementlar qoladi.",
    Taqvim_rejalar:
      "Taqvim sahifasi tepasida almashtirgich bor: Taqvim (oylik kalendar), Hafta, Oy, Yil. Hafta/Oy/Yil — davriy rejalar (maqsadlar) ro'yxati; ‹ › bilan davrni almashtiriladi. Qaysi davrlar ko'rinishi Sozlamalar → Rejalar'da tanlanadi.",
    'AI yordamchi': 'Shu suhbat. Rejalar, sanalar va ilova haqida savol berish mumkin.',
    Sozlamalar:
      "Yuqoridagi ⚙ tugmasi orqali ochiladi. Ko'rinish (Yorug'/Qorong'i/Avto), Uslub (Klassik/Registon), Vazifa rejimi (Oddiy/Kengaytirilgan), Bajarilgan vazifa ko'rinishi, Shrift, Til, Eslatmalar, Hafta boshi, zaxira nusxa.",
  },
  imkoniyatlar: {
    eslatma:
      "Vazifa qo'shayotganda VAQT tanlang — shundan keyin 'Eslatma' ro'yxati chiqadi: Vaqtida, 5/30 daqiqa oldin, 1 soat oldin, 1 kun oldin. Android ilovada eslatma ilova yopiq bo'lsa ham aniq vaqtda keladi.",
    'kunlik xulosa': "Har kuni ertalab (sozlamalarda vaqtini o'zgartirish mumkin) kun rejasi haqida bildirishnoma keladi.",
    uslublar:
      "Klassik — sokin yashil, minimal. Registon — Registon koshinlari ranglari (ko'k, feruza, anor, za'faron); har bir toifa va muhimlik o'z rangiga ega, shuning uchun kunni bir qarashda o'qish mumkin.",
    'vazifa rejimi':
      "Oddiy — hamma vazifa bitta ro'yxatda (vaqtli va vaqtsiz). Kengaytirilgan — kun muhimligi bo'yicha bo'linadi: Shoshilinch, Muhim, Shaxsiy rivojlanish, Kam muhim.",
    tillar: "O'zbekcha (lotin), Ўзбекча (крилл), Türkçe, English.",
    "ma'lumot": "Hamma ma'lumot faqat telefonda saqlanadi (localStorage). Server yo'q. Sozlamalarda JSON zaxira nusxa olish va tiklash mumkin.",
    yangilanish:
      "Ilova o'zi yangilanadi — qayta o'rnatish shart emas. Faqat yangi native imkoniyat qo'shilganda yangi APK kerak bo'ladi.",
  },
};

const WEEKDAY_UZ = [
  'dushanba', 'seshanba', 'chorshanba', 'payshanba',
  'juma', 'shanba', 'yakshanba',
];

export interface AiContext {
  bugun: { sana: string; hafta_kuni: string };
  sozlamalar: object;
  vazifalar: object[];
  rejalar: object[];
  royxatlar: object[];
  ilova: object;
}

/**
 * `now` is injectable so tests are not time-dependent, and so "bugun" is always
 * the user's local day rather than UTC.
 */
export function buildContext(s: AppState, now: Date = new Date()): AiContext {
  const today = toISODate(now);
  const mondayIndex = (now.getDay() + 6) % 7;

  // A window, not the whole history: enough for "o'tgan hafta" and forward
  // planning without sending years of data on every turn.
  const from = new Date(now);
  from.setDate(from.getDate() - 30);
  const to = new Date(now);
  to.setDate(to.getDate() + 90);
  const fromISO = toISODate(from);
  const toISO = toISODate(to);

  return {
    bugun: { sana: today, hafta_kuni: WEEKDAY_UZ[mondayIndex] },
    sozlamalar: {
      til: s.settings.lang,
      mavzu: s.settings.theme,
      uslub: s.settings.skin,
      vazifa_rejimi: s.settings.taskMode,
      hafta_boshi: s.settings.weekStart,
      eslatmalar: s.settings.notifications,
    },
    vazifalar: s.tasks
      // Day tasks only — period plans are listed separately as "rejalar".
      .filter((t) => (t.scope ?? 'day') === 'day' && t.date >= fromISO && t.date <= toISO)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))
      .map((t) => ({
        nomi: t.title,
        sana: t.date,
        vaqt: t.time ?? null,
        toifa: t.category,
        muhimligi: t.priority ?? 'muhim',
        bajarilgan: t.done,
        eslatma_daqiqa: t.reminderOffsetMin ?? null,
        kechikkan: t.rolledFrom ?? null,
      })),
    rejalar: s.tasks
      .filter((t) => t.scope && t.scope !== 'day')
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((t) => ({
        nomi: t.title,
        // 'week' | 'month' | 'year' — the plan's horizon.
        muddat: t.scope,
        davr_boshi: t.date,
        bajarilgan: t.done,
      })),
    royxatlar: s.checklists.map((c) => ({
      nomi: c.name,
      jami: c.items.length,
      bajarilgan: c.items.filter((i) => i.done).length,
      elementlar: c.items
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((i) => ({ matn: i.text, bajarilgan: i.done })),
    })),
    ilova: APP_GUIDE,
  };
}
