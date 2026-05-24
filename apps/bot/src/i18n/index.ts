import fs from 'fs';
import path from 'path';

const esTranslations = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'es.json'), 'utf-8'));
const enTranslations = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'en.json'), 'utf-8'));

export type Locale = 'es' | 'en';
export type TranslationKey = keyof typeof esTranslations;

const translations: Record<Locale, Record<string, string>> = {
  es: esTranslations,
  en: enTranslations,
};

/**
 * Translate a key to the specified locale with optional variable interpolation.
 * Falls back: requested locale → 'en' → raw key.
 */
export function t(
  key: string,
  locale: Locale = 'es',
  vars?: Record<string, string | number>
): string {
  let text = translations[locale]?.[key]
    ?? translations['en']?.[key]
    ?? key;

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{{${k}}}`, String(v));
    }
  }

  return text;
}

/**
 * Get the locale for a guild (from nation config).
 * Returns 'es' as default.
 */
export function getLocale(nationLocale?: string): Locale {
  if (nationLocale === 'en') return 'en';
  return 'es';
}
