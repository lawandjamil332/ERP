import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import BigNumber from 'bignumber.js';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Line = z.object({
  productId: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitOfMeasure: z.string().default('PCS'),
  unitPrice: z.number().nonnegative(),
});

const Body = z.object({
  date: z.coerce.date(),
  supplierId: z.string(),
  billId: z.string().optional(),
  reason: z.string().optional(),
  currency: z.string().length(3).default('IQD'),
  notes: z.string().optional(),
  lines: z.array(Line).min(1),
});

export async function GET() {
  const session = await requireSession();
  const rows = await db.purchaseReturn.findMany({
    where: { tenantId: session.tenantId },
    include: { lines: true },
    orderBy: { date: 'desc' },
    take: 200,
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;

  const total = b.lines.reduce((s, l) => s.plus(new BigNumber(l.quantity).times(l.unitPrice)), new BigNumber(0));

  const year = b.date.getUTCFullYear();
  const last = await db.purchaseReturn.findFirst({
    where: { tenantId: session.tenantId, number: { startsWith: `PR-${year}-` } },
    orderBy: { number: 'desc' }, select: { number: true },
  });
  const seq = last ? parseInt(last.number.split('-')[2], 10) + 1 : 1;
  const number = `PR-${year}-${seq.toString().padStart(5, '0')}`;

  const created = await db.purchaseReturn.create({
    data: {
      tenantId: session.tenantId, number,
      date: b.date, supplierId: b.supplierId, billId: b.billId,
      reason: b.reason, currency: b.currency, notes: b.notes,
      total: new Prisma.Decimal(total.toString()),
      lines: {
        create: b.lines.map((l) => ({
          productId: l.productId, description: l.description,
          quantity: new Prisma.Decimal(l.quantity),
          unitOfMeasure: l.unitOfMeasure,
          unitPrice: new Prisma.Decimal(l.unitPrice),
          lineTotal: new Prisma.Decimal(new BigNumber(l.quantity).times(l.unitPrice).toString()),
        })),
      },
    },
    include: { lines: true },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}
