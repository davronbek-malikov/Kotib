import { toISODate, weekDays, weekdayShort } from '../lib/dates';
import type { AppState, WeekStart } from '../lib/types';

interface Props {
  selected: string;
  weekStart: WeekStart;
  state: AppState;
  onSelect: (iso: string) => void;
}

/** 7 day chips for fast day switching (plan.md §3.4). */
export function WeekStrip({ selected, weekStart, state, onSelect }: Props) {
  const [y, m, d] = selected.split('-').map(Number);
  const days = weekDays(new Date(y, m - 1, d), weekStart);
  const today = toISODate(new Date());

  return (
    <div className="weekstrip">
      {days.map((day, i) => {
        const iso = toISODate(day);
        const has = state.tasks.some((task) => task.date === iso);
        return (
          <button
            key={iso}
            className={[
              'weekstrip__day',
              iso === selected ? 'is-selected' : '',
              iso === today ? 'is-today' : '',
            ].join(' ').trim()}
            onClick={() => onSelect(iso)}
          >
            {/* weekdayShort is Monday-indexed; shift when the week starts Sunday. */}
            <span className="weekstrip__dow">
              {weekdayShort(weekStart === 'mon' ? i : (i + 6) % 7)}
            </span>
            <span className="weekstrip__num">{day.getDate()}</span>
            <span className={`weekstrip__dot${has ? ' is-on' : ''}`} />
          </button>
        );
      })}
    </div>
  );
}
