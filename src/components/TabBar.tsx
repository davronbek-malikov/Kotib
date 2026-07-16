import { Icon, type IconName } from '../icons/Icon';
import { t } from '../lib/i18n';

export type Tab = 'today' | 'calendar' | 'lists' | 'settings';

const TABS: { id: Tab; icon: IconName; label: string }[] = [
  { id: 'today',    icon: 'today',    label: 'nav.today' },
  { id: 'calendar', icon: 'calendar', label: 'nav.calendar' },
  { id: 'lists',    icon: 'lists',    label: 'nav.lists' },
  { id: 'settings', icon: 'settings', label: 'nav.settings' },
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
          <Icon name={tab.icon} size={22} />
          <span>{t(tab.label)}</span>
        </button>
      ))}
    </nav>
  );
}
