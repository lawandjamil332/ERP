import { describe, it, expect, vi } from 'vitest';
import { consolidate } from './consolidation';

vi.mock('./reports', () => ({
  trialBalance: vi.fn(async (_db: any, tid: string) => {
    if (tid === 't1') return [
      { code: '1111', nameAr: 'نقد', nameEn: 'Cash', type: 'ASSET',
        debit: { toString: () => '0' }, credit: { toString: () => '0' },
        balance: { toString: () => '100', toFixed: (n: number) => '100' } },
    ];
    if (tid === 't2') return [
      { code: '1111', nameAr: 'نقد', nameEn: 'Cash', type: 'ASSET',
        debit: { toString: () => '0' }, credit: { toString: () => '0' },
        balance: { toString: () => '200', toFixed: (n: number) => '200' } },
    ];
    return [];
  }),
}));

describe('consolidate', () => {
  it('aggregates accounts across tenants', async () => {
    const db = { journalLine: { findMany: vi.fn(async () => []) } } as any;
    const rows = await consolidate(db, ['t1', 't2']);
    const cash = rows.find((r) => r.accountCode === '1111')!;
    expect(cash).toBeTruthy();
    expect(parseFloat(cash.perTenant['t1'])).toBe(100);
    expect(parseFloat(cash.perTenant['t2'])).toBe(200);
    expect(parseFloat(cash.total)).toBe(300);
  });

  it('nets out inter-company eliminations', async () => {
    const db = {
      journalLine: {
        findMany: vi.fn(async () => [
          {
            account: { code: '1111' },
            debit: { toString: () => '50' },
            credit: { toString: () => '0' },
          },
        ]),
      },
    } as any;
    const rows = await consolidate(db, ['t1', 't2']);
    const cash = rows.find((r) => r.accountCode === '1111')!;
    expect(parseFloat(cash.total)).toBe(250);   // 300 - 50 inter-co
  });
});
