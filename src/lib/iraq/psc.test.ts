import { describe, it, expect } from 'vitest';
import { computePscPeriod } from './psc';

describe('computePscPeriod', () => {
  it('respects the cost-recovery cap', () => {
    const r = computePscPeriod({
      grossRevenue: 1000,
      recoverableCosts: 600,
      royaltyRate: 0.1,
      costRecoveryCap: 0.5,
      contractorProfitShare: 0.2,
    });
    expect(r.royaltyPaid).toBe('100.0000');
    expect(r.costRecovered).toBe('450.0000');
    expect(r.carryforwardCost).toBe('150.0000');
    expect(r.profitOil).toBe('450.0000');
    expect(r.contractorShare).toBe('90.0000');
    expect(r.governmentShare).toBe('460.0000');
  });

  it('all costs recoverable when below cap', () => {
    const r = computePscPeriod({
      grossRevenue: 1000,
      recoverableCosts: 200,
      royaltyRate: 0.1,
      costRecoveryCap: 0.5,
      contractorProfitShare: 0.2,
    });
    expect(r.costRecovered).toBe('200.0000');
    expect(r.carryforwardCost).toBe('0.0000');
    expect(r.profitOil).toBe('700.0000');
  });
});
