/**
 * Iraqi public holidays.
 *
 * Gregorian-fixed holidays apply every year on the same date.
 * Hijri-movable holidays are computed from the Hijri (lunar) calendar using
 * Dates.fromGregorian / Dates.toGregorian helpers.
 *
 * Federal vs Kurdistan:
 *   - Federal Iraq: Iraqi Army Day (6 Jan), Republic Day (14 Jul), etc.
 *   - Kurdistan adds Newroz (21 Mar) and Kurdistan Flag Day (17 Dec).
 *   - BOTH applies to all entities regardless of region.
 */

import { fromGregorian, toGregorian } from './dates';

export type HolidayScope = 'FEDERAL' | 'KURDISTAN' | 'BOTH';

export interface HolidaySpec {
  /** Stable code used for translation lookup. */
  code: string;
  nameAr: string;
  nameEn: string;
  scope: HolidayScope;
  /** For fixed Gregorian holidays: 1-indexed month and day. */
  gregorian?: { month: number; day: number };
  /** For movable Hijri holidays: 1-indexed Hijri month and day. */
  hijri?: { month: number; day: number; durationDays?: number };
}

export const IRAQ_HOLIDAYS: HolidaySpec[] = [
  // Gregorian-fixed
  { code: 'NEW_YEAR',     nameAr: 'رأس السنة الميلادية', nameEn: "New Year's Day",        scope: 'BOTH',     gregorian: { month: 1, day: 1 } },
  { code: 'ARMY_DAY',     nameAr: 'يوم الجيش العراقي',    nameEn: 'Iraqi Army Day',        scope: 'FEDERAL',  gregorian: { month: 1, day: 6 } },
  { code: 'NEWROZ',       nameAr: 'عيد نوروز',            nameEn: 'Newroz (Kurdish New Year)', scope: 'KURDISTAN', gregorian: { month: 3, day: 21 } },
  { code: 'LABOR_DAY',    nameAr: 'عيد العمال',          nameEn: 'Labour Day',            scope: 'BOTH',     gregorian: { month: 5, day: 1 } },
  { code: 'REPUBLIC_DAY', nameAr: 'يوم الجمهورية',       nameEn: 'Republic Day',          scope: 'FEDERAL',  gregorian: { month: 7, day: 14 } },
  { code: 'INDEPENDENCE', nameAr: 'يوم الاستقلال',       nameEn: 'Iraq Independence Day', scope: 'FEDERAL',  gregorian: { month: 10, day: 3 } },
  { code: 'KRG_FLAG',     nameAr: 'يوم علم كردستان',     nameEn: 'Kurdistan Flag Day',    scope: 'KURDISTAN',gregorian: { month: 12, day: 17 } },
  { code: 'CHRISTMAS',    nameAr: 'عيد الميلاد المجيد',   nameEn: 'Christmas Day',         scope: 'BOTH',     gregorian: { month: 12, day: 25 } },

  // Hijri-movable
  { code: 'ISLAMIC_NEW_YEAR', nameAr: 'رأس السنة الهجرية', nameEn: 'Islamic New Year',   scope: 'BOTH', hijri: { month: 1, day: 1 } },
  { code: 'ASHURA',           nameAr: 'يوم عاشوراء',       nameEn: 'Day of Ashura',       scope: 'BOTH', hijri: { month: 1, day: 10 } },
  { code: 'ARBAEEN',          nameAr: 'الأربعين',          nameEn: 'Arbaʿeen',            scope: 'FEDERAL', hijri: { month: 2, day: 20 } },
  { code: 'MAWLID',           nameAr: 'المولد النبوي',    nameEn: 'Prophet\'s Birthday', scope: 'BOTH', hijri: { month: 3, day: 12 } },
  { code: 'EID_FITR',         nameAr: 'عيد الفطر',         nameEn: 'Eid al-Fitr',         scope: 'BOTH', hijri: { month: 10, day: 1, durationDays: 3 } },
  { code: 'EID_ADHA',         nameAr: 'عيد الأضحى',        nameEn: 'Eid al-Adha',         scope: 'BOTH', hijri: { month: 12, day: 10, durationDays: 4 } },
];

export interface ExpandedHoliday {
  code: string;
  nameAr: string;
  nameEn: string;
  scope: HolidayScope;
  date: Date;           // UTC midnight
  isMovable: boolean;
}

/**
 * Expand all Iraqi public holidays for a given Gregorian year.
 * For Hijri-movable holidays, finds the Gregorian date that corresponds to
 * the given Hijri month/day, scanning the year and the boundary Hijri years.
 */
export function expandHolidays(year: number): ExpandedHoliday[] {
  const out: ExpandedHoliday[] = [];

  for (const h of IRAQ_HOLIDAYS) {
    if (h.gregorian) {
      out.push({
        code: h.code, nameAr: h.nameAr, nameEn: h.nameEn, scope: h.scope,
        date: new Date(Date.UTC(year, h.gregorian.month - 1, h.gregorian.day)),
        isMovable: false,
      });
    }
    if (h.hijri) {
      const yearStartHijri  = fromGregorian(new Date(Date.UTC(year, 0, 1)));
      const yearEndHijri    = fromGregorian(new Date(Date.UTC(year, 11, 31)));
      const hijriYears = new Set<number>([yearStartHijri.year, yearEndHijri.year]);
      for (const hy of hijriYears) {
        try {
          const g = toGregorian({ year: hy, month: h.hijri.month, day: h.hijri.day });
          if (g.getUTCFullYear() === year) {
            const days = h.hijri.durationDays ?? 1;
            for (let i = 0; i < days; i++) {
              const d = new Date(g);
              d.setUTCDate(d.getUTCDate() + i);
              out.push({
                code: h.code + (days > 1 ? `_D${i + 1}` : ''),
                nameAr: h.nameAr + (days > 1 ? ` — اليوم ${i + 1}` : ''),
                nameEn: h.nameEn + (days > 1 ? ` — Day ${i + 1}` : ''),
                scope: h.scope, date: d, isMovable: true,
              });
            }
          }
        } catch {
          /* outside conversion range — skip */
        }
      }
    }
  }

  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function isPublicHoliday(date: Date, scope: 'FEDERAL' | 'KURDISTAN' = 'FEDERAL'): boolean {
  const list = expandHolidays(date.getUTCFullYear());
  const t = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).getTime();
  return list.some((h) =>
    h.date.getTime() === t &&
    (h.scope === 'BOTH' || h.scope === scope)
  );
}
