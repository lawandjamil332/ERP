export type AppLocale = 'ar' | 'ku' | 'en';

/**
 * Pick the right string for the current locale — keeps all three languages
 * pure (no English leaking into Arabic/Kurdish). Falls back to English.
 *
 *   tri(locale, { ar: 'حفظ', ku: 'پاشەکەوت', en: 'Save' })
 */
export function tri(locale: string, m: { ar: string; ku: string; en: string }): string {
  if (locale === 'ar') return m.ar;
  if (locale === 'ku') return m.ku;
  return m.en;
}
