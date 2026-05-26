import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import BigNumber from 'bignumber.js';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Line = z.object({
  productId: z.string(),
  countedQty: z.number().nonnegative(),
  notes: z.string().optional(),
});

const Body = z.object({
  warehouseId: z.string(),
  countedAt: z.coerce.date(),
  notes: z.string().optional(),
  lines: z.array(Line).min(1),
});

export async function GET() {
  const session = await requireSession();
  const rows = await db.stockCount.findMany({
    where: { tenantId: session.tenantId },
    include: { lines: true },
    orderBy: { countedAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;

  const productIds = b.lines.map((l) => l.productId);
  const stocks = await db.stock.findMany({
    where: { warehouseId: b.warehouseId, productId: { in: productIds } },
    select: { productId: true, quantity: true },
  });
  const stockMap = new Map(stocks.map((s) => [s.productId, s.quantity.toString()]));

  const year = b.countedAt.getUTCFullYear();
  const last = await db.stockCount.findFirst({
    where: { tenantId: session.tenantId, reference: { startsWith: `SC-${year}-` } },
    orderBy: { reference: 'desc' }, select: { reference: true },
  });
  const seq = last ? parseInt(last.reference.split('-')[2], 10) + 1 : 1;
  const reference = `SC-${year}-${seq.toString().padStart(5, '0')}`;

  const created = await db.stockCount.create({
    data: {
      tenantId: session.tenantId, reference,
      warehouseId: b.warehouseId, countedAt: b.countedAt, notes: b.notes,
      lines: {
        create: b.lines.map((l) => {
          const systemQty = new BigNumber(stockMap.get(l.productId) ?? '0');
          const counted = new BigNumber(l.countedQty);
          return {
            productId: l.productId,
            systemQty: new Prisma.Decimal(systemQty.toString()),
            countedQty: new Prisma.Decimal(counted.toString()),
            variance: new Prisma.Decimal(counted.minus(systemQty).toString()),
            notes: l.notes,
          };
        }),
      },
    },
    include: { lines: true },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}
