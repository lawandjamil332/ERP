/**
 * Year-end closing routine.
 * At fiscal year-end (Iraqi entities almost always use calendar year), all
 * Income (4xxx) and Expense (5xxx, 6xxx, 7xxx, 8xxx) accounts are closed
 * to Current-Year P/L (34), then rolled into Retained Earnings (33).
 */

import BigNumber from 'bignumber.js';
import type { PrismaClient } from '@prisma/client';
import { trialBalance } from './reports';

export interface ClosingResult {
  closingJournalId: string;
  openingJournalId: string;
  netProfit: string;
}

export async function runYearEnd(
  db: PrismaClient,
  tenantId: string,
  fiscalYear: number
): Promise<ClosingResult> {
  const lastDay = new Date(Date.UTC(fiscalYear, 11, 31));
  const firstNextDay = new Date(Date.UTC(fiscalYear + 1, 0, 1));

  return db.$transaction(async (tx) => {
    const rows = await trialBalance(tx as any as PrismaClient, tenantId, lastDay);
    const findAccount = async (code: string) => {
      const a = await tx.account.findFirst({ where: { tenantId, code } });
      if (!a) throw new Error(`Account ${code} missing in tenant chart of accounts`);
      return a.id;
    };
    const pAndLId = await findAccount('34');
    const reId    = await findAccount('33');

    let totalRevenue = new BigNumber(0);
    let totalExpense = new BigNumber(0);
    const lines: { accountId: string; debit: BigNumber; credit: BigNumber }[] = [];

    for (const r of rows) {
      if (r.type === 'INCOME' && !r.balance.eq(0)) {
        const accountId = await findAccount(r.code);
        lines.push({ accountId, debit: r.balance, credit: new BigNumber(0) });
        totalRevenue = totalRevenue.plus(r.balance);
      }
      if (r.type === 'EXPENSE' && !r.balance.eq(0)) {
        const accountId = await findAccount(r.code);
        lines.push({ accountId, debit: new BigNumber(0), credit: r.balance });
        totalExpense = totalExpense.plus(r.balance);
      }
    }

    const netProfit = totalRevenue.minus(totalExpense);
    if (netProfit.gt(0)) lines.push({ accountId: pAndLId, debit: new BigNumber(0), credit: netProfit });
    else if (netProfit.lt(0)) lines.push({ accountId: pAndLId, debit: netProfit.abs(), credit: new BigNumber(0) });

    const closing = await tx.journal.create({
      data: {
        tenantId,
        reference: `YE-CLOSE-${fiscalYear}`,
        date: lastDay,
        memo: `Year-end closing ${fiscalYear}`,
        source: 'YEAR_END_CLOSING',
        isPosted: true,
        postedAt: new Date(),
        lines: {
          create: lines.map((l) => ({
            accountId: l.accountId,
            debit: l.debit.toString(),
            credit: l.credit.toString(),
          })),
        },
      },
    });

    const opening = await tx.journal.create({
      data: {
        tenantId,
        reference: `YE-OPEN-${fiscalYear + 1}`,
        date: firstNextDay,
        memo: `Roll P/L to retained earnings (FY ${fiscalYear})`,
        source: 'YEAR_END_CLOSING',
        isPosted: true,
        postedAt: new Date(),
        lines: netProfit.eq(0) ? { create: [] } : {
          create: netProfit.gt(0)
            ? [
              { accountId: pAndLId, debit: netProfit.toString(),  credit: '0' },
              { accountId: reId,    debit: '0',                    credit: netProfit.toString() },
            ]
            : [
              { accountId: reId,    debit: netProfit.abs().toString(), credit: '0' },
              { accountId: pAndLId, debit: '0',                          credit: netProfit.abs().toString() },
            ],
        },
      },
    });

    return {
      closingJournalId: closing.id,
      openingJournalId: opening.id,
      netProfit: netProfit.toString(),
    };
  });
}
