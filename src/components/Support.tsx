import { Icon } from '../icons/Icon';
import { t } from '../lib/i18n';

/**
 * Kotib is free and has no server, so there is nothing to sell. This is the
 * one place someone can choose to support it.
 *
 * Deliberately a plain text button, not a card with a logo: a block with
 * branding reads as an advertisement, and an app that begs is worse than an
 * app that never asks. It sits at the foot of Settings and says its piece once.
 */
export function Support() {
  return (
    <a
      className="support"
      href="https://tirikchilik.uz/davronbek"
      target="_blank"
      rel="noreferrer"
    >
      <Icon name="heart" size={15} />
      <span>{t('support.title')}</span>
    </a>
  );
}
