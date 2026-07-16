# Kotib — Phase 1 Design

**Date:** 2026-07-16
**Status:** Awaiting user review
**Source spec:** [`plan.md`](../../../plan.md)
**Sibling product:** Hamyon (`~/OneDrive/Desktop/Hamyon`, https://hamyon-six.vercel.app)

---

## 1. Goal

Ship Phase 1 of Kotib — an Uzbek-first personal secretary — as a mobile-first web app
deployed on Vercel, wrapped in an Android APK that **updates itself** whenever the web
build is pushed, and that fires **reliable alarms** for reminders.

Phase 1 scope is defined by `plan.md` §3: four features (Daily Planner, Checklists,
Notifications, Calendar) plus Settings. Nothing more.

## 2. Locked decisions

These are recorded here because three of them are one-way doors.

| Decision | Value | Reversible? |
| :-- | :-- | :-- |
| Android `appId` | `com.yordamchi.app` | **No.** Changing it forces every user to uninstall/reinstall. Invisible to users, so a later rename does not require changing it. |
| Baked-in shell URL | `https://yordamchi.vercel.app` | **No.** Changing it strands every installed APK. |
| Display name | `Kotib` | **Yes.** Held in one constant + i18n; renaming to "Yordamchi" or "Reja" later is a one-line change. |
| Update model | Live web shell (Capacitor `server.url`) | Effectively no — it defines what the APK does. |
| Offline cold start | Deferred to a later phase | Yes. Additive; changes nothing else. |

### 2.1 Name risk (carried forward, not resolved)

`plan.md`'s introduction recommends avoiding "Kotib" because KOTIB AI already exists in
Uzbekistan, and §8 lists name/trademark as a launch risk. This is confirmed, not hypothetical:
`kotib.vercel.app` is occupied by a site titled **"Kotib.ai"**.

The user has chosen to proceed as "Kotib" for now and rename later. The design keeps that
rename cheap (§2, display name) and ensures it will **not** require a new APK: the
`appId` and shell URL are invisible to users and stay as-is through any rebrand.

## 3. Architecture — the shell/web split

The APK is a thin Capacitor shell whose only job is to load the live Vercel build:

```ts
// capacitor.config.ts
server: { url: 'https://yordamchi.vercel.app' }
```

This is Hamyon's proven pattern. `git push` → Vercel builds → every installed phone has
the new version on next launch. No reinstall, no Play Store, and it applies to every
user, not just the developer.

The consequence that drives the rest of this design:

| Change type | How it reaches users |
| :-- | :-- |
| UI, features, logic, text, styling, fixes | **Automatic**, next app launch. ~95% of ongoing work. |
| A new native plugin or Android permission | **Requires a new APK**, installed manually. |

### 3.1 Native capabilities baked into the v1 shell

Because native changes are the only thing that breaks the auto-update promise, the v1
shell ships **every plugin we plausibly need**, including ones Phase 1 does not yet use.
Anything omitted now forces an APK redistribution later.

| Plugin | Why it must be in v1 |
| :-- | :-- |
| `@capacitor/local-notifications` | The alarms. Core Phase 1 feature. |
| `@capacitor/app` | Resume events; `REQUIRED_NATIVE_BUILD` check. |
| `@capacitor/preferences` | Native mirror of user data (Hamyon's `nativeStore` pattern). |
| `@capacitor-community/text-to-speech` | Spoken reminders (`plan.md` §3.3). Android WebView's `speechSynthesis` is unreliable/absent, so the web API named in the source spec cannot deliver this. |
| `@capacitor/haptics` | Swipe/complete feedback. Cheap insurance. |
| `@capacitor/share` + `@capacitor/filesystem` | JSON backup export (`plan.md` §3.5). |
| `@capacitor/splash-screen` | Launch polish. |

### 3.2 Native version gating

Port Hamyon's `src/lib/appVersion.ts`: a `REQUIRED_NATIVE_BUILD` constant that the web
build compares against the installed shell's build number via `App.getInfo()`. When a web
release genuinely depends on a newer shell, old installs show a persistent update banner
with a download link rather than silently breaking. Web-only changes never bump it.

Distribution of a new APK is a manual, rare event: GitHub Releases, link surfaced in-app
by the banner.

## 4. Alarms

Native `LocalNotifications` (Android `AlarmManager`), **not** web notifications.

- Web notifications require a service worker and are unreliable in a Capacitor WebView;
  with offline/SW deferred (§5), the web path in `plan.md` §3.3 is not viable at all.
- Native alarms fire with the app closed and **fire offline**, since the OS owns them once
  scheduled.
- **Exact** alarms (`USE_EXACT_ALARM`): a 15:00 reminder firing at 15:07 defeats the
  feature. Android 13+ `POST_NOTIFICATIONS` is requested contextually — when the user
  first sets a reminder — never on cold start.
- Scheduling model: each task with a time + `reminderOffsetMin` schedules one
  notification keyed by task id; edits/deletes cancel and reschedule. The 08:00 daily
  digest is a separate repeating daily notification.
- Sound + optional voice per `plan.md` §3.3, with voice delivered via native TTS (§3.1).
- Android caps pending alarms (~500). To stay well clear, only reminders falling within
  the next 30 days are registered with the OS; on each app launch and resume,
  `notifications.ts` re-syncs that 30-day window against the store. Anything further out
  is scheduled when it enters the window.

## 5. Offline (deferred, by decision)

Precisely what this does and does not mean:

- **Unchanged:** data lives in `localStorage`, never leaves the phone. Kotib stays
  local-first. Alarms still fire with no internet.
- **The gap:** cold start. With no connectivity, the shell cannot load the web build and
  shows nothing.
- **Later fix:** add a service worker that precaches the app shell. Purely additive.

This consciously defers three items from `plan.md` §3.9: "works offline", "installable
PWA", and "checklist works offline". They are deferred, not dropped (§11).

Data durability is still protected: every state save mirrors to native `Preferences`
(Hamyon's `nativeStore.ts`), so tasks survive Android clearing WebView storage.

## 6. Feature scope (from `plan.md` §3)

1. **Bugun (Daily Planner)** — Today card with date, summary line, progress ring; timeline
   list with untimed tasks under "Vaqtsiz"; quick-add bottom sheet; swipe right = done,
   swipe left = delete with 5s undo; overdue rollover marked "Kechikkan"; inviting empty
   state.
2. **Ro'yxatlar (Checklists)** — named lists with optional emoji; add/check/reorder/delete
   items; per-list progress; "Yana boshlash" reset; attachable to a task.
3. **Eslatmalar (Notifications)** — per-task reminder offsets (0/5/30/60/1440 min); in-app
   notification center with badge; sound and optional voice; 08:00 daily digest.
4. **Taqvim (Calendar)** — month grid with dot indicators; tap a day → bottom sheet;
   week strip on Bugun; Monday-first; today anchored.
5. **Sozlamalar (Settings)** — theme (light default/dark/auto); language (uz, uz-cyrl, tr,
   en); reminder toggles + digest time; week start; JSON export/import; delete-all; about.

Navigation: bottom tab bar (Bugun · Taqvim · Ro'yxatlar · Sozlamalar) + floating "＋".

## 7. Data model

Per `plan.md` §3.7 — `Task`, `Checklist`, `Settings`, versioned via `schemaVersion`, all in
`localStorage` under a single namespaced key, mirrored to native `Preferences`.

## 8. Code structure

Mirrors Hamyon file-for-file so both codebases stay familiar. Each module has one purpose
and is testable in isolation.

```
src/
  lib/
    types.ts          store.ts        nativeStore.ts
    dates.ts          i18n.ts         translit.ts
    notifications.ts  appVersion.ts   speech.ts
    __tests__/        (vitest, colocated per Hamyon)
  components/
    Today.tsx  Calendar.tsx  Checklists.tsx  Settings.tsx
    QuickAdd.tsx  TaskRow.tsx  NotificationCenter.tsx
  icons/     Icon.tsx  maps.tsx
  styles/    tokens.css  app.css
```

- **`store.ts`** owns all state transitions and persistence; components never touch
  `localStorage`.
- **`notifications.ts`** is the only module aware of Capacitor's notification bridge, so
  the scheduling rules stay unit-testable with the bridge injected (Hamyon's
  `nativeStore.ts` uses this injection pattern already).
- **`translit.ts`** implements Latin→Cyrillic from a single Uzbek source plus an exception
  dictionary, with a CI test — directly addressing the script-drift risk in `plan.md` §8.
  Cyrillic is never maintained as a second translation.

## 9. Design system

Per `plan.md` §2: light-first, white canvas, Manrope, 16px card radius, the Today card as
the single hero moment, restrained motion respecting `prefers-reduced-motion`. Tokens
land in `src/styles/tokens.css` exactly as tabulated in §2.2. Theme applied before first
paint via an inline script in `index.html` to prevent flash; stored in `localStorage`
(`kotib.theme`).

## 10. Delivery

- **Repo topology:** `Desktop/Kotib` currently sits *inside* the `~/OneDrive` git repo.
  Kotib gets its own `git init` and pushes to `github.com/davronbek-malikov/Kotib`
  (exists, empty, public). The parent OneDrive repo will see it as an embedded repo; we
  do not commit the parent.
- **Vercel:** project linked to the GitHub repo so every push to `main` auto-deploys —
  this *is* the update engine. Alias `yordamchi.vercel.app` assigned explicitly rather
  than relying on Vercel's generated suffix.
- **Two front doors, one build.** The same Vercel deployment serves both the browser app
  at `yordamchi.vercel.app` and the APK shell, so a single push updates both. Phase 1 is
  usable on web and Android from day one (§10.1).
- **Signing:** a new release keystore for Kotib, generated locally, **git-ignored**
  (mirrors Hamyon's `android/key.properties` layout).
- **APK:** built locally via Gradle, attached to a GitHub Release. Rebuilt only when §3.1
  native capability changes — expected to be rare.

### 10.1 Web / Android parity

One codebase serves both targets, so every native call sits behind a capability check
(`Capacitor.isNativePlatform()`, following Hamyon's `nativeStore.ts`). The web build must
never assume a native bridge exists. Feature-by-feature:

| Feature | Android (APK) | Web browser |
| :-- | :-- | :-- |
| All four Phase 1 features + Settings | Full | **Full — identical** |
| Data persistence | `localStorage` + native `Preferences` mirror | `localStorage` only |
| Reminders, app open | Native notification | In-app banner + chime |
| Reminders, app closed | **Native exact alarm** | Not delivered (needs the deferred service worker) |
| Spoken reminders | Native TTS | `speechSynthesis` where the browser supports it |
| Haptics on swipe | Native | Silently skipped |
| JSON export | Native share sheet | Browser file download |

The honest summary: **web gets every feature; Android additionally gets alarms that fire
with the app closed.** That closed-app alarm is the one thing the browser cannot do here,
and it is precisely why the APK exists. No feature is Android-only otherwise, and no
screen is degraded on web.

## 11. Deviations from `plan.md`

| `plan.md` says | This design | Why |
| :-- | :-- | :-- |
| §3.3 Web Notifications API + service worker | Native `LocalNotifications` | Web push is unreliable in a Capacitor WebView and needs the deferred SW. |
| §3.3 Web Speech API for voice | Native TTS plugin | Android WebView `speechSynthesis` is unreliable/absent. |
| §3.9 "works offline", "installable PWA" | Deferred | User decision; additive later (§5). |
| §7 "Avoid Kotib", use "Reja" | Ship as Kotib | User decision; rename kept cheap and APK-safe (§2.1). |

## 12. Testing

Vitest, per Hamyon's convention. Logic modules are covered; components are not
unit-tested in Phase 1.

- `store.ts` — task CRUD, done/undo, overdue rollover, schema migration.
- `dates.ts` — Uzbek month/weekday names, Monday-first weeks, `Intl` formatting.
- `translit.ts` — Latin↔Cyrillic incl. the exception dictionary (guards script drift).
- `notifications.ts` — offset→fire-time math, cancel/reschedule on edit, digest, with an
  injected bridge.
- `i18n.ts` — every key present in every locale.
- `nativeStore.ts` — mirror/restore/`shouldRestore` guard.

## 13. Acceptance criteria

Adapted from `plan.md` §3.9, minus the deferred offline items:

- [ ] Fully usable on a 360px-wide phone.
- [ ] White background, light theme default; dark & auto with no flash of wrong theme.
- [ ] Add a task in ≤ 2 taps + typing; swipe to complete/delete with undo.
- [ ] A reminder set for +1 min fires as a **native Android notification** with the app
      closed: chime + voice when enabled.
- [ ] 08:00 daily digest fires.
- [ ] Calendar dots reflect data; tapping a day shows its tasks.
- [ ] All four languages switch instantly, including dates.
- [ ] Data survives reload and app restart; JSON export/import round-trips.
- [ ] Pushing a web change to `main` reaches an installed APK with no reinstall
      (**the core requirement — verified end-to-end on a real device**).
- [ ] Lighthouse (mobile): Performance ≥ 90, Accessibility ≥ 95.

## 14. Out of scope (Phase 2+)

Telegram bot and delivery, natural-language Uzbek parsing, recurrence, search, onboarding,
AI chat, Google Calendar sync, Hamyon account integration, habits, Flutter apps,
monetization, service worker / offline cold start.
