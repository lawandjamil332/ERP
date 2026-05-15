/**
 * FIFO stock-lot consumption + expiry tracking.
 */

import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import BigNumber from 'bignumber.js';

export interface ConsumeArgs {
  tenantId: string;
  productId: string;
  warehouseId: string;
  quantity: BigNumber.Value;
}

export interface ConsumedSlice {
  lotId: string;
  lotNumber: string;
  qty: string;
  unitCost: string;
  expiryDate: Date | null;
}

export async function fifoConsume(
  db: PrismaClient,
  args: ConsumeArgs
): Promise<{ slices: ConsumedSlice[]; weightedAvgCost: string }> {
  let remaining = new BigNumber(args.quantity);
  const slices: ConsumedSlice[] = [];
  let totalCost = new BigNumber(0);
  let totalQty  = new BigNumber(0);
  const lots = await db.stockLot.findMany({
    where: { tenantId: args.tenantId, productId: args.productId, warehouseId: args.warehouseId, remainingQty: { gt: 0 } },
    orderBy: [{ expiryDate: 'asc' }, { receivedAt: 'asc' }],
  });
  for (const lot of lots) {
    if (remaining.lte(0)) break;
    const avail = new BigNumber(lot.remainingQty.toString());
    const take = BigNumber.minimum(avail, remaining);
    slices.push({
      lotId: lot.id, lotNumber: lot.lotNumber,
      qty: take.toString(), unitCost: lot.unitCost.toString(), expiryDate: lot.expiryDate,
    });
    totalCost = totalCost.plus(take.times(lot.unitCost.toString()));
    totalQty  = totalQty.plus(take);
    await db.stockLot.update({
      where: { id: lot.id },
      data: { remainingQty: new Prisma.Decimal(avail.minus(take).toString()) },
    });
    remaining = remaining.minus(take);
  }
  if (remaining.gt(0)) throw new Error(`insufficient_stock: short by ${remaining.toString()} units`);
  return { slices, weightedAvgCost: totalQty.gt(0) ? totalCost.div(totalQty).toFixed(4) : '0' };
}

export async function expiringSoon(db: PrismaClient, tenantId: string, days = 30) {
  const horizon = new Date(Date.now() + days * 86_400_000);
  return db.stockLot.findMany({
    where: { tenantId, remainingQty: { gt: 0 }, expiryDate: { not: null, lte: horizon } },
    orderBy: { expiryDate: 'asc' },
  });
}
