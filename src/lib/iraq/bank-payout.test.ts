import { describe, it, expect } from 'vitest';
import { rasheedCsv, tbiCsv, rafidainFixed, fibJson } from './bank-payout';

const batch = {
  payerAccount: '0011223344',
  payerName: 'Iraq ERP Inc',
  valueDate: '2026-03-01',
  totalAmount: '1500000',
  lines: [
    { empNo: 'E001', fullName: 'Ahmed Ali', beneficiaryBankAccount: '5566778800', netAmount: '500000', currency: 'IQD' },
    { empNo: 'E002', fullName: 'Sara, Hassan', beneficiaryBankAccount: '5566778801', netAmount: '1000000', currency: 'IQD' },
  ],
};

describe('rasheedCsv', () => {
  it('emits header, rows, trailer with CRLF', () => {
    const out = rasheedCsv(batch);
    const lines = out.split('\r\n');
    expect(lines[0]).toMatch(/Beneficiary Account/);
    expect(lines).toHaveLength(4);   // hdr + 2 rows + trailer
    expect(lines[3]).toMatch(/Total,2,1500000/);
  });

  it('strips commas from beneficiary names', () => {
    const out = rasheedCsv(batch);
    expect(out).not.toMatch(/Sara,/);
    expect(out).toMatch(/Sara  ?Hassan/);
  });
});

describe('tbiCsv', () => {
  it('generates sequential txn refs', () => {
    const out = tbiCsv(batch);
    expect(out).toMatch(/TBI-20260301-0001/);
    expect(out).toMatch(/TBI-20260301-0002/);
  });
});

describe('rafidainFixed', () => {
  it('produces fixed-width header + rows', () => {
    const out = rafidainFixed(batch);
    const lines = out.split('\n');
    expect(lines).toHaveLength(3);    // hdr + 2 rows
    expect(lines[0].startsWith('HDR')).toBe(true);
  });
});

describe('fibJson', () => {
  it('produces valid JSON with items array', () => {
    const out = fibJson(batch);
    const parsed = JSON.parse(out);
    expect(parsed.items).toHaveLength(2);
    expect(parsed.total).toBe('1500000');
  });
});
