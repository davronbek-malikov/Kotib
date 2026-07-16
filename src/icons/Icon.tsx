import type { Skin } from '../lib/types';

export type IconName =
  | 'today' | 'calendar' | 'lists' | 'settings'
  | 'plus' | 'bell' | 'check' | 'trash' | 'flag';

/**
 * Active skin, kept module-level like lib/i18n's active locale. App.tsx syncs
 * it from settings before children render.
 */
let activeSkin: Skin = 'klassik';

export function setIconSkin(skin: Skin): void {
  activeSkin = skin;
}

/** Klassik: thin, quiet, consistent with Hamyon (plan.md §2.2). */
const OUTLINE: Record<IconName, string> = {
  today:    'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  calendar: 'M8 3v4M16 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  lists:    'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  plus:     'M12 5v14M5 12h14',
  bell:     'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  check:    'M20 6 9 17l-5-5',
  trash:    'M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6',
  flag:     'M4 21V4m0 0h11l-1.5 4L15 12H4',
};

/**
 * Registon: solid marks. The weight is the point — filled shapes read as
 * pressable at arm's length, which is what makes this skin feel responsive
 * rather than merely brighter.
 */
const SOLID: Record<IconName, string> = {
  today:    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5v4.6l3.2 1.9-1 1.7L11 12.8V7h2Z',
  calendar: 'M7 2h2v2h6V2h2v2h2a1 1 0 0 1 1 1v4H3V5a1 1 0 0 1 1-1h3V2ZM3 11h18v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9Zm4 3v2h2v-2H7Zm4 0v2h2v-2h-2Zm4 0v2h2v-2h-2Z',
  lists:    'M4 5.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM9 4.5h11v2H9v-2Zm0 6.5h11v2H9v-2Zm0 6.5h11v2H9v-2Z',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm9.4-1.1a7.6 7.6 0 0 0 0-1.8l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-1.6-.9L17 2h-4l-.4 2.6c-.6.2-1.1.5-1.6.9l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 1.8l-2 1.6 2 3.4 2.4-1c.5.4 1 .7 1.6.9L13 22h4l.4-2.6c.6-.2 1.1-.5 1.6-.9l2.4 1 2-3.4-2-1.6Z',
  plus:     'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z',
  bell:     'M12 2a6 6 0 0 0-6 6c0 5-3 9-3 9h18s-3-4-3-9a6 6 0 0 0-6-6Zm-2 18a2 2 0 0 0 4 0h-4Z',
  check:    'M9.2 18.4 3 12.2l1.8-1.8 4.4 4.4L19.2 4.6 21 6.4 9.2 18.4Z',
  trash:    'M9 3h6a1 1 0 0 1 1 1v2h5v2H3V6h5V4a1 1 0 0 1 1-1Zm-4 7h14v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V10Zm4 2v7h2v-7H9Zm4 0v7h2v-7h-2Z',
  flag:     'M4 21V3h12l-2 4 2 4H6v10H4Z',
};

interface Props {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 24 }: Props) {
  const solid = activeSkin === 'registon';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={solid ? 'currentColor' : 'none'}
      stroke={solid ? 'none' : 'currentColor'}
      strokeWidth="var(--icon-stroke)"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={solid ? SOLID[name] : OUTLINE[name]} />
    </svg>
  );
}
