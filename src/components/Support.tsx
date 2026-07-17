import { Icon } from '../icons/Icon';
import { t } from '../lib/i18n';

/**
 * Kotib is free, has no server and sells nothing. This is the one place
 * someone can choose to support it, and it lives at the foot of the home
 * screen — below the day's tasks, so it is seen but never in the way.
 */
export function Support() {
  return (
    <a
      className="support"
      href="https://tirikchilik.uz/davronbek"
      target="_blank"
      rel="noreferrer"
    >
      <Icon name="heart" size={17} />
      <span>{t('support.title')}</span>
    </a>
  );
}
