/**
 * Iraq ERP supports three locales:
 *   ar — Modern Standard Arabic (right-to-left), default
 *   ku — Central Kurdish / Sorani in Kurdistan Region (right-to-left)
 *   en — English (left-to-right)
 */

export const LOCALES = ['ar', 'ku', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ar';

export const RTL_LOCALES: Locale[] = ['ar', 'ku'];
export const isRtl = (l: Locale) => RTL_LOCALES.includes(l);

export const LOCALE_LABELS: Record<Locale, string> = {
  ar: 'العربية',
  ku: 'کوردی',
  en: 'English',
};
