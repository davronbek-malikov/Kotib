import { describe, expect, it } from 'vitest';
import { STRING_KEYS, setLang, t } from '../i18n';
import { toCyrillic } from '../translit';

describe('i18n', () => {
  it('returns Uzbek Latin by default', () => {
    setLang('uz');
    expect(t('nav.today')).toBe('Bugun');
  });

  it('translates to Turkish and English', () => {
    setLang('tr');
    expect(t('nav.today')).toBe('Bugün');
    setLang('en');
    expect(t('nav.today')).toBe('Today');
  });

  it('generates Cyrillic from the Latin source rather than a second dictionary', () => {
    setLang('uz-cyrl');
    expect(t('nav.today')).toBe(toCyrillic('Bugun'));
  });

  it('has every key defined in uz, tr and en', () => {
    for (const key of STRING_KEYS) {
      for (const lang of ['uz', 'tr', 'en'] as const) {
        setLang(lang);
        expect(t(key), `${key} missing for ${lang}`).not.toBe(key);
      }
    }
  });

  it('falls back to the key itself when a string is missing', () => {
    setLang('uz');
    expect(t('nope.missing')).toBe('nope.missing');
  });

  it('has a title for every Settings detail page', () => {
    // Settings derives each page title from `set.<page>`, so a page without a
    // string would render its own key to the user.
    const PAGES = [
      'theme', 'skin', 'font', 'taskMode', 'doneStyle',
      'weekStart', 'notifications', 'language', 'data', 'about',
    ];
    setLang('uz');
    for (const page of PAGES) {
      expect(t(`set.${page}`), `Settings page "${page}" has no title`).not.toBe(`set.${page}`);
    }
  });
});
