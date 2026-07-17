import { Icon, type IconName } from '../icons/Icon';
import { t } from '../lib/i18n';

/** Settings left the tab bar for the header gear, freeing a slot for the
 *  assistant — same arrangement as Hamyon. */
export type Tab = 'today' | 'calendar' | 'lists' | 'chat' | 'settings';

const TABS: { id: Tab; icon: IconName; label: string }[] = [
  { id: 'today',    icon: 'today',    label: 'nav.today' },
  { id: 'calendar', icon: 'calendar', label: 'nav.calendar' },
  { id: 'lists',    icon: 'lists',    label: 'nav.lists' },
  { id: 'chat',     icon: 'chat',     label: 'nav.chat' },
];

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function TabBar({ active, onChange }: Props) {
  return (
    <nav className="tabbar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`tabbar__item${active === tab.id ? ' is-active' : ''}`}
          onClick={() => onChange(tab.id)}
          aria-current={active === tab.id ? 'page' : undefined}
        >
          <span className="tabbar__icon">
            <Icon name={tab.icon} size={20} />
          </span>
          <span className="tabbar__label">{t(tab.label)}</span>
        </button>
      ))}
    </nav>
  );
}
