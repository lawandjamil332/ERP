import { describe, it, expect } from 'vitest';
import { computeTaxStamp } from './tax-stamp';

describe('computeTaxStamp', () => {
  it('does not apply below threshold', () => {
    const r = computeTaxStamp({ invoiceTotalIqd: 100_000 });
    expect(r.applies).toBe(false);
    expect(r.stampAmount).toBe('0');
  });

  it('applies flat stamp exactly at threshold', () => {
    const r = computeTaxStamp({ invoiceTotalIqd: 250_000 });
    expect(r.applies).toBe(true);
    expect(r.stampAmount).toBe('1000');
  });

  it('adds incremental bracket fees above threshold', () => {
    const r = computeTaxStamp({ invoiceTotalIqd: 1_250_000 });
    expect(r.applies).toBe(true);
    expect(r.stampAmount).toBe('5000');
  });

  it('handles BigNumber-like string inputs', () => {
    const r = computeTaxStamp({ invoiceTotalIqd: '500000' });
    expect(r.applies).toBe(true);
  });
});
