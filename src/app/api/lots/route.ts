import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { expiringSoon } from '@/lib/iraq/lots';

const Body = z.object({
  productId: z.string(),
  warehouseId: z.string(),
  lotNumber: z.string().min(1),
  receivedQty: z.number().positive(),
  unitCost: z.number().nonnegative().default(0),
  manufactureDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
});

export async function GET(req: Request) {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get('expiringWithinDays') ?? 0);
  if (days > 0) {
    const rows = await expiringSoon(db, session.tenantId, days);
    return NextResponse.json({ data: rows });
  }
  const rows = await db.stockLot.findMany({
    where: { tenantId: session.tenantId, remainingQty: { gt: 0 } },
    orderBy: [{ expiryDate: 'asc' }, { receivedAt: 'desc' }],
    take: 200,
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;
  const lot = await db.stockLot.upsert({
    where: {
      tenantId_productId_warehouseId_lotNumber: {
        tenantId: session.tenantId,
        productId: b.productId, warehouseId: b.warehouseId, lotNumber: b.lotNumber,
      },
    },
    create: {
      tenantId: session.tenantId,
      ...b,
      receivedQty: new Prisma.Decimal(b.receivedQty),
      remainingQty: new Prisma.Decimal(b.receivedQty),
      unitCost: new Prisma.Decimal(b.unitCost),
    },
    update: {
      receivedQty: { increment: new Prisma.Decimal(b.receivedQty) },
      remainingQty: { increment: new Prisma.Decimal(b.receivedQty) },
      unitCost: new Prisma.Decimal(b.unitCost),
    },
  });
  return NextResponse.json({ data: lot }, { status: 201 });
}
