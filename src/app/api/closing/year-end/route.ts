import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { runYearEnd } from '@/lib/iraq/closing';

export async function POST(req: Request) {
  let session;
  try { session = await requireSession(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const body = await req.json().catch(() => ({}));
  const parsed = z.object({ fiscalYear: z.number().int().min(2020).max(2100) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const result = await runYearEnd(db, session.tenantId, parsed.data.fiscalYear);
  return NextResponse.json({ data: result });
}
