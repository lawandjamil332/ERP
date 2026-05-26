import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Open = z.object({ terminalId: z.string(), openingFloat: z.number().nonnegative().default(0) });
const Close = z.object({ sessionId: z.string(), closingCash: z.number().nonnegative() });

export async function POST(req: Request) {
  const session = await requireSession();
  const body = await req.json().catch(() => ({}));
  if (body.action === 'close') {
    const p = Close.safeParse(body);
    if (!p.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    const closed = await db.posSession.update({
      where: { id: p.data.sessionId },
      data: { closedAt: new Date(), closingCash: new Prisma.Decimal(p.data.closingCash) },
    });
    return NextResponse.json({ data: closed });
  }
  const p = Open.safeParse(body);
  if (!p.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const opened = await db.posSession.create({
    data: { terminalId: p.data.terminalId, openingFloat: new Prisma.Decimal(p.data.openingFloat) },
  });
  return NextResponse.json({ data: opened }, { status: 201 });
}
