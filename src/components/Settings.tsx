import { useRef, useState } from 'react';
import { APP_NAME } from '../lib/branding';
import { t } from '../lib/i18n';
import {
  createInitialState, exportJSON, importJSON, setLanguage,
  setNotifications, setSkin, setTaskMode, setTheme, setWeekStart,
} from '../lib/store';
import type {
  AppState, Language, Skin, TaskMode, ThemeMode, WeekStart,
} from '../lib/types';

const THEMES: ThemeMode[] = ['light', 'dark', 'auto'];
const SKINS: Skin[] = ['klassik', 'registon'];
const TASK_MODES: TaskMode[] = ['simple', 'advanced'];
const WEEK_STARTS: WeekStart[] = ['mon', 'sun'];
/** Uzbek Latin first — it is the default (plan.md §3.5). */
const LANGS: { id: Language; label: string }[] = [
  { id: 'uz',      label: "O'zbekcha" },
  { id: 'uz-cyrl', label: 'Ўзбекча' },
  { id: 'tr',      label: 'Türkçe' },
  { id: 'en',      label: 'English' },
];

interface Props {
  state: AppState;
  setState: (s: AppState) => void;
}

export function Settings({ state, setState }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const { notifications } = state.settings;

  function download() {
    const blob = new Blob([exportJSON(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kotib-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function upload(file: File) {
    const imported = importJSON(await file.text());
    // A bad file must never destroy existing data.
    if (!imported) {
      setError(t('set.importFailed'));
      return;
    }
    setError('');
    setState(imported);
  }

  return (
    <section className="screen">
      <h1 className="screen__title">{t('nav.settings')}</h1>

      <h2 className="section-label">{t('set.appearance')}</h2>
      <div className="chips">
        {THEMES.map((theme) => (
          <button
            key={theme}
            className={`chip${state.settings.theme === theme ? ' is-on' : ''}`}
            onClick={() => setState(setTheme(state, theme))}
          >
            {t(`set.theme.${theme}`)}
          </button>
        ))}
      </div>

      <h2 className="section-label">{t('set.skin')}</h2>
      <div className="chips">
        {SKINS.map((skin) => (
          <button
            key={skin}
            className={`chip${state.settings.skin === skin ? ' is-on' : ''}`}
            onClick={() => setState(setSkin(state, skin))}
          >
            {t(`set.skin.${skin}`)}
          </button>
        ))}
      </div>
      <p className="hint">{t('set.skin.hint')}</p>

      <h2 className="section-label">{t('set.taskMode')}</h2>
      <div className="chips">
        {TASK_MODES.map((mode) => (
          <button
            key={mode}
            className={`chip${state.settings.taskMode === mode ? ' is-on' : ''}`}
            onClick={() => setState(setTaskMode(state, mode))}
          >
            {t(`set.taskMode.${mode}`)}
          </button>
        ))}
      </div>
      <p className="hint">{t('set.taskMode.hint')}</p>

      <h2 className="section-label">{t('set.language')}</h2>
      <div className="chips">
        {LANGS.map((lang) => (
          <button
            key={lang.id}
            className={`chip${state.settings.lang === lang.id ? ' is-on' : ''}`}
            onClick={() => setState(setLanguage(state, lang.id))}
          >
            {lang.label}
          </button>
        ))}
      </div>

      <h2 className="section-label">{t('set.notifications')}</h2>
      <label className="row">
        <span>{t('set.notif.enabled')}</span>
        <input
          type="checkbox" checked={notifications.enabled}
          onChange={(e) => setState(setNotifications(state, { enabled: e.target.checked }))}
        />
      </label>
      <label className="row">
        <span>{t('set.notif.sound')}</span>
        <input
          type="checkbox" checked={notifications.sound}
          onChange={(e) => setState(setNotifications(state, { sound: e.target.checked }))}
        />
      </label>
      <label className="row">
        <span>{t('set.notif.voice')}</span>
        <input
          type="checkbox" checked={notifications.voice}
          onChange={(e) => setState(setNotifications(state, { voice: e.target.checked }))}
        />
      </label>
      <label className="row">
        <span>{t('set.notif.digest')}</span>
        <input
          className="input input--inline" type="time" value={notifications.digestTime}
          onChange={(e) => setState(setNotifications(state, { digestTime: e.target.value }))}
        />
      </label>

      <h2 className="section-label">{t('set.weekStart')}</h2>
      <div className="chips">
        {WEEK_STARTS.map((w) => (
          <button
            key={w}
            className={`chip${state.settings.weekStart === w ? ' is-on' : ''}`}
            onClick={() => setState(setWeekStart(state, w))}
          >
            {t(`set.weekStart.${w}`)}
          </button>
        ))}
      </div>

      <h2 className="section-label">{t('set.data')}</h2>
      <button className="btn btn--ghost" onClick={download}>{t('set.export')}</button>
      <button className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
        {t('set.import')}
      </button>
      <input
        ref={fileRef} type="file" accept="application/json" hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = '';
        }}
      />
      {error && <p className="error">{error}</p>}

      <button
        className="btn btn--danger"
        onClick={() => {
          if (confirm(t('set.deleteConfirm'))) setState(createInitialState());
        }}
      >
        {t('set.deleteAll')}
      </button>

      <h2 className="section-label">{t('set.about')}</h2>
      <p className="card__meta">
        {APP_NAME} · {t('set.version')} {__APP_VERSION__}
      </p>
      <p className="card__meta">
        <a className="link" href="https://hamyon-six.vercel.app" target="_blank" rel="noreferrer">
          Hamyon
        </a>
      </p>
    </section>
  );
}
