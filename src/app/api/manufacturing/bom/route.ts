import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Component = z.object({
  componentProductId: z.string(),
  quantity: z.number().positive(),
  unitOfMeasure: z.string().default('PCS'),
});

const Body = z.object({
  productId: z.string(),
  version: z.string().default('1'),
  components: z.array(Component).min(1),
});

export async function GET() {
  const session = await requireSession();
  const boms = await db.bom.findMany({
    where: { tenantId: session.tenantId, isActive: true },
    include: { components: true },
  });
  return NextResponse.json({ data: boms });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const b = parsed.data;
  const bom = await db.bom.create({
    data: {
      tenantId: session.tenantId,
      productId: b.productId,
      version: b.version,
      components: {
        create: b.components.map((c) => ({
          componentProductId: c.componentProductId,
          quantity: new Prisma.Decimal(c.quantity),
          unitOfMeasure: c.unitOfMeasure,
        })),
      },
    },
    include: { components: true },
  });
  return NextResponse.json({ data: bom }, { status: 201 });
}
