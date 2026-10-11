import { describe, it, expect } from 'vitest';
import {
  translations,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  getTranslation,
  MONTH_NAMES_I18N,
  getLocalizedMonthName,
  formatCurrency,
  formatDate,
} from './translations';

describe('Internationalization (i18n) Engine & Translation Dictionaries', () => {
  it('defines the three required languages: en, hi, kn with en as default', () => {
    expect(DEFAULT_LANGUAGE).toBe('en');
    expect(SUPPORTED_LANGUAGES).toHaveLength(3);
    const codes = SUPPORTED_LANGUAGES.map(l => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('hi');
    expect(codes).toContain('kn');
  });

  it('has identical key count and complete parity across en, hi, and kn', () => {
    const enKeys = Object.keys(translations.en).sort();
    const hiKeys = Object.keys(translations.hi).sort();
    const knKeys = Object.keys(translations.kn).sort();

    expect(enKeys.length).toBeGreaterThan(200);

    // Check missing in Hindi
    const missingInHi = enKeys.filter(k => !(k in translations.hi));
    // Check missing in Kannada
    const missingInKn = enKeys.filter(k => !(k in translations.kn));

    expect(missingInHi).toEqual([]);
    expect(missingInKn).toEqual([]);

    // Check extra keys in hi or kn that don't exist in en
    const extraInHi = hiKeys.filter(k => !(k in translations.en));
    const extraInKn = knKeys.filter(k => !(k in translations.en));

    expect(extraInHi).toEqual([]);
    expect(extraInKn).toEqual([]);
  });

  it('contains no empty, null, or undefined translation strings', () => {
    ['en', 'hi', 'kn'].forEach(lang => {
      Object.entries(translations[lang]).forEach(([key, value]) => {
        expect(value, `Key "${key}" in language "${lang}" must be a non-empty string`).toBeTruthy();
        expect(typeof value, `Key "${key}" in language "${lang}" must be string`).toBe('string');
        expect(value.trim().length, `Key "${key}" in language "${lang}" must not be empty whitespace`).toBeGreaterThan(0);
      });
    });
  });

  it('interpolates parameters properly for strings with {placeholders}', () => {
    const resEn = getTranslation('exp_toast_added', 'en', { name: 'Swiggy', amount: '450' });
    expect(resEn).toContain('Swiggy');
    expect(resEn).toContain('450');

    const resHi = getTranslation('exp_toast_added', 'hi', { name: 'Swiggy', amount: '450' });
    expect(resHi).toContain('Swiggy');
    expect(resHi).toContain('450');

    const resKn = getTranslation('exp_toast_added', 'kn', { name: 'Swiggy', amount: '450' });
    expect(resKn).toContain('Swiggy');
    expect(resKn).toContain('450');

    // Test multiple params interpolation
    const multiEn = getTranslation('goal_need_monthly', 'en', { amount: '2,500', months: 6 });
    expect(multiEn).toBe('Need ~₹2,500/month for 6 months');

    const multiHi = getTranslation('goal_need_monthly', 'hi', { amount: '2,500', months: 6 });
    expect(multiHi).toContain('2,500');
    expect(multiHi).toContain('6');

    const multiKn = getTranslation('goal_need_monthly', 'kn', { amount: '2,500', months: 6 });
    expect(multiKn).toContain('2,500');
    expect(multiKn).toContain('6');
  });

  it('falls back safely to English when key is missing in another language or language is invalid', () => {
    // Non-existent language code
    const fallbackLang = getTranslation('brand_name', 'fr');
    expect(fallbackLang).toBe('NexWorth');

    // Return key itself if not present in any dictionary
    const fallbackKey = getTranslation('non_existent_key_xyz', 'en');
    expect(fallbackKey).toBe('non_existent_key_xyz');
  });

  it('provides localized month names for all 12 months in en, hi, kn', () => {
    expect(MONTH_NAMES_I18N.en).toHaveLength(12);
    expect(MONTH_NAMES_I18N.hi).toHaveLength(12);
    expect(MONTH_NAMES_I18N.kn).toHaveLength(12);

    expect(getLocalizedMonthName(0, 'en')).toBe('January');
    expect(getLocalizedMonthName(0, 'hi')).toBe('जनवरी');
    expect(getLocalizedMonthName(0, 'kn')).toBe('ಜನವರಿ');

    expect(getLocalizedMonthName(9, 'en')).toBe('October');
    expect(getLocalizedMonthName(9, 'hi')).toBe('अक्टूबर');
    expect(getLocalizedMonthName(9, 'kn')).toBe('ಅಕ್ಟೋಬರ್');
  });

  it('formats currency correctly in Indian Rupees (₹)', () => {
    const formattedEn = formatCurrency(12500, 'en');
    expect(formattedEn).toContain('12,500');
    expect(formattedEn).toContain('₹');

    const formattedHi = formatCurrency(12500, 'hi');
    expect(formattedHi).toContain('12,500');
    expect(formattedHi).toContain('₹');

    const formattedKn = formatCurrency(12500, 'kn');
    expect(formattedKn).toContain('12,500');
    expect(formattedKn).toContain('₹');
  });

  it('formats dates with locale-awareness', () => {
    const testDate = new Date('2026-10-15T10:00:00Z');
    const formattedEn = formatDate(testDate, 'en');
    const formattedHi = formatDate(testDate, 'hi');
    const formattedKn = formatDate(testDate, 'kn');

    expect(formattedEn).toBeTruthy();
    expect(formattedHi).toBeTruthy();
    expect(formattedKn).toBeTruthy();
  });
});
