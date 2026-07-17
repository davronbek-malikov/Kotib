import type { Skin } from '../lib/types';

export type IconName =
  | 'today' | 'calendar' | 'lists' | 'settings'
  | 'plus' | 'bell' | 'check' | 'trash' | 'flag'
  | 'chat' | 'send' | 'heart'
  | 'palette' | 'text' | 'globe' | 'data' | 'info' | 'search' | 'back' | 'chevron';

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
  settings: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.09a2 2 0 0 1 1 1.74v.5a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  plus:     'M12 5v14M5 12h14',
  bell:     'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  check:    'M20 6 9 17l-5-5',
  trash:    'M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6',
  flag:     'M4 21V4m0 0h11l-1.5 4L15 12H4',
  chat:     'M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-4-.9L3 21l1.9-4.9a8.4 8.4 0 0 1-.9-4 8.4 8.4 0 0 1 8.4-8.4h.6a8.4 8.4 0 0 1 8 8v.8Z',
  send:     'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z',
  heart:    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21.2l7.7-7.7 1.1-1a5.5 5.5 0 0 0 0-7.9Z',
  palette:  'M12 21a9 9 0 1 1 0-18c4.97 0 9 3.58 9 8 0 2.5-2 3.5-3.5 3.5H15a2 2 0 0 0-1.4 3.4c.3.3.4.7.4 1.1a2 2 0 0 1-2 2ZM7.5 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm4-3a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm4 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  text:     'M4 7V5h16v2M9 5v14M15 5v14M7 19h4m4 0h4',
  globe:    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z',
  data:     'M12 3c4.4 0 8 1.3 8 3v12c0 1.7-3.6 3-8 3s-8-1.3-8-3V6c0-1.7 3.6-3 8-3ZM4 6c0 1.7 3.6 3 8 3s8-1.3 8-3M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  info:     'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 7.5h.01',
  search:   'M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z',
  back:     'M15 18l-6-6 6-6',
  chevron:  'M9 6l6 6-6 6',
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
  chat:     'M12 2.5a9.5 9.5 0 0 0-8.3 14.1L2 22l5.6-1.6A9.5 9.5 0 1 0 12 2.5ZM8 11h2v2H8v-2Zm3 0h2v2h-2v-2Zm3 0h2v2h-2v-2Z',
  send:     'M2.5 11.4 21 3l-8.4 18.5-2.4-7.7-7.7-2.4Z',
  heart:    'M12 21.3 3.9 13.2A5.5 5.5 0 0 1 12 5.7a5.5 5.5 0 0 1 8.1 7.5L12 21.3Z',
  palette:  'M12 21a9 9 0 1 1 0-18c4.97 0 9 3.58 9 8 0 2.5-2 3.5-3.5 3.5H15a2 2 0 0 0-1.4 3.4c.3.3.4.7.4 1.1a2 2 0 0 1-2 2ZM7.5 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm4-3a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm4 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  text:     'M4 4h16v3h-2V6h-5v12h2v2H9v-2h2V6H6v1H4V4Z',
  globe:    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 6h-2.9a15 15 0 0 0-1.3-3.6A8 8 0 0 1 18.9 8ZM12 4.2c.7 1 1.3 2.3 1.7 3.8h-3.4C10.7 6.5 11.3 5.2 12 4.2ZM4.3 14a8 8 0 0 1 0-4h3.3a17 17 0 0 0 0 4H4.3Zm.8 2H8a15 15 0 0 0 1.3 3.6A8 8 0 0 1 5.1 16Zm2.9-8H5.1a8 8 0 0 1 4.2-3.6A15 15 0 0 0 8 8Zm4 11.8c-.7-1-1.3-2.3-1.7-3.8h3.4c-.4 1.5-1 2.8-1.7 3.8ZM14.3 14H9.7a15 15 0 0 1 0-4h4.6a15 15 0 0 1 0 4Zm.4 5.6a15 15 0 0 0 1.3-3.6h2.9a8 8 0 0 1-4.2 3.6Zm1.7-5.6a17 17 0 0 0 0-4h3.3a8 8 0 0 1 0 4h-3.3Z',
  data:     'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3Zm8 6.5V12c0 1.7-3.6 3-8 3s-8-1.3-8-3V9.5c1.7 1.2 4.7 1.8 8 1.8s6.3-.6 8-1.8Zm0 5.5v3c0 1.7-3.6 3-8 3s-8-1.3-8-3v-3c1.7 1.2 4.7 1.8 8 1.8s6.3-.6 8-1.8Z',
  info:     'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z',
  search:   'M10.5 3a7.5 7.5 0 1 0 4.7 13.35l3.75 3.75 1.42-1.42-3.75-3.75A7.5 7.5 0 0 0 10.5 3Zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z',
  back:     'M15.4 4.6 8 12l7.4 7.4 1.4-1.4L10.8 12l6-6-1.4-1.4Z',
  chevron:  'M8.6 4.6 16 12l-7.4 7.4-1.4-1.4 6-6-6-6 1.4-1.4Z',
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
      <path d={solid ? SOLID[name] : OUTLINE[name]} fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}
