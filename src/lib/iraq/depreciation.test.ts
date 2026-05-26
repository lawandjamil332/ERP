import { describe, it, expect } from 'vitest';
import { monthlyDepreciation, endOfMonth } from './depreciation';

describe('Depreciation', () => {
  it('straight-line: 5-year, 1M IQD ~ 16,667/mo', () => {
    const m = monthlyDepreciation({
      acquisitionCost: 1_000_000, salvageValue: 0,
      usefulLife: 5, method: 'STRAIGHT_LINE',
      accumulatedDepreciation: 0, monthsInService: 1,
    });
    expect(Number(m.toFixed(0))).toBeCloseTo(16_667, 0);
  });

  it('respects salvage value', () => {
    const m = monthlyDepreciation({
      acquisitionCost: 1_000_000, salvageValue: 400_000,
      usefulLife: 5, method: 'STRAIGHT_LINE',
      accumulatedDepreciation: 0, monthsInService: 1,
    });
    expect(Number(m.toFixed(0))).toBe(10_000);
  });

  it('stops when fully depreciated', () => {
    const m = monthlyDepreciation({
      acquisitionCost: 1_000_000, salvageValue: 0,
      usefulLife: 5, method: 'STRAIGHT_LINE',
      accumulatedDepreciation: 1_000_000, monthsInService: 60,
    });
    expect(m.eq(0)).toBe(true);
  });

  it('endOfMonth handles leap year', () => {
    expect(endOfMonth('2024-02').toISOString().slice(0, 10)).toBe('2024-02-29');
  });
});
