import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import BigNumber from 'bignumber.js';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const OpenBody = z.object({
  number: z.string().min(1),
  guestName: z.string().min(1),
  guestIdType: z.string().optional(),
  guestIdNumber: z.string().optional(),
  roomNumber: z.string().min(1),
  checkIn: z.coerce.date(),
});

const ChargeBody = z.object({
  folioId: z.string(),
  description: z.string().min(1),
  amount: z.number().positive(),
  taxRate: z.number().min(0).max(1).default(0.10),
});

const CheckOutBody = z.object({ folioId: z.string() });

export async function GET() {
  const session = await requireSession();
  const folios = await db.hotelFolio.findMany({
    where: { tenantId: session.tenantId },
    include: { charges: true },
    orderBy: { checkIn: 'desc' },
    take: 200,
  });
  return NextResponse.json({ data: folios });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const body = await req.json().catch(() => ({}));

  if (body.action === 'charge') {
    const parsed = ChargeBody.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    const taxAmount = parsed.data.amount * parsed.data.taxRate;
    const c = await db.hotelFolioCharge.create({
      data: {
        folioId: parsed.data.folioId,
        description: parsed.data.description,
        amount: new Prisma.Decimal(parsed.data.amount),
        taxRate: new Prisma.Decimal(parsed.data.taxRate),
        taxAmount: new Prisma.Decimal(taxAmount),
      },
    });
    return NextResponse.json({ data: c }, { status: 201 });
  }

  if (body.action === 'checkout') {
    const parsed = CheckOutBody.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    const folio = await db.hotelFolio.update({
      where: { id: parsed.data.folioId },
      data: { status: 'CHECKED_OUT', checkOut: new Date() },
      include: { charges: true },
    });
    const total = folio.charges.reduce(
      (s, c) => s.plus(c.amount.toString()).plus(c.taxAmount.toString()),
      new BigNumber(0)
    );
    return NextResponse.json({ data: folio, total: total.toString() });
  }

  const parsed = OpenBody.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const folio = await db.hotelFolio.create({
    data: { tenantId: session.tenantId, ...parsed.data },
  });
  return NextResponse.json({ data: folio }, { status: 201 });
}
