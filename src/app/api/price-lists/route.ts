import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const EntrySchema = z.object({
  productId: z.string(),
  price: z.number().nonnegative(),
  minQuantity: z.number().positive().default(1),
  discountPct: z.number().min(0).max(1).default(0),
});

const Body = z.object({
  name: z.string().min(1),
  currency: z.string().length(3).default('IQD'),
  validFrom: z.coerce.date().optional(),
  validTo: z.coerce.date().optional(),
  isDefault: z.boolean().default(false),
  notes: z.string().optional(),
  entries: z.array(EntrySchema).default([]),
});

export async function GET() {
  const session = await requireSession();
  const rows = await db.priceList.findMany({
    where: { tenantId: session.tenantId, isActive: true },
    include: { entries: { include: { product: { select: { sku: true, nameAr: true, nameEn: true } } } } },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;
  try {
    if (b.isDefault) {
      await db.priceList.updateMany({
        where: { tenantId: session.tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }
    const row = await db.priceList.create({
      data: {
        tenantId: session.tenantId,
        name: b.name, currency: b.currency,
        validFrom: b.validFrom, validTo: b.validTo,
        isDefault: b.isDefault, notes: b.notes,
        entries: {
          create: b.entries.map((e) => ({
            productId: e.productId,
            price: new Prisma.Decimal(e.price),
            minQuantity: new Prisma.Decimal(e.minQuantity),
            discountPct: new Prisma.Decimal(e.discountPct),
          })),
        },
      },
      include: { entries: true },
    });
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.code === 'P2002' ? 'name_already_exists' : e?.message ?? 'db_error' }, { status: 400 });
  }
}
