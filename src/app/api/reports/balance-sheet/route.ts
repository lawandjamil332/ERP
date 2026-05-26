import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { balanceSheet } from '@/lib/iraq/reports';

export async function GET(req: Request) {
  let session;
  try { session = await requireSession(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const asOf = new Date(searchParams.get('asOf') ?? new Date());
  const r = await balanceSheet(db, session.tenantId, asOf);
  return NextResponse.json({
    data: {
      assets: r.assets.toString(),
      liabilities: r.liabilities.toString(),
      equity: r.equity.toString(),
      currentYearProfit: r.currentYearProfit.toString(),
      lines: r.lines.map((l) => ({
        ...l, debit: l.debit.toString(), credit: l.credit.toString(), balance: l.balance.toString(),
      })),
    },
  });
}
