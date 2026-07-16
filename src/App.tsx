import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Calendar } from './components/Calendar';
import { Checklists } from './components/Checklists';
import { Settings } from './components/Settings';
import { TabBar, type Tab } from './components/TabBar';
import { Today } from './components/Today';
import { APK_URL, nativeUpdateNeeded } from './lib/appVersion';
import { createBridge, isNative } from './lib/bridge';
import { playChime } from './lib/chime';
import { todayISO } from './lib/dates';
import { setLang, t } from './lib/i18n';
import { mirrorToNative, restoreFromNative, shouldRestore } from './lib/nativeStore';
import { syncReminders, type ScheduledReminder } from './lib/notifications';
import { speak } from './lib/speech';
import { loadState, rollOverdue, saveState } from './lib/store';
import type { AppState } from './lib/types';

function applyTheme(state: AppState): void {
  const { theme } = state.settings;
  const dark =
    theme === 'dark' ||
    (theme === 'auto' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

export default function App() {
  // Overdue tasks roll onto today at launch, so nothing is silently lost
  // (plan.md §3.1).
  const [state, setState] = useState<AppState>(() =>
    rollOverdue(loadState(), todayISO()),
  );
  const [tab, setTab] = useState<Tab>('today');
  const [banner, setBanner] = useState<ScheduledReminder | null>(null);
  const [updateNeeded, setUpdateNeeded] = useState(false);

  // i18n reads a module-level active locale (Hamyon's pattern), so keep it in
  // sync before children render.
  setLang(state.settings.lang);

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

  const screen = useMemo(() => {
    switch (tab) {
      case 'today':    return <Today state={state} setState={setState} />;
      case 'calendar': return <Calendar state={state} setState={setState} />;
      case 'lists':    return <Checklists state={state} setState={setState} />;
      case 'settings': return <Settings state={state} setState={setState} />;
    }
  }, [tab, state]);

  return (
    <>
      {updateNeeded && (
        <a className="updatebar" href={APK_URL} target="_blank" rel="noreferrer">
          {t('update.needed')} — {t('update.action')}
        </a>
      )}

      {banner && (
        <button className="firebanner" onClick={() => setBanner(null)}>
          <strong>{banner.title}</strong>
          <span>{banner.body}</span>
        </button>
      )}

      {screen}
      <TabBar active={tab} onChange={setTab} />
    </>
  );
}
