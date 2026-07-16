import { useState } from 'react';
import { requestNotificationPermission } from '../lib/bridge';
import { t } from '../lib/i18n';
import type { NewTask } from '../lib/store';
import type { Category, ReminderOffset } from '../lib/types';

const CATEGORIES: Category[] = ['ish', 'shaxsiy', 'oila', 'boshqa'];
const OFFSETS: (ReminderOffset | 'none')[] = ['none', 0, 5, 30, 60, 1440];

interface Props {
  date: string;
  onSave: (task: NewTask) => void;
  onClose: () => void;
}

/** Bottom sheet: two taps to save (plan.md §3.1). */
export function QuickAdd({ date, onSave, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [when, setWhen] = useState(date);
  const [category, setCategory] = useState<Category>('shaxsiy');
  const [offset, setOffset] = useState<ReminderOffset | 'none'>('none');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title,
      date: when,
      time: time || undefined,
      category,
      // A reminder needs a time to fire from (see notifications.fireTimeFor).
      reminderOffsetMin: time && offset !== 'none' ? offset : undefined,
    });
    onClose();
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h2 className="sheet__title">{t('add.title')}</h2>

        <input
          className="input"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('add.placeholder')}
          aria-label={t('add.title')}
        />

        <div className="sheet__row">
          <label className="field">
            <span>{t('add.date')}</span>
            <input
              className="input" type="date" value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </label>
          <label className="field">
            <span>{t('add.time')}</span>
            <input
              className="input" type="time" value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
        </div>

        <div className="chips">
          {CATEGORIES.map((c) => (
            <button
              key={c} type="button"
              className={`chip${category === c ? ' is-on' : ''}`}
              onClick={() => setCategory(c)}
            >
              {t(`cat.${c}`)}
            </button>
          ))}
        </div>

        {/* Reminders need a time, so only offer them once one is set. */}
        {time && (
          <label className="field">
            <span>{t('add.reminder')}</span>
            <select
              className="input"
              value={String(offset)}
              onChange={(e) => {
                const next =
                  e.target.value === 'none'
                    ? 'none'
                    : (Number(e.target.value) as ReminderOffset);
                setOffset(next);
                // Asked in context — the moment a reminder is chosen — rather
                // than on cold start (spec §4).
                if (next !== 'none') void requestNotificationPermission();
              }}
            >
              {OFFSETS.map((o) => (
                <option key={String(o)} value={String(o)}>
                  {o === 'none' ? t('rem.none') : t(`rem.${o}`)}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="sheet__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {t('add.cancel')}
          </button>
          <button type="submit" className="btn btn--primary" disabled={!title.trim()}>
            {t('add.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
