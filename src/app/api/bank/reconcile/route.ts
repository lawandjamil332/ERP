import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = z.object({
    statementId: z.string(),
    journalLineId: z.string(),
  }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const updated = await db.bankStatement.update({
    where: { id: parsed.data.statementId },
    data: { matchedJournalLineId: parsed.data.journalLineId, reconciledAt: new Date() },
  });
  return NextResponse.json({ data: updated });
}
