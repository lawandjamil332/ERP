/**
 * Iraqi Arabic-Indic numeral conversion (٠١٢٣٤٥٦٧٨٩).
 *
 * GCT forms and many official Iraqi documents require Arabic-Indic numerals
 * instead of the Latin (Western Arabic) form 0–9. Tenants can toggle via
 * Tenant.useArabicNumerals.
 */

const LATIN  = '0123456789';
const ARABIC = '٠١٢٣٤٥٦٧٨٩';

export function toArabicNumerals(s: string | number): string {
  return String(s).replace(/[0-9]/g, (d) => ARABIC[LATIN.indexOf(d)]);
}

export function toLatinNumerals(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => LATIN[ARABIC.indexOf(d)]);
}

export function formatNumber(
  value: number,
  options: {
    locale?: 'ar' | 'ku' | 'en';
    useArabicNumerals?: boolean;
    fractionDigits?: number;
  } = {}
): string {
  const locale = options.locale ?? 'ar';
  const intlLocale = locale === 'en' ? 'en-IQ' : locale === 'ku' ? 'ckb-IQ' : 'ar-IQ';
  const formatted = new Intl.NumberFormat(intlLocale, {
    minimumFractionDigits: options.fractionDigits ?? 0,
    maximumFractionDigits: options.fractionDigits ?? 2,
  }).format(value);
  return options.useArabicNumerals === false ? toLatinNumerals(formatted) : formatted;
}
