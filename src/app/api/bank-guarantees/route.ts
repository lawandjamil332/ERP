import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Body = z.object({
  reference: z.string().min(1),
  kind: z.enum(['BID', 'PERFORMANCE', 'ADVANCE_PAYMENT', 'RETENTION', 'CUSTOMS', 'OTHER']).default('PERFORMANCE'),
  issuingBank: z.string().min(1),
  beneficiary: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().length(3).default('IQD'),
  issueDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
  relatedProjectId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await requireSession();
  const rows = await db.bankGuarantee.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { expiryDate: 'asc' },
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;
  try {
    const row = await db.bankGuarantee.create({
      data: {
        tenantId: session.tenantId,
        reference: b.reference, kind: b.kind, issuingBank: b.issuingBank,
        beneficiary: b.beneficiary,
        amount: new Prisma.Decimal(b.amount), currency: b.currency,
        issueDate: b.issueDate, expiryDate: b.expiryDate,
        relatedProjectId: b.relatedProjectId, notes: b.notes,
      },
    });
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.code === 'P2002' ? 'reference_already_exists' : e?.message ?? 'db_error' }, { status: 400 });
  }
}
