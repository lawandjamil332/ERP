/**
 * Aged AR / AP report — 0-30 / 31-60 / 61-90 / 90+ buckets relative to due date.
 */

import type { PrismaClient } from '@prisma/client';
import BigNumber from 'bignumber.js';

export interface AgingBucket {
  current: BigNumber;
  d31_60: BigNumber;
  d61_90: BigNumber;
  d91_plus: BigNumber;
  notDue: BigNumber;
  total: BigNumber;
}

export interface AgingRow {
  contactId: string;
  contactName: string;
  buckets: AgingBucket;
}

function emptyBucket(): AgingBucket {
  return {
    current: new BigNumber(0), d31_60: new BigNumber(0), d61_90: new BigNumber(0),
    d91_plus: new BigNumber(0), notDue: new BigNumber(0), total: new BigNumber(0),
  };
}

function bucketFor(daysOverdue: number): keyof AgingBucket {
  if (daysOverdue < 0) return 'notDue';
  if (daysOverdue <= 30) return 'current';
  if (daysOverdue <= 60) return 'd31_60';
  if (daysOverdue <= 90) return 'd61_90';
  return 'd91_plus';
}

export async function agedReceivables(
  db: PrismaClient, tenantId: string, asOf: Date = new Date()
): Promise<{ rows: AgingRow[]; totals: AgingBucket }> {
  const invoices = await db.invoice.findMany({
    where: { tenantId, deletedAt: null, status: { in: ['POSTED', 'PARTIALLY_PAID', 'OVERDUE'] } },
    select: {
      contactId: true, dueDate: true, date: true,
      total: true, amountPaid: true,
      contact: { select: { nameAr: true, nameEn: true } },
    },
  });

  const map = new Map<string, AgingRow>();
  const totals = emptyBucket();

  for (const inv of invoices) {
    const balance = new BigNumber(inv.total.toString()).minus(inv.amountPaid.toString());
    if (balance.lte(0)) continue;
    const ref = inv.dueDate ?? inv.date;
    const days = Math.floor((asOf.getTime() - ref.getTime()) / 86_400_000);
    const slot = bucketFor(days);
    const row = map.get(inv.contactId) ?? {
      contactId: inv.contactId,
      contactName: inv.contact.nameAr ?? inv.contact.nameEn ?? '—',
      buckets: emptyBucket(),
    };
    row.buckets[slot] = row.buckets[slot].plus(balance);
    row.buckets.total = row.buckets.total.plus(balance);
    map.set(inv.contactId, row);
    totals[slot] = totals[slot].plus(balance);
    totals.total = totals.total.plus(balance);
  }
  const rows = Array.from(map.values()).sort((a, b) => b.buckets.total.minus(a.buckets.total).toNumber());
  return { rows, totals };
}

export async function agedPayables(
  db: PrismaClient, tenantId: string, asOf: Date = new Date()
): Promise<{ rows: AgingRow[]; totals: AgingBucket }> {
  const bills = await db.bill.findMany({
    where: { tenantId, deletedAt: null, status: { in: ['POSTED', 'PARTIALLY_PAID', 'OVERDUE'] } },
    select: {
      supplierId: true, dueDate: true, date: true,
      total: true, amountPaid: true,
      supplier: { select: { nameAr: true, nameEn: true } },
    },
  });
  const map = new Map<string, AgingRow>();
  const totals = emptyBucket();
  for (const b of bills) {
    const balance = new BigNumber(b.total.toString()).minus(b.amountPaid.toString());
    if (balance.lte(0)) continue;
    const ref = b.dueDate ?? b.date;
    const days = Math.floor((asOf.getTime() - ref.getTime()) / 86_400_000);
    const slot = bucketFor(days);
    const row = map.get(b.supplierId) ?? {
      contactId: b.supplierId,
      contactName: b.supplier.nameAr ?? b.supplier.nameEn ?? '—',
      buckets: emptyBucket(),
    };
    row.buckets[slot] = row.buckets[slot].plus(balance);
    row.buckets.total = row.buckets.total.plus(balance);
    map.set(b.supplierId, row);
    totals[slot] = totals[slot].plus(balance);
    totals.total = totals.total.plus(balance);
  }
  const rows = Array.from(map.values()).sort((a, b) => b.buckets.total.minus(a.buckets.total).toNumber());
  return { rows, totals };
}

export function bucketToObject(b: AgingBucket) {
  return {
    notDue: b.notDue.toFixed(0),
    current: b.current.toFixed(0),
    d31_60: b.d31_60.toFixed(0),
    d61_90: b.d61_90.toFixed(0),
    d91_plus: b.d91_plus.toFixed(0),
    total: b.total.toFixed(0),
  };
}
