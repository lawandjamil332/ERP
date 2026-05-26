import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth/session';
import { parseCsv } from '@/lib/iraq/bank-parsers';

export async function POST(req: Request) {
  await requireSession();
  const parsed = z.object({ csv: z.string().min(1) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const { bank, rows } = parseCsv(parsed.data.csv);
  return NextResponse.json({ data: { bank, count: rows.length, rows } });
}
