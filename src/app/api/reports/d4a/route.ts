import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { buildD4A, toD4ACsv } from '@/lib/iraq/d4a';

export async function GET(req: Request) {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get('year') ?? new Date().getUTCFullYear() - 1);
  const fmt = (searchParams.get('format') ?? 'json').toLowerCase();
  const result = await buildD4A(db, session.tenantId, year);
  if (fmt === 'csv') {
    const csv = toD4ACsv(result.rows, result.totals);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="D4A-${year}.csv"`,
      },
    });
  }
  return NextResponse.json({ data: result, year });
}
