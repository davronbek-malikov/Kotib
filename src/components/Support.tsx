import { t } from '../lib/i18n';

/**
 * Kotib is free and has no server, so there is nothing to sell. Tirikchilik is
 * how someone can choose to support it. Sits quietly at the foot of Settings —
 * an offer, never a prompt (same placement as Hamyon).
 */
export function Support() {
  return (
    <a
      className="support"
      href="https://tirikchilik.uz/davronbek"
      target="_blank"
      rel="noreferrer"
    >
      <span className="support__mark" aria-hidden="true">
        TIRIK<br />CHILIK
      </span>
      <span className="support__text">
        <strong>{t('support.title')}</strong>
        <span>{t('support.body')}</span>
      </span>
    </a>
  );
}
