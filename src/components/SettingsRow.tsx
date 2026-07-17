import { Icon, type IconName } from '../icons/Icon';

/**
 * One row of a classic settings list: a coloured icon tile, a title, and the
 * current value as a subtitle — so the whole list can be read without opening
 * anything. Tapping opens the detail page.
 */

export type Tone = 'blue' | 'violet' | 'orange' | 'green' | 'pink' | 'teal' | 'grey' | 'red';

interface Props {
  icon: IconName;
  tone: Tone;
  title: string;
  /** The current value. This is what makes the list scannable. */
  value?: string;
  onClick: () => void;
  danger?: boolean;
}

export function SettingsRow({ icon, tone, title, value, onClick, danger }: Props) {
  return (
    <button className={`srow${danger ? ' srow--danger' : ''}`} onClick={onClick}>
      <span className={`srow__tile srow__tile--${tone}`} aria-hidden="true">
        <Icon name={icon} size={22} />
      </span>
      <span className="srow__text">
        <span className="srow__title">{title}</span>
        {value && <span className="srow__value">{value}</span>}
      </span>
    </button>
  );
}

interface OptionProps<T extends string> {
  options: { id: T; label: string; hint?: string }[];
  selected: T;
  onSelect: (id: T) => void;
}

/** The detail page's list of choices — one tap, marked with a tick. */
export function OptionList<T extends string>({ options, selected, onSelect }: OptionProps<T>) {
  return (
    <div className="sgroup">
      {options.map((option) => (
        <button
          key={option.id}
          className={`orow${selected === option.id ? ' is-on' : ''}`}
          onClick={() => onSelect(option.id)}
          aria-pressed={selected === option.id}
        >
          <span className="srow__text">
            <span className="srow__title">{option.label}</span>
            {option.hint && <span className="srow__value">{option.hint}</span>}
          </span>
          <span className="orow__tick" aria-hidden="true">
            {selected === option.id && <Icon name="check" size={16} />}
          </span>
        </button>
      ))}
    </div>
  );
}
