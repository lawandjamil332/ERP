/**
 * Iraqi Anti-Money-Laundering threshold detection.
 *
 * Iraqi FIU (Financial Intelligence Unit) requires reports for:
 *   - Cash transactions over IQD 15,000,000 (~USD 10,000)
 *   - Series of transactions appearing to evade the threshold
 *
 * This module flags transactions and creates AmlReport rows. The actual
 * filing portal is operated by the CBI's AML/CFT office; for now we collect
 * the data for manual or future automated submission.
 */

import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import BigNumber from 'bignumber.js';

export const AML_CASH_THRESHOLD_IQD = 15_000_000;

export interface AmlTrigger {
  tenantId: string;
  triggerEntity: 'Payment' | 'Invoice' | 'Bill' | 'POSOrder' | 'Cheque';
  triggerId: string;
  amount: BigNumber.Value;
  currency: string;
  fxRate?: BigNumber.Value;
  method?: string | null;
  contactName?: string | null;
}

function inIqd(amount: BigNumber.Value, currency: string, fxRate?: BigNumber.Value): BigNumber {
  const a = new BigNumber(amount);
  if (currency === 'IQD') return a;
  return a.times(fxRate ?? 1);
}

export function exceedsThreshold(args: AmlTrigger): boolean {
  if (args.method && !['CASH', 'CHEQUE'].includes(args.method)) return false;
  const iqd = inIqd(args.amount, args.currency, args.fxRate);
  return iqd.gte(AML_CASH_THRESHOLD_IQD);
}

export async function flagIfNeeded(db: PrismaClient, args: AmlTrigger): Promise<string | null> {
  if (!exceedsThreshold(args)) return null;
  const iqd = inIqd(args.amount, args.currency, args.fxRate);
  const row = await db.amlReport.create({
    data: {
      tenantId: args.tenantId,
      triggerEntity: args.triggerEntity,
      triggerId: args.triggerId,
      contactName: args.contactName ?? null,
      amount: new Prisma.Decimal(iqd.toFixed(4)),
      currency: 'IQD',
      reason: `Cash-equivalent transaction of ${iqd.toFixed(0)} IQD via ${args.method ?? 'unknown method'} crosses the ${AML_CASH_THRESHOLD_IQD.toLocaleString()} IQD AML threshold.`,
    },
  });
  return row.id;
}
