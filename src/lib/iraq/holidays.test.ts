import { describe, it, expect } from 'vitest';
import { expandHolidays, isPublicHoliday } from './holidays';

describe('expandHolidays', () => {
  it('expands Gregorian-fixed holidays for the requested year', () => {
    const list = expandHolidays(2026);
    const newYear = list.find((h) => h.code === 'NEW_YEAR');
    expect(newYear?.date.toISOString().slice(0, 10)).toBe('2026-01-01');
    const army = list.find((h) => h.code === 'ARMY_DAY');
    expect(army?.scope).toBe('FEDERAL');
    expect(army?.date.toISOString().slice(0, 10)).toBe('2026-01-06');
  });

  it('produces Eid al-Fitr as a multi-day holiday', () => {
    const list = expandHolidays(2026);
    const eidDays = list.filter((h) => h.code.startsWith('EID_FITR'));
    expect(eidDays.length).toBeGreaterThanOrEqual(1);
    expect(eidDays.every((d) => d.isMovable)).toBe(true);
  });

  it('includes Newroz only for Kurdistan scope', () => {
    const list = expandHolidays(2026);
    const newroz = list.find((h) => h.code === 'NEWROZ');
    expect(newroz?.scope).toBe('KURDISTAN');
    expect(newroz?.date.toISOString().slice(0, 10)).toBe('2026-03-21');
  });
});

describe('isPublicHoliday', () => {
  it('returns true for New Year regardless of scope', () => {
    expect(isPublicHoliday(new Date(Date.UTC(2026, 0, 1)), 'FEDERAL')).toBe(true);
    expect(isPublicHoliday(new Date(Date.UTC(2026, 0, 1)), 'KURDISTAN')).toBe(true);
  });

  it('returns false for a random Sunday', () => {
    expect(isPublicHoliday(new Date(Date.UTC(2026, 1, 22)), 'FEDERAL')).toBe(false);
  });

  it('Newroz is in the KRG list but not the federal-only list', () => {
    const list2030 = expandHolidays(2030);
    const newroz = list2030.find((h) => h.code === 'NEWROZ');
    expect(newroz?.scope).toBe('KURDISTAN');
    // FEDERAL-only entities shouldn't see Newroz as a holiday
    const visibleToFederal = list2030.filter((h) => h.code === 'NEWROZ' && (h.scope === 'BOTH' || h.scope === 'FEDERAL'));
    expect(visibleToFederal).toHaveLength(0);
  });
});
