import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Calendar } from './components/Calendar';
import { Chat } from './components/Chat';
import { Checklists } from './components/Checklists';
import { Settings } from './components/Settings';
import { TabBar, type Tab } from './components/TabBar';
import { Today } from './components/Today';
import { Icon } from './icons/Icon';
import type { ChatTurn } from './lib/ai/client';
import { announcementText, pendingAnnouncement } from './lib/announcement';
import { APK_URL, nativeUpdateNeeded } from './lib/appVersion';
import { createBridge, isNative } from './lib/bridge';
import { playChime } from './lib/chime';
import { celebrateFeedback, tapFeedback } from './lib/haptics';
import { todayISO } from './lib/dates';
import { setLang, t } from './lib/i18n';
import { setIconSkin } from './icons/Icon';
import { mirrorToNative, restoreFromNative, shouldRestore } from './lib/nativeStore';
import { syncReminders, type ScheduledReminder } from './lib/notifications';
import { speak } from './lib/speech';
import { loadState, markAnnouncementSeen, rollOverdue, saveState } from './lib/store';
import type { AppState } from './lib/types';

function applyTheme(state: AppState): void {
  const { theme, skin, font, doneStyle } = state.settings;
  const dark =
    theme === 'dark' ||
    (theme === 'auto' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  const root = document.documentElement;
  root.setAttribute('data-theme', dark ? 'dark' : 'light');
  root.setAttribute('data-skin', skin);
  root.setAttribute('data-font', font);
  root.setAttribute('data-done', doneStyle);
}

export default function App() {
  // Overdue tasks roll onto today at launch, so nothing is silently lost
  // (plan.md §3.1).
  const [state, setState] = useState<AppState>(() =>
    rollOverdue(loadState(), todayISO()),
  );
  const [tab, setTab] = useState<Tab>('today');
  /** Where the gear was pressed from, so Settings can return there. */
  const [prevTab, setPrevTab] = useState<Tab>('today');
  const [banner, setBanner] = useState<ScheduledReminder | null>(null);
  const [updateNeeded, setUpdateNeeded] = useState(false);
  // Held here, not in Chat: switching tabs unmounts the screen, and the
  // conversation must survive a glance at the calendar.
  const [turns, setTurns] = useState<ChatTurn[]>([]);

  // i18n reads a module-level active locale (Hamyon's pattern), so keep it in
  // sync before children render.
  // i18n and the icon set both read a module-level active value (Hamyon's
  // pattern), so keep them in sync before children render.
  setLang(state.settings.lang);
  setIconSkin(state.settings.skin);

  // Kept in a ref so the bridge identity never changes across renders.
  const settingsRef = useRef(state.settings);
  settingsRef.current = state.settings;

  const onFire = useCallback((reminder: ScheduledReminder) => {
    setBanner(reminder);
    const { sound, voice } = settingsRef.current.notifications;
    if (sound) playChime();
    if (voice) void speak(reminder.body);
  }, []);

  const bridge = useMemo(() => createBridge(onFire), [onFire]);

  // A brief, self-dismissing "well done" when a task is completed. 'all' is the
  // bigger moment — the whole day cleared.
  const [cheer, setCheer] = useState<'one' | 'all' | null>(null);
  const celebrate = useCallback((kind: 'one' | 'all') => {
    setCheer(kind);
    if (kind === 'all') celebrateFeedback();
    else tapFeedback();
  }, []);

  useEffect(() => {
    if (!cheer) return;
    const timer = setTimeout(() => setCheer(null), cheer === 'all' ? 2600 : 1500);
    return () => clearTimeout(timer);
  }, [cheer]);

  // Restore the native mirror only into an install with no data of its own.
  useEffect(() => {
    if (!isNative()) return;
    void (async () => {
      const backup = await restoreFromNative();
      if (backup) setState((cur) => (shouldRestore(cur) ? backup : cur));
    })();
  }, []);

  useEffect(() => {
    saveState(state);
    mirrorToNative(state);
    applyTheme(state);
  }, [state]);

  // Re-sync the 30-day horizon whenever anything changes. Cheap, and it means
  // an edited or deleted task can never leave a stale alarm behind.
  useEffect(() => {
    void syncReminders(state, bridge);
  }, [state, bridge]);

  // 'auto' must follow the OS while the app is open.
  useEffect(() => {
    if (state.settings.theme !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme(state);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [state]);

  // On resume, roll overdue tasks; the effect above re-syncs the alarms.
  useEffect(() => {
    if (!isNative()) return;
    const handle = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) return;
      setState((cur) => rollOverdue(cur, todayISO()));
    });
    return () => { void handle.then((h) => h.remove()); };
  }, []);

  useEffect(() => {
    void nativeUpdateNeeded().then(setUpdateNeeded);
  }, []);

  /**
   * Broadcast delivery. There is no push service, so an announcement shipped
   * in the web build is how a message reaches every user: they load the live
   * build on open, see it once, and the id is recorded so it never repeats.
   */
  const announcement = pendingAnnouncement(state);
  useEffect(() => {
    if (!announcement) return;
    if (state.settings.notifications.sound) playChime();
  }, [announcement?.id]);

  const screen = useMemo(() => {
    switch (tab) {
      case 'today':    return <Today state={state} setState={setState} onCelebrate={celebrate} />;
      case 'calendar': return <Calendar state={state} setState={setState} onComplete={() => celebrate('one')} />;
      case 'lists':    return <Checklists state={state} setState={setState} />;
      case 'chat':     return <Chat state={state} turns={turns} setTurns={setTurns} />;
      case 'settings':
        return <Settings state={state} setState={setState} onBack={() => setTab(prevTab)} />;
    }
    // celebrate is stable (useCallback), so it need not be a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, state, turns, prevTab]);

  return (
    <>
      {updateNeeded && (
        <a className="updatebar" href={APK_URL} target="_blank" rel="noreferrer">
          {t('update.needed')} — {t('update.action')}
        </a>
      )}

      {announcement && (
        <div className="announce" role="status">
          <div className="announce__text">
            <strong>{announcementText(announcement).title}</strong>
            <span>{announcementText(announcement).body}</span>
          </div>
          <button
            className="announce__close"
            onClick={() => setState(markAnnouncementSeen(state, announcement.id))}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>
      )}

      {banner && (
        <button className="firebanner" onClick={() => setBanner(null)}>
          <strong>{banner.title}</strong>
          <span>{banner.body}</span>
        </button>
      )}

      {/* Settings left the tab bar for the assistant, so it lives up here —
          the same gear Hamyon uses. Settings has its own back button, so the
          gear is hidden while it is open. */}
      {tab !== 'settings' && (
        <header className="topbar">
          <button
            className="gear"
            onClick={() => {
              setPrevTab(tab);
              setTab('settings');
            }}
            aria-label={t('nav.settings')}
          >
            <Icon name="settings" size={20} />
          </button>
        </header>
      )}

      {cheer && (
        <div className={`cheer cheer--${cheer}`} role="status">
          {t(cheer === 'all' ? 'celebrate.all' : 'celebrate.one')}
        </div>
      )}

      {screen}
      <TabBar active={tab} onChange={setTab} />
    </>
  );
}
