import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Line = z.object({
  productId: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitOfMeasure: z.string().default('PCS'),
  targetPrice: z.number().nonnegative().optional(),
});

const Body = z.object({
  date: z.coerce.date(),
  supplierIds: z.array(z.string()).min(1),
  deadline: z.coerce.date().optional(),
  notes: z.string().optional(),
  lines: z.array(Line).min(1),
});

export async function GET() {
  const session = await requireSession();
  const rows = await db.quoteRequest.findMany({
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

  const year = b.date.getUTCFullYear();
  const last = await db.quoteRequest.findFirst({
    where: { tenantId: session.tenantId, number: { startsWith: `RFQ-${year}-` } },
    orderBy: { number: 'desc' }, select: { number: true },
  });
  const seq = last ? parseInt(last.number.split('-')[2], 10) + 1 : 1;
  const number = `RFQ-${year}-${seq.toString().padStart(5, '0')}`;

  const created = await db.quoteRequest.create({
    data: {
      tenantId: session.tenantId, number,
      date: b.date,
      supplierIds: b.supplierIds.join(','),
      deadline: b.deadline, notes: b.notes,
      lines: {
        create: b.lines.map((l) => ({
          productId: l.productId, description: l.description,
          quantity: new Prisma.Decimal(l.quantity),
          unitOfMeasure: l.unitOfMeasure,
          targetPrice: l.targetPrice != null ? new Prisma.Decimal(l.targetPrice) : null,
        })),
      },
    },
    include: { lines: true },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}
