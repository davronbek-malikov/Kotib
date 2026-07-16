import { useState } from 'react';
import { DaySheet } from './DaySheet';
import { monthGrid, monthName, todayISO, weekdayShort } from '../lib/dates';
import type { AppState } from '../lib/types';

interface Props {
  state: AppState;
  setState: (s: AppState) => void;
}

export function Calendar({ state, setState }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [open, setOpen] = useState<string | null>(null);

  const cells = monthGrid(year, month, state.settings.weekStart);
  const today = todayISO();

  function shift(by: number) {
    const d = new Date(year, month + by, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  // Header labels follow the user's week start (weekdayShort is Monday-indexed).
  const dows = state.settings.weekStart === 'mon'
    ? [0, 1, 2, 3, 4, 5, 6]
    : [6, 0, 1, 2, 3, 4, 5];

  return (
    <section className="screen">
      <header className="cal__head">
        <button className="linkbtn" onClick={() => shift(-1)} aria-label="‹">‹</button>
        <h1 className="screen__title cal__month">
          {monthName(month)} {year}
        </h1>
        <button className="linkbtn" onClick={() => shift(1)} aria-label="›">›</button>
      </header>

      <div className="cal__grid cal__dows">
        {dows.map((d) => (
          <span key={d} className="cal__dow">{weekdayShort(d)}</span>
        ))}
      </div>

      <div className="cal__grid">
        {cells.map((iso, i) => {
          if (!iso) return <span key={`pad-${i}`} />;
          const dayTasks = state.tasks.filter((task) => task.date === iso);
          const has = dayTasks.length > 0;
          const allDone = has && dayTasks.every((task) => task.done);
          return (
            <button
              key={iso}
              className={`cal__day${iso === today ? ' is-today' : ''}`}
              onClick={() => setOpen(iso)}
            >
              <span className="cal__num">{Number(iso.slice(8, 10))}</span>
              {/* Accent dot = has tasks; ring = all done (plan.md §3.4). */}
              <span
                className={[
                  'cal__dot',
                  has ? 'is-on' : '',
                  allDone ? 'is-done' : '',
                ].join(' ').trim()}
              />
            </button>
          );
        })}
      </div>

      {open && (
        <DaySheet
          date={open}
          state={state}
          setState={setState}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  );
}
