import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { validateIraqiId } from '@/lib/iraq/iraqi-id';

const Body = z.object({
  fullName: z.string().min(2),
  nationalId: z.string().optional(),
  nationality: z.string().default('IQ'),
  dateOfBirth: z.coerce.date().optional(),
  ownershipPct: z.number().min(0).max(100),
  controlMechanism: z.string().optional(),
  isPep: z.boolean().default(false),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional(),
});

export async function GET() {
  const session = await requireSession();
  const rows = await db.beneficialOwner.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { ownershipPct: 'desc' },
  });
  const totalPct = rows.reduce((s, r) => s + Number(r.ownershipPct), 0);
  return NextResponse.json({ data: rows, totalOwnershipPct: totalPct.toFixed(4) });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;

  if (b.nationalId && b.nationality === 'IQ') {
    const v = validateIraqiId(b.nationalId);
    if (!v.valid) return NextResponse.json({ error: 'invalid_iraqi_id', detail: v.reason }, { status: 400 });
  }

  const row = await db.beneficialOwner.create({
    data: {
      tenantId: session.tenantId,
      fullName: b.fullName, nationalId: b.nationalId, nationality: b.nationality,
      dateOfBirth: b.dateOfBirth,
      ownershipPct: new Prisma.Decimal(b.ownershipPct),
      controlMechanism: b.controlMechanism, isPep: b.isPep,
      effectiveFrom: b.effectiveFrom, effectiveTo: b.effectiveTo,
    },
  });
  return NextResponse.json({ data: row }, { status: 201 });
}
