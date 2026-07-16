# Kotib

**Aqlli shaxsiy kotib** — Uzbek-first personal secretary. Plan your day, keep
lists, never miss a reminder. Sister product to
[Hamyon](https://hamyon-six.vercel.app), sharing its design language and
toolchain.

- **Web:** https://yordamchi.vercel.app
- **Android:** [latest APK](https://github.com/davronbek-malikov/Kotib/releases/latest)

## Phase 1 features

| | |
| :-- | :-- |
| **Bugun** | Today card with progress ring, timeline, week strip, quick add, swipe to complete/delete with 5s undo, overdue rollover ("Kechikkan") |
| **Taqvim** | Month grid with dot indicators, tap a day to see and add tasks |
| **Ro'yxatlar** | Reusable checklists with progress and "Yana boshlash" reset |
| **Eslatmalar** | Exact-time reminders (0/5/30/60 min, 1 day before), chime, spoken reminders, 08:00 daily digest |
| **Sozlamalar** | Light/dark/auto, 4 languages, week start, JSON backup |

Languages: O'zbekcha (lotin), Ўзбекча (кирил), Türkçe, English. Cyrillic is
**generated** from the Latin source by `src/lib/translit.ts` — never maintained
as a second dictionary, so the two scripts cannot drift apart.

## How updates reach users

The APK is a thin Capacitor shell that loads the live web build. It bundles **no
web assets at all** — only `server.url`. So:

> **Deploy the web build → every installed phone has the new version on next
> launch. No reinstall, no app store, for every user.**

The one exception is a **native** change — a new Capacitor plugin or Android
permission. Those need a new APK:

1. Bump `REQUIRED_NATIVE_BUILD` in [`src/lib/appVersion.ts`](src/lib/appVersion.ts).
2. Bump `versionCode`/`versionName` in [`android/app/build.gradle`](android/app/build.gradle).
3. Build a new APK and attach it to a GitHub Release.

Old shells then show a red update banner linking to the release until the user
installs it. **Web-only changes need none of this** — which is why v1 already
ships every plugin we plausibly need (notifications, TTS, preferences, haptics,
share, filesystem, splash), including ones Phase 1 doesn't use yet.

### Deploying

```bash
npm run build
npx vercel --prod
npx vercel alias set <deployment-url> yordamchi.vercel.app
```

Connecting the GitHub repo in the Vercel dashboard (Settings → Git) makes every
push to `main` deploy automatically, removing the manual step above.

## Permanent values — do not change

| Value | Where | Why it's permanent |
| :-- | :-- | :-- |
| `com.yordamchi.app` | `capacitor.config.ts` | Changing the appId forces every user to uninstall and reinstall. |
| `https://yordamchi.vercel.app` | `capacitor.config.ts` | Installed APKs load this URL and nothing else. Changing it strands them. |

Neither is visible to users, so **a rebrand does not require touching either**.
The display name lives only in [`src/lib/branding.ts`](src/lib/branding.ts) —
renaming is a one-line change.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # vitest — 87 tests
npm run build    # typecheck + production build
```

## Build the APK

Requires `android/key.properties` and `android/kotib-release.keystore`. Both are
gitignored. **Keep a backup of the keystore** — losing it means you can never
ship a signed update to existing installs; users would have to uninstall first.

```bash
npm run build:android
cd android && ./gradlew assembleRelease
# -> android/app/build/outputs/apk/release/app-release.apk
```

## Architecture

`src/lib` holds all logic and is unit-tested; `src/components` renders it and
never touches `localStorage`. Every native call sits behind
`Capacitor.isNativePlatform()`, so the same build runs in a browser with no
bridge.

**Web vs Android:** the browser gets every feature. Android additionally gets
alarms that fire with the app closed — the one thing a browser cannot do here,
and the reason the APK exists.

Data lives in `localStorage`, mirrored to native `Preferences` so it survives
Android clearing WebView storage. Nothing leaves the phone; there is no server
and no database.

See the [design doc](docs/superpowers/specs/2026-07-16-kotib-phase1-design.md)
and [implementation plan](docs/superpowers/plans/2026-07-16-kotib-phase1.md).

## Roadmap

Phase 2 is the retention play: a Telegram bot for reminders and morning
briefings, plus Uzbek natural-language input ("ertaga soat 3da stomatolog").
Phases 3–4 add the AI assistant, Google Calendar sync, Hamyon integration, and
native apps. See [`plan.md`](plan.md).
