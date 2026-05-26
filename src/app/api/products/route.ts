import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Body = z.object({
  sku: z.string().min(1),
  barcode: z.string().optional(),
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  hsCode: z.string().regex(/^\d{6,}$/).optional(),
  countryOfOrigin: z.string().length(2).optional(),
  trademark: z.string().optional(),
  unitOfMeasure: z.string().default('PCS'),
  category: z.string().optional(),
  salePrice: z.number().nonnegative().default(0),
  cost: z.number().nonnegative().default(0),
  isService: z.boolean().default(false),
});

export async function GET() {
  let session;
  try { session = await requireSession(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const products = await db.product.findMany({
    where: { tenantId: session.tenantId, isActive: true },
    orderBy: { nameAr: 'asc' },
    take: 500,
  });
  return NextResponse.json({ data: products });
}

export async function POST(req: Request) {
  let session;
  try { session = await requireSession(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;
  const created = await db.product.create({
    data: {
      tenantId: session.tenantId,
      sku: b.sku,
      barcode: b.barcode,
      nameAr: b.nameAr,
      nameEn: b.nameEn,
      descriptionAr: b.descriptionAr,
      descriptionEn: b.descriptionEn,
      hsCode: b.hsCode,
      countryOfOrigin: b.countryOfOrigin,
      trademark: b.trademark,
      unitOfMeasure: b.unitOfMeasure,
      category: b.category,
      salePrice: new Prisma.Decimal(b.salePrice),
      cost: new Prisma.Decimal(b.cost),
      isService: b.isService,
    },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}
