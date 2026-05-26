/**
 * Ramadan working-hours adjustment.
 *
 * Per Iraqi Labor Law, Muslim employees work 6 hours/day during Ramadan
 * instead of the standard 8 hours. The tenant has a global `ramadanMode`
 * toggle; payroll uses this to:
 *   - Reduce daily overtime baseline from 8h to 6h
 *   - Skip overtime accrual that would penalize the employer during Ramadan
 *
 * The dates of Ramadan are computed from the Hijri calendar
 * (Hijri month 9 = Ramadan).
 */

import { gregorianToHijri, hijriToGregorian } from './dates';

export interface RamadanRange {
  startGregorian: Date;
  endGregorian: Date;
  hijriYear: number;
}

export function ramadanRangeFor(gregorianYear: number): RamadanRange[] {
  const ranges: RamadanRange[] = [];
  // Hijri Ramadan can cross Gregorian years; scan adjacent Hijri years.
  const yearStartHijri = gregorianToHijri(new Date(Date.UTC(gregorianYear, 0, 1)));
  const yearEndHijri = gregorianToHijri(new Date(Date.UTC(gregorianYear, 11, 31)));
  const candidates = new Set([yearStartHijri.year, yearEndHijri.year]);
  for (const hy of candidates) {
    try {
      const start = hijriToGregorian({ year: hy, month: 9, day: 1 });
      // Ramadan is 29 or 30 days; we approximate with 30.
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 29);
      if (start.getUTCFullYear() === gregorianYear || end.getUTCFullYear() === gregorianYear) {
        ranges.push({ startGregorian: start, endGregorian: end, hijriYear: hy });
      }
    } catch {
      /* skip */
    }
  }
  return ranges;
}

export function isRamadan(date: Date): boolean {
  const ranges = ramadanRangeFor(date.getUTCFullYear());
  const t = date.getTime();
  return ranges.some((r) => t >= r.startGregorian.getTime() && t <= r.endGregorian.getTime());
}

/** Standard work hours for a given day under Iraqi labor rules. */
export function dailyWorkHours(date: Date, opts: { ramadanMode: boolean } = { ramadanMode: false }): number {
  if (opts.ramadanMode && isRamadan(date)) return 6;
  return 8;
}
