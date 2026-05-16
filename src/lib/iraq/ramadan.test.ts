import { describe, it, expect } from 'vitest';
import { ramadanRangeFor, isRamadan, dailyWorkHours } from './ramadan';

describe('ramadanRangeFor', () => {
  it('returns at least one range for any modern year', () => {
    const r = ramadanRangeFor(2026);
    expect(r.length).toBeGreaterThanOrEqual(1);
    for (const range of r) {
      expect(range.startGregorian.getTime()).toBeLessThanOrEqual(range.endGregorian.getTime());
    }
  });
});

describe('dailyWorkHours', () => {
  it('returns 8h on a normal day', () => {
    expect(dailyWorkHours(new Date(Date.UTC(2026, 9, 1)))).toBe(8);
  });
  it('returns 6h during Ramadan when toggle is on', () => {
    const ranges = ramadanRangeFor(2026);
    const mid = new Date(ranges[0].startGregorian);
    mid.setUTCDate(mid.getUTCDate() + 10);
    expect(dailyWorkHours(mid, { ramadanMode: true })).toBe(6);
  });
  it('returns 8h during Ramadan when toggle is off', () => {
    const ranges = ramadanRangeFor(2026);
    const mid = new Date(ranges[0].startGregorian);
    mid.setUTCDate(mid.getUTCDate() + 10);
    expect(dailyWorkHours(mid, { ramadanMode: false })).toBe(8);
  });
});
