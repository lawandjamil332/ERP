import { describe, it, expect } from 'vitest';
import { computePscPeriod } from './psc';

describe('computePscPeriod', () => {
  it('respects the cost-recovery cap', () => {
    // Gross 1000, royalty 10%, cap 50%, contractor share 20%, costs 600
    const r = computePscPeriod({
      grossRevenue: 1000,
      recoverableCosts: 600,
      royaltyRate: 0.1,
      costRecoveryCap: 0.5,
      contractorProfitShare: 0.2,
    });
    // royalty = 100; netAfterRoyalty = 900; cap = 900*0.5 = 450
    expect(r.royaltyPaid).toBe('100.0000');
    expect(r.costRecovered).toBe('450.0000');     // capped at 450 (not 600)
    expect(r.carryforwardCost).toBe('150.0000');  // 600 - 450 carries over
    expect(r.profitOil).toBe('450.0000');         // 900 - 450
    expect(r.contractorShare).toBe('90.0000');    // 450 * 0.2
    expect(r.governmentShare).toBe('460.0000');   // 360 profit + 100 royalty
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
    expect(r.profitOil).toBe('700.0000');         // 900 - 200
  });
});
