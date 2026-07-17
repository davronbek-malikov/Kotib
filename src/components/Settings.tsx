import { useRef, useState } from 'react';
import { APP_NAME } from '../lib/branding';
import { t } from '../lib/i18n';
import { Icon, type IconName } from '../icons/Icon';
import { OptionList, SettingsRow, type Tone } from './SettingsRow';
import {
  createInitialState, exportJSON, importJSON, setDoneStyle, setFont,
  setLanguage, setNotifications, setSkin, setTaskMode, setTheme, setWeekStart,
} from '../lib/store';
import type {
  AppState, DoneStyle, FontChoice, Language, Skin, TaskMode, ThemeMode, WeekStart,
} from '../lib/types';

/** Uzbek Latin first — it is the default (plan.md §3.5). */
const LANGS: { id: Language; label: string }[] = [
  { id: 'uz',      label: "O'zbekcha" },
  { id: 'uz-cyrl', label: 'Ўзбекча' },
  { id: 'tr',      label: 'Türkçe' },
  { id: 'en',      label: 'English' },
];

/**
 * Which detail page is open; 'index' is the list itself. Each name doubles as
 * the i18n key for its title (`set.<page>`), so a page without a string would
 * render its own key — the i18n test guards that.
 */
type Page =
  | 'index' | 'theme' | 'skin' | 'font' | 'taskMode'
  | 'doneStyle' | 'weekStart' | 'notifications' | 'language' | 'data' | 'about';

type IndexPage = Exclude<Page, 'index'>;

interface SettingsItem {
  page: IndexPage;
  icon: IconName;
  tone: Tone;
  title: string;
  value?: string;
}

interface Props {
  state: AppState;
  setState: (s: AppState) => void;
  /** Returns to whichever tab the gear was pressed from. */
  onBack: () => void;
}

export function Settings({ state, setState, onBack }: Props) {
  const [page, setPage] = useState<Page>('index');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const { settings } = state;
  const { notifications } = settings;

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

  /** Summary of the reminder settings, for the index row. */
  function notifValue(): string {
    if (!notifications.enabled) return t('set.notif.off');
    const parts = [t('set.notif.on')];
    if (notifications.sound) parts.push(t('set.notif.sound'));
    if (notifications.voice) parts.push(t('set.notif.voice'));
    return parts.join(' · ');
  }

  if (page !== 'index') {
    return (
      <section className="screen sset">
        <header className="sdetail__head">
          <button className="sback" onClick={() => setPage('index')} aria-label={t('common.back')}>
            <Icon name="back" size={20} />
          </button>
          <h1 className="sdetail__title">{t(`set.${page}`)}</h1>
        </header>

        {page === 'theme' && (
          <OptionList<ThemeMode>
            selected={settings.theme}
            onSelect={(v) => setState(setTheme(state, v))}
            options={(['light', 'dark', 'auto'] as ThemeMode[]).map((id) => ({
              id, label: t(`set.theme.${id}`),
            }))}
          />
        )}

        {page === 'skin' && (
          <>
            <OptionList<Skin>
              selected={settings.skin}
              onSelect={(v) => setState(setSkin(state, v))}
              options={(['klassik', 'registon'] as Skin[]).map((id) => ({
                id, label: t(`set.skin.${id}`),
              }))}
            />
            <p className="hint">{t('set.skin.hint')}</p>
          </>
        )}

        {page === 'font' && (
          <>
            <OptionList<FontChoice>
              selected={settings.font}
              onSelect={(v) => setState(setFont(state, v))}
              options={(['manrope', 'qolyozma'] as FontChoice[]).map((id) => ({
                id, label: t(`set.font.${id}`),
              }))}
            />
            <p className="hint">{t('set.font.hint')}</p>
          </>
        )}

        {page === 'taskMode' && (
          <>
            <OptionList<TaskMode>
              selected={settings.taskMode}
              onSelect={(v) => setState(setTaskMode(state, v))}
              options={(['simple', 'advanced'] as TaskMode[]).map((id) => ({
                id, label: t(`set.taskMode.${id}`),
              }))}
            />
            <p className="hint">{t('set.taskMode.hint')}</p>
          </>
        )}

        {page === 'doneStyle' && (
          <>
            <OptionList<DoneStyle>
              selected={settings.doneStyle}
              onSelect={(v) => setState(setDoneStyle(state, v))}
              options={(['chiziq', 'marker', 'xira'] as DoneStyle[]).map((id) => ({
                id, label: t(`set.doneStyle.${id}`),
              }))}
            />
            {/* Show the choice rather than describe it. */}
            <ul className="tasklist donepreview">
              <li className="taskrow is-done">
                <span className="taskrow__body">
                  <span className="taskrow__title">{t('set.doneStyle.preview')}</span>
                </span>
              </li>
            </ul>
            <p className="hint">{t('set.doneStyle.hint')}</p>
          </>
        )}

        {page === 'weekStart' && (
          <OptionList<WeekStart>
            selected={settings.weekStart}
            onSelect={(v) => setState(setWeekStart(state, v))}
            options={(['mon', 'sun'] as WeekStart[]).map((id) => ({
              id, label: t(`set.weekStart.${id}`),
            }))}
          />
        )}

        {page === 'language' && (
          <OptionList<Language>
            selected={settings.lang}
            onSelect={(v) => setState(setLanguage(state, v))}
            options={LANGS}
          />
        )}

        {page === 'notifications' && (
          <div className="sgroup">
            <label className="orow">
              <span className="srow__title">{t('set.notif.enabled')}</span>
              <input
                type="checkbox" checked={notifications.enabled}
                onChange={(e) => setState(setNotifications(state, { enabled: e.target.checked }))}
              />
            </label>
            <label className="orow">
              <span className="srow__title">{t('set.notif.sound')}</span>
              <input
                type="checkbox" checked={notifications.sound}
                onChange={(e) => setState(setNotifications(state, { sound: e.target.checked }))}
              />
            </label>
            <label className="orow">
              <span className="srow__title">{t('set.notif.voice')}</span>
              <input
                type="checkbox" checked={notifications.voice}
                onChange={(e) => setState(setNotifications(state, { voice: e.target.checked }))}
              />
            </label>
            <label className="orow">
              <span className="srow__title">{t('set.notif.digest')}</span>
              <input
                className="input input--inline" type="time" value={notifications.digestTime}
                onChange={(e) => setState(setNotifications(state, { digestTime: e.target.value }))}
              />
            </label>
          </div>
        )}

        {page === 'data' && (
          <>
            <div className="sgroup">
              <button className="orow" onClick={download}>
                <span className="srow__title">{t('set.export')}</span>
              </button>
              <button className="orow" onClick={() => fileRef.current?.click()}>
                <span className="srow__title">{t('set.import')}</span>
              </button>
              <button
                className="orow orow--danger"
                onClick={() => {
                  if (confirm(t('set.deleteConfirm'))) {
                    setState(createInitialState());
                    setPage('index');
                  }
                }}
              >
                <span className="srow__title">{t('set.deleteAll')}</span>
              </button>
            </div>
            <input
              ref={fileRef} type="file" accept="application/json" hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
                e.target.value = '';
              }}
            />
            {error && <p className="error">{error}</p>}
          </>
        )}

        {page === 'about' && (
          <>
            <div className="sgroup">
              <div className="orow">
                <span className="srow__text">
                  <span className="srow__title">{APP_NAME}</span>
                  <span className="srow__value">{t('set.version')} {__APP_VERSION__}</span>
                </span>
              </div>
              <a className="orow" href="https://hamyon-six.vercel.app" target="_blank" rel="noreferrer">
                <span className="srow__text">
                  <span className="srow__title">Hamyon</span>
                  <span className="srow__value">{t('set.about.hamyon')}</span>
                </span>
              </a>
            </div>

            {/* Google Play requires a reachable privacy policy; both live as
                static pages so they are linkable from the store listing too. */}
            <div className="sgroup">
              <a className="orow" href="/privacy.html" target="_blank" rel="noreferrer">
                <span className="srow__title">{t('set.privacy')}</span>
              </a>
              <a className="orow" href="/terms.html" target="_blank" rel="noreferrer">
                <span className="srow__title">{t('set.terms')}</span>
              </a>
            </div>
          </>
        )}
      </section>
    );
  }

  const groups: SettingsItem[][] = [
    [
      {
        page: 'theme', icon: 'palette', tone: 'violet', title: t('set.theme'),
        value: t(`set.theme.${settings.theme}`),
      },
      {
        page: 'skin', icon: 'palette', tone: 'pink', title: t('set.skin'),
        value: t(`set.skin.${settings.skin}`),
      },
      {
        page: 'font', icon: 'text', tone: 'blue', title: t('set.font'),
        value: t(`set.font.${settings.font}`),
      },
    ],
    [
      {
        page: 'taskMode', icon: 'lists', tone: 'green', title: t('set.taskMode'),
        value: t(`set.taskMode.${settings.taskMode}`),
      },
      {
        page: 'doneStyle', icon: 'check', tone: 'teal', title: t('set.doneStyle'),
        value: t(`set.doneStyle.${settings.doneStyle}`),
      },
      {
        page: 'weekStart', icon: 'calendar', tone: 'blue', title: t('set.weekStart'),
        value: t(`set.weekStart.${settings.weekStart}`),
      },
    ],
    [
      {
        page: 'notifications', icon: 'bell', tone: 'orange', title: t('set.notifications'),
        value: notifValue(),
      },
      {
        page: 'language', icon: 'globe', tone: 'teal', title: t('set.language'),
        value: LANGS.find((l) => l.id === settings.lang)?.label,
      },
    ],
    [
      {
        page: 'data', icon: 'data', tone: 'grey', title: t('set.data'),
        value: t('set.data.value'),
      },
      {
        page: 'about', icon: 'info', tone: 'grey', title: t('set.about'),
        value: `${t('set.version')} ${__APP_VERSION__}`,
      },
    ],
  ];
  const needle = query.trim().toLocaleLowerCase();
  const visibleGroups = needle
    ? groups
        .map((group) =>
          group.filter((item) =>
            `${item.title} ${item.value ?? ''}`.toLocaleLowerCase().includes(needle),
          ),
        )
        .filter((group) => group.length > 0)
    : groups;

  return (
    <section className="screen sset">
      <header className="sset__head">
        {/* The gear can be pressed from any tab, so leaving must return there
            rather than dumping the user on the home screen. */}
        <button className="sback" onClick={onBack} aria-label={t('common.back')}>
          <Icon name="back" size={20} />
        </button>
        <h1 className="screen__title sset__title">{t('nav.settings')}</h1>
        <button
          className={`sset__search${searchOpen ? ' is-on' : ''}`}
          onClick={() => {
            setSearchOpen((open) => {
              if (open) setQuery('');
              return !open;
            });
          }}
          aria-label={t('set.search')}
          aria-pressed={searchOpen}
        >
          <Icon name="search" size={25} />
        </button>
      </header>

      {searchOpen && (
        <input
          className="input sset__searchbox"
          type="search"
          autoFocus
          placeholder={t('set.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {visibleGroups.map((group, groupIndex) => (
        <div className="sgroup" key={groupIndex}>
          {group.map((item) => (
            <SettingsRow
              key={item.page}
              icon={item.icon}
              tone={item.tone}
              title={item.title}
              value={item.value}
              onClick={() => setPage(item.page)}
            />
          ))}
        </div>
      ))}

      {visibleGroups.length === 0 && <p className="empty">{t('set.search.empty')}</p>}
    </section>
  );
}
