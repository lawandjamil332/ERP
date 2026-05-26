import { describe, it, expect } from 'vitest';
import { assertBalanced, buildInvoiceJournalLines, buildPayrollJournalLines } from './journals';

describe('assertBalanced', () => {
  it('throws when debits != credits', () => {
    expect(() => assertBalanced([
      { accountCode: '1', debit: 100 },
      { accountCode: '2', credit: 90 },
    ])).toThrow(/not balanced/);
  });
  it('passes when balanced', () => {
    expect(() => assertBalanced([
      { accountCode: '1', debit: 100 },
      { accountCode: '2', credit: 100 },
    ])).not.toThrow();
  });
});

describe('buildInvoiceJournalLines', () => {
  it('routes domestic to 411 and export to 412', () => {
    const dom = buildInvoiceJournalLines({
      subtotal: 100, taxTotal: 10, total: 110, isExport: false,
      contactId: 'c1', currency: 'IQD', fxRate: 1,
    });
    expect(dom.find((l) => l.accountCode === '411')).toBeDefined();
    const exp = buildInvoiceJournalLines({
      subtotal: 100, taxTotal: 10, total: 110, isExport: true,
      contactId: 'c1', currency: 'IQD', fxRate: 1,
    });
    expect(exp.find((l) => l.accountCode === '412')).toBeDefined();
  });
  it('balances', () => {
    const lines = buildInvoiceJournalLines({
      subtotal: 100, taxTotal: 10, total: 110, isExport: false,
      contactId: 'c1', currency: 'IQD', fxRate: 1,
    });
    expect(() => assertBalanced(lines)).not.toThrow();
  });
});

describe('buildPayrollJournalLines', () => {
  it('balances for typical payroll', () => {
    const lines = buildPayrollJournalLines({
      gross: 1_000_000, ssEmployee: 50_000, ssEmployer: 120_000,
      incomeTax: 80_000, otherDeductions: 0, net: 870_000,
    });
    expect(() => assertBalanced(lines)).not.toThrow();
  });
});
