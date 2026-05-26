/**
 * Iraqi calendar helpers.
 *
 * Iraq officially uses the Gregorian calendar for government and tax filings,
 * but the Hijri (Islamic) calendar is widely used culturally and required on
 * some religious-context documents. We store dates in Gregorian and expose
 * the Hijri equivalent for display and audit logs.
 */

const HIJRI_MONTHS_AR = [
  'محرّم','صفر','ربيع الأول','ربيع الثاني','جمادى الأولى','جمادى الآخرة',
  'رجب','شعبان','رمضان','شوّال','ذو القعدة','ذو الحجة',
];

/**
 * Compute Hijri date from a Gregorian date using the tabular Umm al-Qura
 * algorithm approximation (Kuwaiti algorithm). For UI display only — for
 * any religious or legal certificate, use the official Umm al-Qura calendar.
 */
export function gregorianToHijri(g: Date): { year: number; month: number; day: number } {
  const jd = Math.floor((g.getTime() / 86400000) + 2440587.5);
  const l1 = jd - 1948440 + 10632;
  const n = Math.floor((l1 - 1) / 10631);
  const l2 = l1 - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719)
          + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
                 - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l3) / 709);
  const day   = l3 - Math.floor((709 * month) / 24);
  const year  = 30 * n + j - 30;
  return { year, month, day };
}

/**
 * Hijri → Gregorian (Kuwaiti algorithm inverse).
 * Returns a Date at UTC midnight.
 */
export function hijriToGregorian(h: { year: number; month: number; day: number }): Date {
  const jd = Math.floor((11 * h.year + 3) / 30)
           + Math.floor(354 * h.year)
           + Math.floor(30 * h.month)
           - Math.floor((h.month - 1) / 2)
           + h.day + 1948440 - 385;
  const ms = (jd - 2440587.5) * 86400000;
  const d = new Date(ms);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Backward-compatible aliases. */
export const fromGregorian = gregorianToHijri;
export const toGregorian = hijriToGregorian;

export function formatHijri(g: Date, locale: 'ar' | 'en' = 'ar'): string {
  const { year, month, day } = gregorianToHijri(g);
  const monthName = locale === 'ar' ? HIJRI_MONTHS_AR[month - 1] : `M${month}`;
  return `${day} ${monthName} ${year} هـ`;
}

/**
 * Iraqi tax / payroll filing deadlines.
 *   - Monthly SS:   30th of the month following the deduction month
 *   - Annual SS:    end of February
 *   - Annual D/4A:  31 March (federal); end of June (KRG)
 *   - Annual CIT:   31 May (federal); 30 June (KRG)
 */
export function monthlySsDeadline(periodYear: number, periodMonth: number): Date {
  const next = new Date(Date.UTC(periodYear, periodMonth, 30));
  return next;
}

export function annualSsDeadline(year: number): Date {
  return new Date(Date.UTC(year + 1, 1, 28));
}

export function annualPitDeadline(year: number, region: 'FEDERAL' | 'KURDISTAN'): Date {
  return region === 'KURDISTAN'
    ? new Date(Date.UTC(year + 1, 5, 30))
    : new Date(Date.UTC(year + 1, 2, 31));
}

export function annualCitDeadline(year: number, region: 'FEDERAL' | 'KURDISTAN'): Date {
  return region === 'KURDISTAN'
    ? new Date(Date.UTC(year + 1, 5, 30))
    : new Date(Date.UTC(year + 1, 4, 31));
}
