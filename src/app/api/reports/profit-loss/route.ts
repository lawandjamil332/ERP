import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { incomeStatement } from '@/lib/iraq/reports';

export async function GET(req: Request) {
  let session;
  try { session = await requireSession(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const from = new Date(searchParams.get('from') ?? new Date(new Date().getUTCFullYear(), 0, 1));
  const to   = new Date(searchParams.get('to') ?? new Date());
  const r = await incomeStatement(db, session.tenantId, from, to);
  return NextResponse.json({
    data: {
      revenue: r.revenue.toString(),
      cogs: r.cogs.toString(),
      grossProfit: r.grossProfit.toString(),
      operatingExpenses: r.operatingExpenses.toString(),
      otherIncome: r.otherIncome.toString(),
      netProfit: r.netProfit.toString(),
      lines: r.lines.map((l) => ({
        ...l, debit: l.debit.toString(), credit: l.credit.toString(), balance: l.balance.toString(),
      })),
    },
  });
}
