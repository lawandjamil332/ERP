import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Body = z.object({
  auctionDate: z.coerce.date(),
  bidAmount: z.number().positive(),
  allocatedAmount: z.number().nonnegative().default(0),
  rate: z.number().positive(),
  bidBank: z.string().min(1),
  purpose: z.string().min(1),
  status: z.enum(['SUBMITTED', 'PARTIALLY_FILLED', 'FILLED', 'REJECTED']).default('SUBMITTED'),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await requireSession();
  const rows = await db.cbiAuction.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { auctionDate: 'desc' },
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;
  const row = await db.cbiAuction.create({
    data: {
      tenantId: session.tenantId,
      auctionDate: b.auctionDate,
      bidAmount: new Prisma.Decimal(b.bidAmount),
      allocatedAmount: new Prisma.Decimal(b.allocatedAmount),
      rate: new Prisma.Decimal(b.rate),
      bidBank: b.bidBank, purpose: b.purpose, status: b.status, notes: b.notes,
    },
  });
  return NextResponse.json({ data: row }, { status: 201 });
}
