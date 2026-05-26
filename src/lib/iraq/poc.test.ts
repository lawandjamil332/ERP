import { describe, it, expect, vi } from 'vitest';
import BigNumber from 'bignumber.js';
import { computePoc, buildPocJournalLines } from './poc';

const db = (contractValue: string) => ({
  project: {
    findFirst: vi.fn(async () => ({
      id: 'p1',
      contractValue: { toString: () => contractValue },
    })),
  },
}) as any;

describe('computePoc', () => {
  it('halfway through a 1B IQD project yields 500M revenue', async () => {
    const r = await computePoc(db('1000000000'), 't', {
      projectId: 'p1',
      costsToDate: '500000',
      estimatedTotalCost: '1000000',
      revenueRecognizedPrior: '0',
    });
    expect(r.percentComplete.times(100).toFixed(2)).toBe('50.00');
    expect(r.revenueEarnedToDate.toFixed(0)).toBe('500000000');
    expect(r.retentionToDate.toFixed(0)).toBe('50000000');  // 10% default
  });

  it('caps percent complete at 100% even with cost overrun', async () => {
    const r = await computePoc(db('1000000'), 't', {
      projectId: 'p1',
      costsToDate: '1500000',
      estimatedTotalCost: '1200000',
      revenueRecognizedPrior: '0',
    });
    expect(r.percentComplete.toString()).toBe('1');
    expect(r.revenueEarnedToDate.toFixed(0)).toBe('1000000');
  });

  it('throws when estimatedTotalCost is zero or negative', async () => {
    await expect(
      computePoc(db('500'), 't', {
        projectId: 'p1', costsToDate: '0', estimatedTotalCost: '0', revenueRecognizedPrior: '0',
      })
    ).rejects.toThrow(/estimatedTotalCost/);
  });
});

describe('buildPocJournalLines', () => {
  it('debits unbilled + retention, credits revenue, balanced', () => {
    const lines = buildPocJournalLines({
      revenueToRecognizeNow: new BigNumber('100000'),
      retentionDelta: new BigNumber('10000'),
    });
    const totalD = lines.reduce((s, l) => s.plus(l.debit ?? new BigNumber(0)), new BigNumber(0));
    const totalC = lines.reduce((s, l) => s.plus(l.credit ?? new BigNumber(0)), new BigNumber(0));
    expect(totalD.toString()).toBe(totalC.toString());
  });
});
