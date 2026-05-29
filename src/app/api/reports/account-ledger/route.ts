import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import BigNumber from 'bignumber.js';

export async function GET(req: Request) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get('accountId');
  if (!accountId) {
    return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
  }

  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const dateFilter: Record<string, Date> = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to);

  const lines = await db.journalLine.findMany({
    where: {
      accountId,
      journal: {
        tenantId: session.tenantId,
        isPosted: true,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
    },
    include: {
      journal: { select: { reference: true, date: true, memo: true } },
    },
    orderBy: { journal: { date: 'asc' } },
  });

  let runningBalance = new BigNumber(0);
  const data = lines.map((l) => {
    const debit = new BigNumber(l.debit.toString());
    const credit = new BigNumber(l.credit.toString());
    runningBalance = runningBalance.plus(debit).minus(credit);
    return {
      date: l.journal.date.toISOString(),
      number: l.journal.reference,
      description: l.memo ?? l.journal.memo ?? '',
      debit: debit.toString(),
      credit: credit.toString(),
      balance: runningBalance.toString(),
    };
  });

  return NextResponse.json({ data });
}
