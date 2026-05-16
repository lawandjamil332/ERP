import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

/**
 * Rolling 7/30/365-day totals.
 * ?kind=receipts (payments IN) | expenses (payments OUT) | revenue (invoices POSTED)
 */
export async function GET(req: Request) {
  const session = await requireSession();
  const kind = new URL(req.url).searchParams.get('kind') ?? 'receipts';

  const now = Date.now();
  const d7 = new Date(now - 7 * 86400000);
  const d30 = new Date(now - 30 * 86400000);
  const d365 = new Date(now - 365 * 86400000);

  if (kind === 'revenue') {
    const rows = await db.invoice.findMany({
      where: { tenantId: session.tenantId, status: { in: ['POSTED', 'PARTIALLY_PAID', 'PAID'] }, date: { gte: d365 } },
      select: { date: true, total: true },
    });
    return NextResponse.json(reduceRolling(rows.map((r) => ({ date: r.date, amount: Number(r.total) })), d7, d30));
  }

  const dir = kind === 'expenses' ? 'OUT' : 'IN';
  const rows = await db.payment.findMany({
    where: { tenantId: session.tenantId, direction: dir, date: { gte: d365 } },
    select: { date: true, amount: true },
  });
  return NextResponse.json(reduceRolling(rows.map((r) => ({ date: r.date, amount: Number(r.amount) })), d7, d30));
}

function reduceRolling(rows: { date: Date; amount: number }[], d7: Date, d30: Date) {
  let s7 = 0, s30 = 0, s365 = 0;
  for (const r of rows) {
    s365 += r.amount;
    if (r.date >= d30) s30 += r.amount;
    if (r.date >= d7) s7 += r.amount;
  }
  return { d7: s7, d30: s30, d365: s365 };
}
