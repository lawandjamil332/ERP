import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Body = z.object({
  lcNumber: z.string().min(1),
  issuingBank: z.string().min(1),
  advisingBank: z.string().optional(),
  beneficiary: z.string().min(1),
  beneficiaryCountry: z.string().optional(),
  applicant: z.string().min(1),
  currency: z.string().length(3).default('USD'),
  amount: z.number().positive(),
  issueDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
  lastShipmentDate: z.coerce.date().optional(),
  incoterms: z.string().optional(),
  relatedPoId: z.string().optional(),
  cbiWindowDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await requireSession();
  const rows = await db.letterOfCredit.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { issueDate: 'desc' },
    include: { drawings: true },
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }
  const b = parsed.data;
  try {
    const row = await db.letterOfCredit.create({
      data: {
        tenantId: session.tenantId,
        lcNumber: b.lcNumber, issuingBank: b.issuingBank, advisingBank: b.advisingBank,
        beneficiary: b.beneficiary, beneficiaryCountry: b.beneficiaryCountry, applicant: b.applicant,
        currency: b.currency,
        amount: new Prisma.Decimal(b.amount),
        issueDate: b.issueDate, expiryDate: b.expiryDate,
        lastShipmentDate: b.lastShipmentDate, incoterms: b.incoterms,
        relatedPoId: b.relatedPoId, cbiWindowDate: b.cbiWindowDate, notes: b.notes,
      },
    });
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.code === 'P2002' ? 'lc_number_already_exists' : e?.message ?? 'db_error' }, { status: 400 });
  }
}
