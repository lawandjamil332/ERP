/**
 * Double-entry journal helpers. Every posting must balance (sum debits = sum credits)
 * before it's committed.
 */
import BigNumber from 'bignumber.js';

export interface JournalLineInput {
  accountCode: string;
  debit?: BigNumber.Value;
  credit?: BigNumber.Value;
  memo?: string;
  contactId?: string;
  costCenter?: string;
  currency?: string;
  fxRate?: BigNumber.Value;
}

export function assertBalanced(lines: JournalLineInput[]) {
  const totalD = lines.reduce((s, l) => s.plus(new BigNumber(l.debit ?? 0)),  new BigNumber(0));
  const totalC = lines.reduce((s, l) => s.plus(new BigNumber(l.credit ?? 0)), new BigNumber(0));
  if (!totalD.eq(totalC)) {
    throw new Error(
      `Journal not balanced: debits=${totalD.toString()} credits=${totalC.toString()}`
    );
  }
  if (totalD.eq(0)) {
    throw new Error('Journal has zero value');
  }
}

/**
 * Build the journal lines for a posted sales invoice:
 *   DR  Trade Receivables          (1121)        gross total
 *     CR  Sales Revenue            (411 or 412)  net subtotal
 *     CR  Sales Tax Payable        (2134)        tax total
 *   (Stock movements + COGS are posted by inventory service separately.)
 */
export function buildInvoiceJournalLines(args: {
  subtotal: BigNumber.Value;
  taxTotal: BigNumber.Value;
  total: BigNumber.Value;
  isExport: boolean;
  contactId: string;
  currency: string;
  fxRate: BigNumber.Value;
}): JournalLineInput[] {
  const salesAccount = args.isExport ? '412' : '411';
  const lines: JournalLineInput[] = [
    { accountCode: '1121', debit: args.total, contactId: args.contactId, currency: args.currency, fxRate: args.fxRate },
    { accountCode: salesAccount, credit: args.subtotal, currency: args.currency, fxRate: args.fxRate },
  ];
  if (new BigNumber(args.taxTotal).gt(0)) {
    lines.push({ accountCode: '2134', credit: args.taxTotal, currency: args.currency, fxRate: args.fxRate });
  }
  return lines;
}

/**
 * Build journal lines for a payroll run:
 *   DR Salaries Expense (511)        gross
 *   DR Employer SS Expense (515)     ssEmployer
 *     CR Accrued Salaries (212)      net
 *     CR Employee PIT Payable (2131) incomeTax
 *     CR SS Employee Payable (2132)  ssEmployee
 *     CR SS Employer Payable (2133)  ssEmployer
 */
export function buildPayrollJournalLines(args: {
  gross: BigNumber.Value;
  ssEmployee: BigNumber.Value;
  ssEmployer: BigNumber.Value;
  incomeTax: BigNumber.Value;
  otherDeductions: BigNumber.Value;
  net: BigNumber.Value;
}): JournalLineInput[] {
  return [
    { accountCode: '511',  debit: args.gross },
    { accountCode: '515',  debit: args.ssEmployer },
    { accountCode: '212',  credit: args.net },
    { accountCode: '2131', credit: args.incomeTax },
    { accountCode: '2132', credit: args.ssEmployee },
    { accountCode: '2133', credit: args.ssEmployer },
    ...(new BigNumber(args.otherDeductions).gt(0)
      ? [{ accountCode: '1122', credit: args.otherDeductions }]
      : []),
  ];
}
