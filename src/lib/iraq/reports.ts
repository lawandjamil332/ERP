/**
 * Financial reports computed from the journal ledger.
 *
 * Trial Balance — every account's debit and credit sums.
 * Income Statement — revenue minus expenses, classified by IUAS bands.
 * Balance Sheet — assets, liabilities, equity at a point in time.
 */

import type { PrismaClient } from '@prisma/client';
import BigNumber from 'bignumber.js';

export interface ReportRow {
  code: string;
  nameAr: string;
  nameEn: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
  debit: BigNumber;
  credit: BigNumber;
  /// Signed balance: positive = natural side of the account
  ///   ASSET, EXPENSE  → debit - credit
  ///   LIABILITY, EQUITY, INCOME → credit - debit
  balance: BigNumber;
}

export async function trialBalance(
  db: PrismaClient,
  tenantId: string,
  asOf?: Date
): Promise<ReportRow[]> {
  const lines = await db.journalLine.findMany({
    where: {
      journal: {
        tenantId,
        isPosted: true,
        ...(asOf ? { date: { lte: asOf } } : {}),
      },
    },
    include: { account: true },
  });

  const acc = new Map<string, ReportRow>();
  for (const l of lines) {
    const row = acc.get(l.account.code) ?? {
      code: l.account.code, nameAr: l.account.nameAr, nameEn: l.account.nameEn,
      type: l.account.type,
      debit: new BigNumber(0), credit: new BigNumber(0), balance: new BigNumber(0),
    };
    row.debit  = row.debit.plus(l.debit.toString());
    row.credit = row.credit.plus(l.credit.toString());
    acc.set(l.account.code, row);
  }

  for (const row of acc.values()) {
    if (row.type === 'ASSET' || row.type === 'EXPENSE') {
      row.balance = row.debit.minus(row.credit);
    } else {
      row.balance = row.credit.minus(row.debit);
    }
  }

  return Array.from(acc.values()).sort((a, b) => a.code.localeCompare(b.code));
}

export interface IncomeStatement {
  revenue: BigNumber;
  cogs: BigNumber;
  grossProfit: BigNumber;
  operatingExpenses: BigNumber;
  otherIncome: BigNumber;
  netProfit: BigNumber;
  lines: ReportRow[];
}

export async function incomeStatement(
  db: PrismaClient,
  tenantId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<IncomeStatement> {
  const lines = await db.journalLine.findMany({
    where: {
      journal: { tenantId, isPosted: true, date: { gte: periodStart, lte: periodEnd } },
      account: { type: { in: ['INCOME', 'EXPENSE'] } },
    },
    include: { account: true },
  });
  const rows = aggregateByAccount(lines);

  const revenue = sumWhere(rows, (r) => r.code.startsWith('41') && r.code !== '414');
  const returnsDiscounts = sumWhere(rows, (r) => r.code === '414');
  const netRevenue = revenue.minus(returnsDiscounts);
  const cogs = sumWhere(rows, (r) => r.code.startsWith('6'));
  const grossProfit = netRevenue.minus(cogs);
  const operatingExpenses = sumWhere(rows, (r) => r.code.startsWith('5'));
  const otherIncome = sumWhere(rows, (r) => r.code.startsWith('42'));
  const netProfit = grossProfit.minus(operatingExpenses).plus(otherIncome);

  return {
    revenue: netRevenue, cogs, grossProfit, operatingExpenses, otherIncome,
    netProfit, lines: rows,
  };
}

export interface BalanceSheet {
  assets: BigNumber;
  liabilities: BigNumber;
  equity: BigNumber;
  currentYearProfit: BigNumber;
  lines: ReportRow[];
}

export async function balanceSheet(
  db: PrismaClient,
  tenantId: string,
  asOf: Date
): Promise<BalanceSheet> {
  const lines = await db.journalLine.findMany({
    where: {
      journal: { tenantId, isPosted: true, date: { lte: asOf } },
    },
    include: { account: true },
  });
  const rows = aggregateByAccount(lines);

  const assets      = sumWhere(rows, (r) => r.type === 'ASSET');
  const liabilities = sumWhere(rows, (r) => r.type === 'LIABILITY');
  let   equity      = sumWhere(rows, (r) => r.type === 'EQUITY');

  const revenue  = sumWhere(rows, (r) => r.type === 'INCOME');
  const expenses = sumWhere(rows, (r) => r.type === 'EXPENSE');
  const currentYearProfit = revenue.minus(expenses);
  equity = equity.plus(currentYearProfit);

  return { assets, liabilities, equity, currentYearProfit, lines: rows };
}

function aggregateByAccount(
  lines: Array<{ debit: any; credit: any; account: { code: string; nameAr: string; nameEn: string; type: any } }>
): ReportRow[] {
  const acc = new Map<string, ReportRow>();
  for (const l of lines) {
    const row = acc.get(l.account.code) ?? {
      code: l.account.code, nameAr: l.account.nameAr, nameEn: l.account.nameEn,
      type: l.account.type,
      debit: new BigNumber(0), credit: new BigNumber(0), balance: new BigNumber(0),
    };
    row.debit  = row.debit.plus(l.debit.toString());
    row.credit = row.credit.plus(l.credit.toString());
    acc.set(l.account.code, row);
  }
  for (const row of acc.values()) {
    row.balance = (row.type === 'ASSET' || row.type === 'EXPENSE')
      ? row.debit.minus(row.credit)
      : row.credit.minus(row.debit);
  }
  return Array.from(acc.values()).sort((a, b) => a.code.localeCompare(b.code));
}

function sumWhere(rows: ReportRow[], pred: (r: ReportRow) => boolean): BigNumber {
  return rows.filter(pred).reduce((s, r) => s.plus(r.balance), new BigNumber(0));
}
