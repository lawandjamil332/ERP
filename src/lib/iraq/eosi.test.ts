import { describe, it, expect } from 'vitest';
import { computeEosi } from './eosi';

describe('End-of-Service Indemnity', () => {
  it('resignation <5 years -> 1/2 month per year', () => {
    const r = computeEosi({
      hireDate: new Date('2022-01-01'),
      endDate: new Date('2025-01-01'),
      lastMonthlySalary: 1_000_000,
      reason: 'RESIGNATION',
    });
    expect(r.factorPerYear).toBe(0.5);
    expect(Number(r.amount)).toBeCloseTo(1_500_000, -3);
  });

  it('resignation >=5 years -> 1 month per year', () => {
    const r = computeEosi({
      hireDate: new Date('2015-01-01'),
      endDate: new Date('2025-01-01'),
      lastMonthlySalary: 1_000_000,
      reason: 'RESIGNATION',
    });
    expect(r.factorPerYear).toBe(1);
    expect(Number(r.amount)).toBeCloseTo(10_000_000, -3);
  });

  it('termination for cause forfeits the indemnity', () => {
    const r = computeEosi({
      hireDate: new Date('2010-01-01'),
      endDate: new Date('2025-01-01'),
      lastMonthlySalary: 1_000_000,
      reason: 'TERMINATION_FOR_CAUSE',
    });
    expect(r.amount).toBe('0');
  });
});
