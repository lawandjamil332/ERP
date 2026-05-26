/**
 * Generate salary payout batch files for Iraqi banks.
 * Common formats:
 *   - Rasheed Bank CSV (account, amount, name)
 *   - TBI CSV
 *   - Rafidain Bank fixed-width (older format, optional)
 *   - FIB (Iraq) JSON
 */

export interface PayoutLine {
  empNo: string;
  fullName: string;
  beneficiaryBankAccount: string;
  iban?: string;
  netAmount: string;
  currency: string;
  memo?: string;
}

export interface PayoutBatch {
  payerAccount: string;
  payerName: string;
  payerBank?: string;
  valueDate: string;          // YYYY-MM-DD
  lines: PayoutLine[];
  totalAmount: string;
}

export function rasheedCsv(batch: PayoutBatch): string {
  const header = 'Beneficiary Account,Beneficiary Name,Amount,Currency,Memo,Value Date';
  const rows = batch.lines.map((l) =>
    [l.beneficiaryBankAccount, l.fullName.replace(/,/g, ' '), l.netAmount, l.currency,
     (l.memo ?? `Salary ${l.empNo}`).replace(/,/g, ' '), batch.valueDate].join(',')
  );
  const trailer = `Total,${batch.lines.length},${batch.totalAmount},${batch.lines[0]?.currency ?? 'IQD'},,`;
  return [header, ...rows, trailer].join('\r\n');
}

export function tbiCsv(batch: PayoutBatch): string {
  const header = 'TXN_REF,DEBIT_ACC,CREDIT_ACC,AMOUNT,CCY,BENEFICIARY,DESCRIPTION,VAL_DATE';
  const rows = batch.lines.map((l, i) =>
    [`TBI-${batch.valueDate.replace(/-/g, '')}-${String(i + 1).padStart(4, '0')}`,
     batch.payerAccount, l.beneficiaryBankAccount, l.netAmount, l.currency,
     l.fullName.replace(/,/g, ' '), (l.memo ?? `Salary ${l.empNo}`).replace(/,/g, ' '),
     batch.valueDate].join(',')
  );
  return [header, ...rows].join('\r\n');
}

export function rafidainFixed(batch: PayoutBatch): string {
  function pad(s: string, n: number, side: 'L' | 'R' = 'R', ch = ' ') {
    s = s ?? '';
    if (s.length >= n) return s.slice(0, n);
    return side === 'R' ? s.padEnd(n, ch) : s.padStart(n, ch);
  }
  const rows = batch.lines.map((l) =>
    pad(l.beneficiaryBankAccount, 20)
    + pad(Math.round(parseFloat(l.netAmount)).toString(), 15, 'L', '0')
    + pad(l.fullName, 35)
    + pad(l.currency, 3)
    + pad(l.memo ?? '', 30)
  );
  const headerLine =
    pad('HDR', 3) + pad(batch.payerAccount, 20) + pad(batch.valueDate.replace(/-/g, ''), 8)
    + pad(String(batch.lines.length).padStart(6, '0'), 6)
    + pad(Math.round(parseFloat(batch.totalAmount)).toString(), 15, 'L', '0');
  return [headerLine, ...rows].join('\n');
}

export function fibJson(batch: PayoutBatch): string {
  return JSON.stringify({
    payerAccount: batch.payerAccount,
    payerName: batch.payerName,
    valueDate: batch.valueDate,
    items: batch.lines.map((l) => ({
      beneficiaryAccount: l.beneficiaryBankAccount,
      iban: l.iban,
      beneficiaryName: l.fullName,
      amount: l.netAmount,
      currency: l.currency,
      description: l.memo ?? `Salary ${l.empNo}`,
    })),
    total: batch.totalAmount,
  }, null, 2);
}
