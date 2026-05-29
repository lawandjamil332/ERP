import type { Prisma } from '@prisma/client';

/**
 * Gapless, race-safe document numbering. MUST be called inside a transaction.
 * Uses an atomic `update … increment` on a unique (tenant,key,year) row, so two
 * concurrent requests can never get the same number (unlike "count + 1").
 *
 *   const ref = await nextSequence(tx, tenantId, 'INV'); // INV-2026-00001
 */
export async function nextSequence(
  tx: Prisma.TransactionClient,
  tenantId: string,
  key: string,
  date: Date = new Date(),
): Promise<string> {
  const year = date.getUTCFullYear();

  // Ensure the row exists, then atomically increment and read the new value.
  await tx.documentSequence.upsert({
    where: { tenantId_key_year: { tenantId, key, year } },
    create: { tenantId, key, year, counter: 0 },
    update: {},
  });
  const updated = await tx.documentSequence.update({
    where: { tenantId_key_year: { tenantId, key, year } },
    data: { counter: { increment: 1 } },
    select: { counter: true },
  });

  return `${key}-${year}-${String(updated.counter).padStart(5, '0')}`;
}
