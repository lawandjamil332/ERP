import { describe, it, expect } from 'vitest';
import { monthlySsDeadline, annualSsDeadline, annualPitDeadline, annualCitDeadline, gregorianToHijri } from './dates';

describe('Iraqi filing deadlines', () => {
  it('monthly SS = 30th of the following month', () => {
    const d = monthlySsDeadline(2026, 5);
    expect(d.getUTCMonth()).toBe(5);
    expect(d.getUTCDate()).toBe(30);
  });

  it('annual SS deadline = end of February next year', () => {
    const d = annualSsDeadline(2026);
    expect(d.getUTCFullYear()).toBe(2027);
    expect(d.getUTCMonth()).toBe(1);
    expect(d.getUTCDate()).toBe(28);
  });

  it('PIT: 31 Mar federal, 30 Jun KRG', () => {
    expect(annualPitDeadline(2026, 'FEDERAL').toISOString().slice(0, 10)).toBe('2027-03-31');
    expect(annualPitDeadline(2026, 'KURDISTAN').toISOString().slice(0, 10)).toBe('2027-06-30');
  });

  it('CIT: 31 May federal, 30 Jun KRG', () => {
    expect(annualCitDeadline(2026, 'FEDERAL').toISOString().slice(0, 10)).toBe('2027-05-31');
    expect(annualCitDeadline(2026, 'KURDISTAN').toISOString().slice(0, 10)).toBe('2027-06-30');
  });
});

describe('gregorianToHijri', () => {
  it('returns a Hijri triple in the expected range', () => {
    const { year } = gregorianToHijri(new Date('2026-01-15'));
    expect(year).toBeGreaterThan(1440);
    expect(year).toBeLessThan(1460);
  });
});
