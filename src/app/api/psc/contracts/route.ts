import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Body = z.object({
  contractNumber: z.string().min(1),
  fieldName: z.string().min(1),
  signedDate: z.coerce.date(),
  expiryDate: z.coerce.date().optional(),
  costRecoveryCap: z.number().min(0).max(1).default(0.5),
  contractorProfitShare: z.number().min(0).max(1).default(0.2),
  royaltyRate: z.number().min(0).max(1).default(0.1),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await requireSession();
  const rows = await db.pscContract.findMany({
    where: { tenantId: session.tenantId },
    include: { periods: { orderBy: { period: 'desc' }, take: 12 } },
    orderBy: { signedDate: 'desc' },
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;
  try {
    const row = await db.pscContract.create({
      data: {
        tenantId: session.tenantId,
        contractNumber: b.contractNumber, fieldName: b.fieldName,
        signedDate: b.signedDate, expiryDate: b.expiryDate,
        costRecoveryCap: new Prisma.Decimal(b.costRecoveryCap),
        contractorProfitShare: new Prisma.Decimal(b.contractorProfitShare),
        royaltyRate: new Prisma.Decimal(b.royaltyRate),
        notes: b.notes,
      },
    });
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.code === 'P2002' ? 'contract_number_exists' : e?.message ?? 'db_error' }, { status: 400 });
  }
}
