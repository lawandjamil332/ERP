import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import BigNumber from 'bignumber.js';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Body = z.object({
  date: z.coerce.date(),
  amount: z.number().positive(),
  documents: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }
  const lc = await db.letterOfCredit.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { drawings: true },
  });
  if (!lc) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const newDrawn = new BigNumber(lc.drawnAmount.toString()).plus(parsed.data.amount);
  const cap = new BigNumber(lc.amount.toString());
  if (newDrawn.gt(cap)) {
    return NextResponse.json({ error: 'amount_exceeds_lc_balance', remaining: cap.minus(lc.drawnAmount.toString()).toFixed(2) }, { status: 400 });
  }

  await db.lcDrawing.create({
    data: {
      lcId: lc.id,
      date: parsed.data.date,
      amount: new Prisma.Decimal(parsed.data.amount),
      documents: parsed.data.documents, notes: parsed.data.notes,
    },
  });
  const status = newDrawn.eq(cap) ? 'FULLY_DRAWN' : 'PARTIALLY_DRAWN';
  const updated = await db.letterOfCredit.update({
    where: { id: lc.id },
    data: { drawnAmount: new Prisma.Decimal(newDrawn.toString()), status },
    include: { drawings: { orderBy: { date: 'desc' } } },
  });
  return NextResponse.json({ data: updated });
}
