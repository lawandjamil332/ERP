import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { trialBalance } from '@/lib/iraq/reports';

export async function GET(req: Request) {
  let session;
  try { session = await requireSession(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const asOf = searchParams.get('asOf');
  const rows = await trialBalance(db, session.tenantId, asOf ? new Date(asOf) : undefined);
  return NextResponse.json({
    data: rows.map((r) => ({
      ...r, debit: r.debit.toString(), credit: r.credit.toString(), balance: r.balance.toString(),
    })),
  });
}
