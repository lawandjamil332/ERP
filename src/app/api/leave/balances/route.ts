import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { accrueAnnualEntitlements } from '@/lib/iraq/leave';

export async function GET(req: Request) {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get('year') ?? new Date().getUTCFullYear());
  const employeeId = searchParams.get('employeeId') ?? undefined;
  const balances = await db.leaveBalance.findMany({
    where: { tenantId: session.tenantId, year, ...(employeeId ? { employeeId } : {}) },
    include: { leaveType: { select: { code: true, nameAr: true, nameEn: true, paid: true } } },
  });
  return NextResponse.json({ data: balances, year });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = z.object({
    year: z.number().int().min(2020).max(2100).default(new Date().getUTCFullYear()),
  }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const granted = await accrueAnnualEntitlements(db, session.tenantId, parsed.data.year);
  return NextResponse.json({ data: { granted } });
}
