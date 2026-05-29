import { NextResponse } from 'next/server';
import BigNumber from 'bignumber.js';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

export async function GET(req: Request) {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const from = new Date(searchParams.get('from') ?? new Date(new Date().getFullYear(), 0, 1).toISOString());
  const to = new Date(searchParams.get('to') ?? new Date().toISOString());

  const payments = await db.payment.findMany({
    where: { tenantId: session.tenantId, date: { gte: from, lte: to } },
    select: { id: true, number: true, date: true, amount: true, direction: true, method: true, reference: true },
  });

  let cashIn = new BigNumber(0);
  let cashOut = new BigNumber(0);
  const byMethod: Record<string, { in: BigNumber; out: BigNumber }> = {};
  const monthly: Record<string, { in: BigNumber; out: BigNumber }> = {};

  for (const p of payments) {
    const amt = new BigNumber(p.amount.toString());
    const m = p.method ?? 'OTHER';
    byMethod[m] ??= { in: new BigNumber(0), out: new BigNumber(0) };
    const month = p.date.toISOString().slice(0, 7);
    monthly[month] ??= { in: new BigNumber(0), out: new BigNumber(0) };

    if (p.direction === 'IN') {
      cashIn = cashIn.plus(amt);
      byMethod[m].in = byMethod[m].in.plus(amt);
      monthly[month].in = monthly[month].in.plus(amt);
    } else {
      cashOut = cashOut.plus(amt);
      byMethod[m].out = byMethod[m].out.plus(amt);
      monthly[month].out = monthly[month].out.plus(amt);
    }
  }

  return NextResponse.json({
    data: {
      cashIn: cashIn.toNumber(),
      cashOut: cashOut.toNumber(),
      netCashFlow: cashIn.minus(cashOut).toNumber(),
      byMethod: Object.entries(byMethod).map(([method, v]) => ({
        method, in: v.in.toNumber(), out: v.out.toNumber(), net: v.in.minus(v.out).toNumber(),
      })),
      monthly: Object.entries(monthly)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, v]) => ({
          month, in: v.in.toNumber(), out: v.out.toNumber(), net: v.in.minus(v.out).toNumber(),
        })),
    },
  });
}
