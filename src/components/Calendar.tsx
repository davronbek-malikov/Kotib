import { useMemo, useState } from 'react';
import { DaySheet } from './DaySheet';
import { PlanList } from './PlanList';
import {
  monthAnchor, monthGrid, monthLabel, monthName, shiftPeriod, todayISO,
  weekAnchor, weekLabel, weekdayShort, yearAnchor, yearLabel,
} from '../lib/dates';
import { t } from '../lib/i18n';
import { tasksForDate } from '../lib/store';
import { PERIOD_SCOPES, type AppState, type PeriodScope } from '../lib/types';

interface Props {
  state: AppState;
  setState: (s: AppState) => void;
  onComplete: (title: string) => void;
}

/** 'taqvim' is the month calendar; the rest are period-plan views. */
type View = 'taqvim' | PeriodScope;

export function Calendar({ state, setState, onComplete }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [open, setOpen] = useState<string | null>(null);
  const [view, setView] = useState<View>('taqvim');

  // Each period view carries its own anchor so navigating weeks doesn't move
  // the calendar's month, and vice versa.
  const today = todayISO();
  const [weekA, setWeekA] = useState(() => weekAnchor(today, state.settings.weekStart));
  const [monthA, setMonthA] = useState(() => monthAnchor(today));
  const [yearA, setYearA] = useState(() => yearAnchor(today));

  const cells = monthGrid(year, month, state.settings.weekStart);

  function shiftMonth(by: number) {
    const d = new Date(year, month + by, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  // Only the scopes the user has kept appear as tabs (Settings → Rejalar).
  const enabled = useMemo(
    () => PERIOD_SCOPES.filter((sc) => state.settings.planScopes[sc]),
    [state.settings.planScopes],
  );

  // If the current view was just disabled, fall back to the calendar.
  const activeView: View = view !== 'taqvim' && !enabled.includes(view) ? 'taqvim' : view;

  const dows = state.settings.weekStart === 'mon'
    ? [0, 1, 2, 3, 4, 5, 6]
    : [6, 0, 1, 2, 3, 4, 5];

  return (
    <section className="screen">
      {/* Segmented control appears only when there is more than the calendar. */}
      {enabled.length > 0 && (
        <div className="segmented" role="tablist">
          {(['taqvim', ...enabled] as View[]).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={activeView === v}
              className={`segmented__item${activeView === v ? ' is-on' : ''}`}
              onClick={() => setView(v)}
            >
              {v === 'taqvim' ? t('nav.calendar') : t(`plan.tab.${v}`)}
            </button>
          ))}
        </div>
      )}

      {activeView === 'taqvim' && (
        <>
          <header className="cal__head">
            <button className="linkbtn" onClick={() => shiftMonth(-1)} aria-label="‹">‹</button>
            <h1 className="screen__title cal__month">{monthName(month)} {year}</h1>
            <button className="linkbtn" onClick={() => shiftMonth(1)} aria-label="›">›</button>
          </header>

          <div className="cal__grid cal__dows">
            {dows.map((d) => <span key={d} className="cal__dow">{weekdayShort(d)}</span>)}
          </div>

          <div className="cal__grid">
            {cells.map((iso, i) => {
              if (!iso) return <span key={`pad-${i}`} />;
              // Day tasks only — a month plan on the 1st must not light a dot.
              const dayTasks = tasksForDate(state, iso);
              const has = dayTasks.length > 0;
              const allDone = has && dayTasks.every((task) => task.done);
              return (
                <button
                  key={iso}
                  className={`cal__day${iso === today ? ' is-today' : ''}`}
                  onClick={() => setOpen(iso)}
                >
                  <span className="cal__num">{Number(iso.slice(8, 10))}</span>
                  <span
                    className={['cal__dot', has ? 'is-on' : '', allDone ? 'is-done' : '']
                      .join(' ').trim()}
                  />
                </button>
              );
            })}
          </div>
        </>
      )}

      {activeView === 'week' && (
        <PlanList
          scope="week" anchor={weekA} label={weekLabel(weekA)}
          onShift={(by) => setWeekA((a) => shiftPeriod(a, 'week', by))}
          state={state} setState={setState} onComplete={onComplete}
        />
      )}
      {activeView === 'month' && (
        <PlanList
          scope="month" anchor={monthA} label={monthLabel(monthA)}
          onShift={(by) => setMonthA((a) => shiftPeriod(a, 'month', by))}
          state={state} setState={setState} onComplete={onComplete}
        />
      )}
      {activeView === 'year' && (
        <PlanList
          scope="year" anchor={yearA} label={yearLabel(yearA)}
          onShift={(by) => setYearA((a) => shiftPeriod(a, 'year', by))}
          state={state} setState={setState} onComplete={onComplete}
        />
      )}

      {open && (
        <DaySheet date={open} state={state} setState={setState} onClose={() => setOpen(null)} />
      )}
    </section>
  );
}
