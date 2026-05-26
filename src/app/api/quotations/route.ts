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
  discount: z.number().nonnegative().default(0),
  taxRate: z.number().min(0).max(1).default(0),
});

const Body = z.object({
  contactId: z.string(),
  date: z.coerce.date(),
  validUntil: z.coerce.date().optional(),
  currency: z.string().length(3).default('IQD'),
  fxRate: z.number().positive().default(1),
  notes: z.string().optional(),
  lines: z.array(Line).min(1),
});

export async function GET() {
  const session = await requireSession();
  const rows = await db.quotation.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { date: 'desc' },
    take: 200,
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }
  const b = parsed.data;

  const lines = b.lines.map((l) => {
    const base = new BigNumber(l.quantity).times(l.unitPrice).minus(l.discount);
    const tax = base.times(l.taxRate);
    return { ...l, base, tax, total: base.plus(tax) };
  });
  const subtotal = lines.reduce((s, l) => s.plus(l.base), new BigNumber(0));
  const taxTotal = lines.reduce((s, l) => s.plus(l.tax), new BigNumber(0));
  const discountTotal = lines.reduce((s, l) => s.plus(l.discount), new BigNumber(0));
  const total = subtotal.plus(taxTotal);

  const year = b.date.getUTCFullYear();
  const last = await db.quotation.findFirst({
    where: { tenantId: session.tenantId, number: { startsWith: `QT-${year}-` } },
    orderBy: { number: 'desc' }, select: { number: true },
  });
  const seq = last ? parseInt(last.number.split('-')[2], 10) + 1 : 1;
  const number = `QT-${year}-${seq.toString().padStart(5, '0')}`;

  const created = await db.quotation.create({
    data: {
      tenantId: session.tenantId, number,
      contactId: b.contactId, date: b.date, validUntil: b.validUntil,
      currency: b.currency, fxRate: new Prisma.Decimal(b.fxRate),
      subtotal: new Prisma.Decimal(subtotal.toString()),
      taxTotal: new Prisma.Decimal(taxTotal.toString()),
      discountTotal: new Prisma.Decimal(discountTotal.toString()),
      total: new Prisma.Decimal(total.toString()),
      notes: b.notes,
      lines: {
        create: lines.map((l) => ({
          productId: l.productId, description: l.description,
          quantity: new Prisma.Decimal(l.quantity),
          unitOfMeasure: l.unitOfMeasure,
          unitPrice: new Prisma.Decimal(l.unitPrice),
          discount: new Prisma.Decimal(l.discount),
          taxRate: new Prisma.Decimal(l.taxRate),
          taxAmount: new Prisma.Decimal(l.tax.toString()),
          lineTotal: new Prisma.Decimal(l.total.toString()),
        })),
      },
    },
    include: { lines: true },
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
