import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Body = z.object({
  productId: z.string(),
  fromUom: z.string().min(1),
  toUom: z.string().min(1),
  factor: z.number().positive(),
});

export async function GET(req: Request) {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId') ?? undefined;
  const rows = await db.uomConversion.findMany({
    where: { tenantId: session.tenantId, ...(productId ? { productId } : {}) },
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;
  const row = await db.uomConversion.upsert({
    where: {
      tenantId_productId_fromUom_toUom: {
        tenantId: session.tenantId,
        productId: b.productId, fromUom: b.fromUom, toUom: b.toUom,
      },
    },
    create: { tenantId: session.tenantId, ...b, factor: new Prisma.Decimal(b.factor) },
    update: { factor: new Prisma.Decimal(b.factor) },
  });
  return NextResponse.json({ data: row }, { status: 201 });
}
