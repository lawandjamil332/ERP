import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Body = z.object({
  kind: z.enum(['TRANSFER','ADJUSTMENT_IN','ADJUSTMENT_OUT','WRITE_OFF','OPENING_BALANCE']),
  date: z.coerce.date(),
  reference: z.string().min(1),
  productId: z.string(),
  fromWarehouseId: z.string().optional(),
  toWarehouseId: z.string().optional(),
  quantity: z.number().positive(),
  unitCost: z.number().nonnegative().default(0),
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  let session;
  try { session = await requireSession(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const m = parsed.data;

  const created = await db.$transaction(async (tx) => {
    const mov = await tx.stockMovement.create({
      data: {
        tenantId: session.tenantId,
        kind: m.kind,
        date: m.date,
        reference: m.reference,
        productId: m.productId,
        fromWarehouseId: m.fromWarehouseId,
        toWarehouseId: m.toWarehouseId,
        quantity: new Prisma.Decimal(m.quantity),
        unitCost: new Prisma.Decimal(m.unitCost),
        reason: m.reason,
      },
    });

    const ensureStock = async (productId: string, warehouseId: string) => {
      return tx.stock.upsert({
        where: { productId_warehouseId: { productId, warehouseId } },
        create: { productId, warehouseId, quantity: new Prisma.Decimal(0) },
        update: {},
      });
    };

    if (m.kind === 'TRANSFER' && m.fromWarehouseId && m.toWarehouseId) {
      await ensureStock(m.productId, m.fromWarehouseId);
      await ensureStock(m.productId, m.toWarehouseId);
      await tx.stock.update({
        where: { productId_warehouseId: { productId: m.productId, warehouseId: m.fromWarehouseId } },
        data: { quantity: { decrement: new Prisma.Decimal(m.quantity) } },
      });
      await tx.stock.update({
        where: { productId_warehouseId: { productId: m.productId, warehouseId: m.toWarehouseId } },
        data: { quantity: { increment: new Prisma.Decimal(m.quantity) } },
      });
    } else if (m.kind === 'ADJUSTMENT_IN' || m.kind === 'OPENING_BALANCE') {
      if (!m.toWarehouseId) throw new Error('toWarehouseId required');
      await ensureStock(m.productId, m.toWarehouseId);
      await tx.stock.update({
        where: { productId_warehouseId: { productId: m.productId, warehouseId: m.toWarehouseId } },
        data: { quantity: { increment: new Prisma.Decimal(m.quantity) } },
      });
    } else if (m.kind === 'ADJUSTMENT_OUT' || m.kind === 'WRITE_OFF') {
      if (!m.fromWarehouseId) throw new Error('fromWarehouseId required');
      await ensureStock(m.productId, m.fromWarehouseId);
      await tx.stock.update({
        where: { productId_warehouseId: { productId: m.productId, warehouseId: m.fromWarehouseId } },
        data: { quantity: { decrement: new Prisma.Decimal(m.quantity) } },
      });
    }

    return mov;
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
