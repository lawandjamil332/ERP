/**
 * Project percentage-of-completion (POC) revenue recognition.
 *
 * Iraqi construction sector standard: revenue = (cost-incurred / total-estimated-cost) * contract value.
 * Retention (usually 10%) is held until project close; recorded as a contra-receivable.
 */

import type { PrismaClient } from '@prisma/client';
import BigNumber from 'bignumber.js';

export interface PocResult {
  projectId: string;
  contractValue: BigNumber;
  costsToDate: BigNumber;
  estimatedTotalCost: BigNumber;
  percentComplete: BigNumber;     // 0..1
  revenueEarnedToDate: BigNumber;
  revenueRecognizedPrior: BigNumber;
  revenueToRecognizeNow: BigNumber;
  retentionToDate: BigNumber;
  retentionRate: BigNumber;
}

export interface PocInput {
  projectId: string;
  /** Costs incurred to date (e.g. sum of project-tagged journal entries on expense accounts). */
  costsToDate: string;
  /** Latest engineer estimate of total cost at completion. */
  estimatedTotalCost: string;
  /** Already-recognized revenue in prior periods. */
  revenueRecognizedPrior: string;
  /** Retention rate (default 10%). */
  retentionRate?: string;
}

export async function computePoc(
  db: PrismaClient,
  tenantId: string,
  input: PocInput
): Promise<PocResult> {
  const project = await db.project.findFirst({
    where: { tenantId, id: input.projectId },
  });
  if (!project) throw new Error('project_not_found');

  const contractValue = new BigNumber(project.contractValue.toString());
  const costsToDate = new BigNumber(input.costsToDate);
  const estimatedTotalCost = new BigNumber(input.estimatedTotalCost);
  if (estimatedTotalCost.lte(0)) {
    throw new Error('estimatedTotalCost_must_be_positive');
  }
  const percentComplete = BigNumber.min(
    costsToDate.div(estimatedTotalCost),
    new BigNumber(1)
  );
  const revenueEarnedToDate = contractValue.times(percentComplete);
  const revenueRecognizedPrior = new BigNumber(input.revenueRecognizedPrior);
  const revenueToRecognizeNow = revenueEarnedToDate.minus(revenueRecognizedPrior);
  const retentionRate = new BigNumber(input.retentionRate ?? '0.10');
  const retentionToDate = revenueEarnedToDate.times(retentionRate);

  return {
    projectId: project.id,
    contractValue,
    costsToDate,
    estimatedTotalCost,
    percentComplete,
    revenueEarnedToDate,
    revenueRecognizedPrior,
    revenueToRecognizeNow,
    retentionToDate,
    retentionRate,
  };
}

export function buildPocJournalLines(args: {
  revenueToRecognizeNow: BigNumber;
  retentionDelta: BigNumber;
  /** Account codes from IUAS. */
  unbilledRevenueCode?: string;
  retentionReceivableCode?: string;
  contractRevenueCode?: string;
}): Array<{ accountCode: string; debit?: BigNumber; credit?: BigNumber }> {
  const unbilled = args.unbilledRevenueCode ?? '1125';
  const retention = args.retentionReceivableCode ?? '1126';
  const revenue = args.contractRevenueCode ?? '41';

  const revenueOnly = args.revenueToRecognizeNow.minus(args.retentionDelta);
  return [
    { accountCode: unbilled, debit: revenueOnly },
    { accountCode: retention, debit: args.retentionDelta },
    { accountCode: revenue, credit: args.revenueToRecognizeNow },
  ];
}
