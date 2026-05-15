/**
 * Multi-company consolidation report.
 *
 * Aggregates trial-balance figures across multiple tenant entities under one
 * holding group. Eliminations (inter-company) must be tagged in JournalLine.memo
 * with prefix "INTERCO:" to be netted off automatically.
 */

import type { PrismaClient } from '@prisma/client';
import BigNumber from 'bignumber.js';
import { trialBalance } from './reports';

export interface ConsolidatedRow {
  accountCode: string;
  accountNameEn: string;
  type: string;
  perTenant: Record<string, string>;   // tenantId → amount
  total: string;
}

export async function consolidate(
  db: PrismaClient,
  memberTenantIds: string[],
  asOf: Date = new Date()
): Promise<ConsolidatedRow[]> {
  const map = new Map<string, ConsolidatedRow>();

  for (const tid of memberTenantIds) {
    const tb = await trialBalance(db, tid, asOf);
    for (const row of tb) {
      const key = row.code;
      let entry = map.get(key);
      if (!entry) {
        entry = {
          accountCode: row.code,
          accountNameEn: row.nameEn ?? row.nameAr ?? row.code,
          type: row.type,
          perTenant: {},
          total: '0',
        };
        map.set(key, entry);
      }
      entry.perTenant[tid] = row.balance.toFixed(4);
      entry.total = new BigNumber(entry.total).plus(row.balance).toFixed(4);
    }
  }

  // Eliminate inter-company balances tagged with "INTERCO:" memo.
  const intercos = await db.journalLine.findMany({
    where: {
      journal: { tenantId: { in: memberTenantIds } },
      memo: { startsWith: 'INTERCO:' },
    },
    include: { account: { select: { code: true } } },
  });
  for (const il of intercos) {
    const row = map.get(il.account.code);
    if (!row) continue;
    const adjustment = new BigNumber(il.debit.toString()).minus(il.credit.toString());
    row.total = new BigNumber(row.total).minus(adjustment).toFixed(4);
  }

  return Array.from(map.values()).sort((a, b) => a.accountCode.localeCompare(b.accountCode));
}
