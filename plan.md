# Reja 📘

**O'zbekiston uchun aqlli shaxsiy kotib.** Rejalashtiring, eslatma oling, hech narsani unutmang — hammasi ona tilingizda.

*The smart personal secretary built for Uzbekistan — a sister product to [Hamyon](https://hamyon-six.vercel.app/), sharing its minimalist, premium-fintech design philosophy.*

Working name: **Reja** ("plan"). Alternatives: *Yordamchi* (assistant), *Kundam* (my day), *Sekretar*. Avoid "Kotib" — KOTIB AI already exists in Uzbekistan (speech/AI startup).

---

## 1\. Why this product (market summary)

**Global market.** AI planners are a proven, fast-growing category: Motion, Reclaim.AI, Todoist, Sunsama, Morgen, Saner.AI, Akiflow. They compete on natural-language task entry, calendar sync, auto-scheduling, and proactive daily briefings. Their shared weaknesses in our market:

- English/Russian only — none parse Uzbek ("indinga", "payshanbagacha").  
- $10–34/month pricing — unrealistic for Uzbekistan.  
- Built around Gmail/Outlook/Slack; Telegram is an afterthought.  
- Aggressive auto-scheduling burns users out (Morgen wins fans by *suggesting* instead of reshuffling — a lesson for us).

**Uzbekistan market.** No Uzbek-first planner/secretary app exists. Local AI startups (Tilmoch, Muxlisa, KOTIB AI) build language infrastructure — potential **API partners**, not competitors. Key facts:

- Telegram: \~25M users, \~70–76% of the internet audience, the highest per-capita penetration in the world; used for news, commerce, and government communication. Click/Payme payments work inside Telegram.  
- \~89% of internet users are mobile-first → the web app must be flawless on phones from day one.  
- Retention is the killer in this category (planners are abandoned in 2–3 weeks). Our answer: Phase 2 Telegram delivery — we show up in the app people already open 20+ times a day.

**Ecosystem play.** Reja (time) \+ Hamyon (money) share one design language, one user base, and later one account. Cross-links no global planner and no local fintech can copy, e.g. *"Ijara to'loviga 2 kun qoldi — Hamyonda byudjetingiz yetadi."*

---

## 2\. Design system (all phases)

Minimalist like Hamyon — but **light-first**: calm, airy, effortless to read, interesting without tiring the eye.

### 2.1 Principles

1. **White canvas.** Default background is pure white (`#FFFFFF`). Content lives on the canvas itself; cards are separated by soft borders and generous spacing, not heavy shadows.  
2. **One hero moment per screen.** Like Hamyon's balance card, Reja has a single signature element: the **"Bugun" (Today) card** — today's date in large type, a one-line summary ("3 vazifa · 1 uchrashuv"), and a thin progress ring that fills as tasks are completed. This is the only place the accent color is used generously.  
3. **Calm accent, warm neutrals.** Avoid pure grey-on-white sterility (that's what tires the eye) — use warm off-blacks and one confident accent.  
4. **Motion with restraint.** Checking off a task: a single satisfying micro-animation (checkmark draw \+ gentle fade). Nothing else moves unless the user acts. Respect `prefers-reduced-motion`.  
5. **Thumb-first.** Primary actions in the bottom half of the screen; bottom tab bar; floating "＋" button; touch targets ≥ 44px.

### 2.2 Tokens

| Token | Light (default) | Dark |
| :---- | :---- | :---- |
| `--bg` | `#FFFFFF` | `#101312` |
| `--surface` | `#F7F8F7` | `#1A1E1C` |
| `--border` | `#ECEEEC` | `#26302B` |
| `--text` | `#1A1D1B` (warm off-black) | `#F2F4F2` |
| `--text-muted` | `#6C7370` | `#9AA39E` |
| `--accent` | `#1E6B54` (Hamyon deep green family) | `#4CC29A` |
| `--accent-soft` | `#E8F3EF` | `#173A30` |
| `--danger` | `#C4453B` | `#E5766D` |
| `--warning` | `#B98718` | `#E0B34E` |

- **Typography:** Manrope (same as Hamyon) — display 28/32 semibold for the Today card date, 17/24 for body, 13/18 for captions. Tabular numerals for times.  
- **Radius:** 16px cards, 12px inputs, full-round chips.  
- **Icons:** custom thin-stroke SVG set, consistent with Hamyon.  
- **Dark mode:** near-black with a green undertone (not pure `#000`), so both apps feel like one family.

### 2.3 Theme switching

- Three modes in Settings: **Light (default) · Dark · Auto**.  
- Auto follows `prefers-color-scheme`; choice stored in `localStorage` (`reja.theme`); applied before first paint (inline script in `index.html`) to avoid flash.

---

## 3\. Phase 1 — Minimal web MVP (4 features \+ Settings)

**Goal:** a person opens Reja on their phone in the morning, sees today at a glance, adds tasks in seconds, gets reminded on time — and nothing more. Ship small, polish hard.

**Platform:** responsive web app (installable PWA), mobile-first (360–430px is the primary design target), works offline, all data in `localStorage` — same local-first philosophy as Hamyon. Entirely in Uzbek by default.

### 3.1 Feature 1 — Daily Planner (Bugun)

The home screen.

- **Today card (signature element):** date ("Payshanba, 16-iyul"), summary line ("3 vazifa · 1 uchrashuv"), completion progress ring.  
- **Timeline list** below: today's items sorted by time; untimed tasks grouped under "Vaqtsiz".  
- **Quick add:** floating "＋" opens a bottom sheet — title, optional time, optional date, category chip (Ish / Shaxsiy / Oila / Boshqa), optional reminder toggle. Two taps to save.  
- Swipe right \= done, swipe left \= delete (with 5-second undo toast).  
- Overdue items from yesterday roll into today marked "Kechikkan" in `--warning` — never silently lost.  
- Empty state is an invitation, not a void: "Bugun hali reja yo'q. Birinchisini qo'shing ＋".

### 3.2 Feature 2 — Checklist (Ro'yxatlar)

Standalone reusable lists, separate from the day planner.

- Create named lists (e.g. "Bozorlik", "Safar jihozlari", "To'y tayyorgarligi") with an optional emoji/icon.  
- Items: add, check, uncheck, reorder (drag handle), delete.  
- Progress bar per list ("6/10 bajarildi").  
- "Yana boshlash" (reset all checks) — key for recurring lists like weekly shopping.  
- A checklist can be attached to a task ("Bozorlik" task on Saturday opens the Bozorlik list).

### 3.3 Feature 3 — Notifications (Eslatmalar) — in-app, with sound & voice

Phase 1 is **in-app \+ browser push**; Telegram delivery comes in Phase 2 (see §4).

- **Scheduled reminders:** each task with a time can have a reminder — "vaqtida", "5 daqiqa oldin", "30 daqiqa oldin", "1 soat oldin", "1 kun oldin".  
- **In-app notification center:** bell icon with badge; list of fired and upcoming reminders.  
- **Browser notifications** via the Web Notifications API \+ service worker (PWA), with a graceful in-app fallback banner when permission is denied (Web push works reliably on Android/desktop; iOS Safari requires the PWA to be installed to the home screen — detect and show a one-time "Install for reminders" hint on iOS).  
- **Sound \+ voice:** a soft chime, plus optional **spoken reminder** using the Web Speech API (`speechSynthesis`) — "Eslatma: soat uchda stomatolog". Settings: Ovoz — O'chirilgan / Signal / Signal \+ ovozli o'qish. (Voice output in Uzbek falls back to the closest available system voice; full natural Uzbek TTS via Muxlisa API is a Phase 3 upgrade.)  
- **Daily digest (local):** an 8:00 morning notification — "Bugun: 3 vazifa, 1 uchrashuv" — the seed of the Phase 2 Telegram briefing.

### 3.4 Feature 4 — Calendar (Taqvim)

- **Month grid** with dot indicators (accent dot \= has tasks; ring \= all done). Tap a day → that day's list in a bottom sheet; "＋" adds directly to that date.  
- **Week strip** on the Today screen (7 horizontally scrollable day chips) for fast day switching.  
- Uzbek month/weekday names in all four languages; Monday-first weeks.  
- Today is always visually anchored (accent outline).  
- *Not in Phase 1:* external calendar sync (Google/ICS) — Phase 3\.

### 3.5 Settings (Sozlamalar)

- **Ko'rinish / Theme:** Light (default) · Dark · Auto.  
- **Til / Language:** O'zbekcha (lotin) — default · Ўзбекча (кирил) · Türkçe · English.  
  - i18n via a lightweight dictionary layer (JSON per locale; `react-i18next` or a hand-rolled `t()` like Hamyon).  
  - **Latin ↔ Cyrillic is a transliteration pair, not two translations:** maintain one Uzbek source and generate Cyrillic with a transliteration function \+ exception dictionary, so the two scripts never drift apart.  
  - Language stored in `localStorage` (`reja.lang`); dates formatted per locale via `Intl.DateTimeFormat` with custom Uzbek month names.  
- **Eslatmalar:** master toggle, sound choice, voice on/off, daily digest time.  
- **Hafta boshi:** Dushanba (default) / Yakshanba.  
- **Ma'lumotlar:** export/import JSON backup, "Hammasini o'chirish" (with confirmation).  
- **Haqida:** version, link to Hamyon.

### 3.6 Navigation

Bottom tab bar (4 tabs): **Bugun · Taqvim · Ro'yxatlar · Sozlamalar**. Floating "＋" visible on Bugun and Taqvim.

### 3.7 Data model (localStorage, versioned)

interface Task {

  id: string;

  title: string;

  date: string;          // ISO yyyy-mm-dd

  time?: string;         // "HH:mm"

  category: 'ish' | 'shaxsiy' | 'oila' | 'boshqa';

  done: boolean;

  reminderOffsetMin?: number;   // 0 | 5 | 30 | 60 | 1440

  checklistId?: string;

  createdAt: number;

}

interface Checklist {

  id: string;

  name: string;

  icon?: string;

  items: { id: string; text: string; done: boolean; order: number }\[\];

}

interface Settings {

  theme: 'light' | 'dark' | 'auto';       // default 'light'

  lang: 'uz' | 'uz-cyrl' | 'tr' | 'en';   // default 'uz'

  weekStart: 'mon' | 'sun';

  notifications: { enabled: boolean; sound: boolean; voice: boolean;

                   digestTime: string };

  schemaVersion: number;

}

### 3.8 Tech stack

Vite 6 · React 18 · TypeScript (strict) · Vitest · PWA (service worker

+ manifest) — **reuse Hamyon's toolchain and conventions** so both codebases stay familiar. Deploy on Vercel.

### 3.9 Phase 1 acceptance checklist

- [ ] Loads and is fully usable on a 360px-wide phone; installable PWA.  
- [ ] White background, light theme by default; dark & auto work with no flash of wrong theme.  
- [ ] Add a task in ≤ 2 taps \+ typing; swipe to complete/delete.  
- [ ] Checklist create/check/reset works offline.  
- [ ] A reminder set for \+1 min fires: banner \+ chime (+ voice when enabled); browser notification when permission granted.  
- [ ] Calendar dots reflect data; tapping a day shows its tasks.  
- [ ] All four languages switch instantly, including dates.  
- [ ] Data survives reload; JSON export/import round-trips.  
- [ ] Lighthouse (mobile): Performance ≥ 90, Accessibility ≥ 95\.

---

## 4\. Phase 2 — Telegram as the delivery channel \+ natural language

**Goal:** stop depending on the user opening the app. Reja lives where Uzbeks already live — Telegram (\~70–76% penetration, the world's highest). This is the retention weapon.

### 4.1 Telegram bot (@RejaBot)

- **Account linking:** Settings → "Telegramga ulash" → one-tap deep link (`t.me/RejaBot?start=<token>`); bot confirms "Ulandi ✅".  
- **Reminders via Telegram:** every reminder is also (or instead) delivered as a bot message with inline buttons: `✅ Bajarildi · ⏰ +30 daq · 📅 Ertaga`.  
- **Morning briefing:** daily message at the user's chosen time — *"Assalomu alaykum\! Bugun: 3 ta vazifa, 1 uchrashuv. Birinchisi: 09:00 — planyorka."* Evening recap optional: "Bugun 5/6 bajarildi 👏".  
- **Quick capture:** any direct message to the bot becomes a task; **forwarding any message** from another chat saves it as a task with the original text attached ("Xotindan: non olib kel" → task).  
- **Voice capture:** voice messages transcribed (Muxlisa / Whisper) → parsed into tasks.  
- **Commands:** `/bugun` (today's list), `/ertaga`, `/hafta`, `/qoshish`, `/royxat` (checklists inline).

### 4.2 Natural-language input (Uzbek-first)

The Hamyon NLP experience, applied to time:

- "ertaga soat 3da stomatolog" → task, tomorrow 15:00, reminder on.  
- "har juma bozorlik" → weekly recurring task (recurrence engine ships in this phase: kunlik / haftalik / oylik / yillik).  
- Understands: bugun, ertaga, indinga, dushanba–yakshanba, "X kundan keyin", "soat N da", "N:MM da", "yarim soatdan keyin", "kechqurun / ertalab / tushdan keyin", "…gacha" deadlines.  
- Same rules-first architecture as Hamyon: local parser answers instantly; ambiguous phrases fall back to the LLM proxy (`api/ai.ts`, OpenAI easy / Claude complex); offline → local rules only. Works identically in the app's quick-add and in the bot.

### 4.3 Infrastructure change

Telegram requires a backend: Vercel serverless webhook \+ a small DB (Vercel Postgres / Supabase / Turso) storing linked accounts, tasks needing server-side scheduling, and a cron (Vercel Cron) that fires reminders and briefings. The web app keeps working offline; it syncs to the server when a Telegram account is linked (last-write-wins, per-record `updatedAt`).

### 4.4 Also in Phase 2

- Weekly and monthly planner views (Hafta / Oy tabs inside Taqvim).  
- Recurring tasks UI.  
- Search across tasks and checklists.  
- Onboarding (3 screens: add task → get reminded → connect Telegram).

---

## 5\. Phase 3 — Smart secretary (AI, sync, ecosystem)

**Goal:** from "planner" to "kotib" — proactive, context-aware, connected.

- **AI chat assistant (Suhbat):** same hybrid engine as Hamyon — "Bu hafta qachon bo'shman?", "Shanba kuni to'yga tayyorlanish rejasini tuz", "Ertangi kunimni qisqacha aytib ber". Local rules for easy queries, LLM for planning/advice; always answers offline.  
- **Smart suggestions, never auto-reshuffling:** Reja *proposes* ("Bu vazifani 16:00 ga qo'yaymi? Kalendaringiz bo'sh") and waits for approval — the Morgen lesson.  
- **Google Calendar sync** (two-way, OAuth) \+ ICS import/export — for the office crowd; for everyone else Reja *is* their first calendar.  
- **Natural Uzbek voice:** Muxlisa/Tilmoch TTS for spoken reminders and briefings; STT for in-app voice input beyond Web Speech API.  
- **Local context features (our moat):**  
  - Islomiy taqvim overlay: Hijri dates, Ramazon, hayit; ro'za/prayer \-time-aware quiet hours for notifications.  
  - To'y/event planning templates (guest checklist, budget link).  
  - Uzbek public holidays built in.  
- **Hamyon integration:** shared account (phone-number login); cross-app cards — "Ijara: 2 kun qoldi · Hamyonda 1 250 000 so'm ajratilgan"; a bill/payment reminder created in Hamyon appears in Reja and vice versa.  
- **Habits (Odatlar):** simple streak tracker (namoz, sport, kitob), rendered with the same progress-ring language as the Today card.

---

## 6\. Phase 4 — Mobile apps, monetization, expansion

- **Flutter app (Android first, then iOS)** — shared codebase with Hamyon Phase 3; native notifications (FCM) replace web-push limitations, exact-time alarms, home-screen widgets ("Bugun" widget), offline-first with background sync.  
- **Monetization (freemium):**  
  - Free: all Phase 1 features, Telegram reminders, 3 checklists.  
  - **Reja Plus (\~15 000–29 000 so'm/oy, Click/Payme, payable inside Telegram):** unlimited checklists, AI assistant, Google sync, natural voice, family sharing, themes.  
  - B2B later: team/SMB spaces (shops, wedding agencies, repetitors).  
- **Languages:** add Русский (large audience segment) and Qoraqalpoq; the i18n layer from Phase 1 makes this cheap.  
- **Family & sharing:** shared checklists ("Bozorlik" with spouse), assign tasks to family members via Telegram.  
- **Growth:** Telegram channels are the marketing channel (76% reach); referral — "Do'stingizni taklif qiling, 1 oy Plus sovg'a"; IT Park residency (1% tax) and the national **$1M Best AI Startup competition** — an Uzbek-language AI secretary \+ fintech ecosystem is a strong pitch.

---

## 7\. Success metrics

| Phase | North star | Targets |
| :---- | :---- | :---- |
| 1 | D7 retention | ≥ 25% D7; median add-task time \< 8s; ≥ 40% of tasks completed |
| 2 | Telegram-linked users | ≥ 50% of actives linked; briefing open→app rate ≥ 20%; D30 ≥ 15% |
| 3 | Weekly AI interactions | ≥ 2 per active user; Hamyon cross-usage ≥ 20% |
| 4 | Paying users | 3–5% free→Plus conversion; app-store rating ≥ 4.6 |

## 8\. Risks & mitigations

- **Planner churn (2–3 weeks):** Telegram briefing \+ forwarding capture make Reja ambient, not another app to remember. Ship Phase 2 fast.  
- **iOS web-push limits:** PWA install hint in Phase 1; solved fully by Telegram (Phase 2\) and Flutter (Phase 4).  
- **Over-building AI too early:** capture → remind → review first; suggestions only in Phase 3, always opt-in.  
- **Script drift (Latin/Cyrillic):** single Uzbek source \+ programmatic transliteration with an exception list, tested in CI.  
- **Name/trademark:** verify "Reja" availability (domains, Play Store, Telegram handle) before launch.

---

*Reja \+ Hamyon: vaqtingiz va pulingiz — bitta oilada.* 💛📘  
