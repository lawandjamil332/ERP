import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Line = z.object({
  productId: z.string(),
  qty: z.number(),
  unitCost: z.number().optional(),
  notes: z.string().optional(),
});

const Body = z.object({
  kind: z.enum(['TRANSFER', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'WRITE_OFF', 'OPENING_BALANCE']),
  fromWarehouseId: z.string().optional(),
  toWarehouseId: z.string().optional(),
  date: z.coerce.date().optional(),
  notes: z.string().optional(),
  lines: z.array(Line).min(1),
});

export async function GET() {
  const session = await requireSession();
  const rows = await db.stockOrder.findMany({
    where: { tenantId: session.tenantId },
    include: { lines: true },
    orderBy: { date: 'desc' },
    take: 100,
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;

  const year = (b.date ?? new Date()).getUTCFullYear();
  const prefix = b.kind === 'TRANSFER' ? 'TRF' : b.kind === 'WRITE_OFF' ? 'WOF' : 'ADJ';
  const last = await db.stockOrder.findFirst({
    where: { tenantId: session.tenantId, reference: { startsWith: `${prefix}-${year}-` } },
    orderBy: { reference: 'desc' }, select: { reference: true },
  });
  const seq = last ? parseInt(last.reference.split('-')[2], 10) + 1 : 1;
  const reference = `${prefix}-${year}-${seq.toString().padStart(5, '0')}`;

  const created = await db.stockOrder.create({
    data: {
      tenantId: session.tenantId, reference, kind: b.kind,
      fromWarehouseId: b.fromWarehouseId, toWarehouseId: b.toWarehouseId,
      date: b.date, notes: b.notes,
      lines: { create: b.lines.map((l) => ({
        productId: l.productId,
        qty: new Prisma.Decimal(l.qty.toString()),
        unitCost: l.unitCost !== undefined ? new Prisma.Decimal(l.unitCost.toString()) : undefined,
        notes: l.notes,
      })) },
    },
    include: { lines: true },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}
