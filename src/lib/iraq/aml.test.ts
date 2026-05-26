import { describe, it, expect } from 'vitest';
import { exceedsThreshold, AML_CASH_THRESHOLD_IQD } from './aml';

describe('exceedsThreshold', () => {
  it('flags large cash payments in IQD', () => {
    expect(exceedsThreshold({
      tenantId: 't', triggerEntity: 'Payment', triggerId: 'p1',
      amount: 20_000_000, currency: 'IQD', method: 'CASH',
    })).toBe(true);
  });
  it('does not flag bank-transfer payments', () => {
    expect(exceedsThreshold({
      tenantId: 't', triggerEntity: 'Payment', triggerId: 'p1',
      amount: 20_000_000, currency: 'IQD', method: 'BANK_TRANSFER',
    })).toBe(false);
  });
  it('flags USD cash above threshold using fx rate', () => {
    // 12,000 USD at 1320 IQD/USD = 15,840,000 IQD
    expect(exceedsThreshold({
      tenantId: 't', triggerEntity: 'Payment', triggerId: 'p1',
      amount: 12_000, currency: 'USD', fxRate: 1320, method: 'CASH',
    })).toBe(true);
  });
  it('keeps the threshold constant at 15M IQD', () => {
    expect(AML_CASH_THRESHOLD_IQD).toBe(15_000_000);
  });
});
