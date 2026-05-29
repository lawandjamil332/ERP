import type { PrismaClient, Prisma } from '@prisma/client';

/**
 * Period lock. Once a month is CLOSED (e.g. after GCT filing) no entry may be
 * posted or dated into it. Fails OPEN: a month with no period row is treated
 * as open, so this never blocks day-one usage.
 */
export class PeriodClosedError extends Error {
  constructor(public year: number, public month: number) {
    super(`Accounting period ${year}-${String(month).padStart(2, '0')} is closed`);
    this.name = 'PeriodClosedError';
  }
}

type DbLike = PrismaClient | Prisma.TransactionClient;

export async function assertPeriodOpen(db: DbLike, tenantId: string, date: Date): Promise<void> {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const period = await db.accountingPeriod.findUnique({
    where: { tenantId_year_month: { tenantId, year, month } },
  });
  if (period?.status === 'CLOSED') throw new PeriodClosedError(year, month);
}

export function isPeriodClosedError(e: unknown): e is PeriodClosedError {
  return e instanceof Error && e.name === 'PeriodClosedError';
}
