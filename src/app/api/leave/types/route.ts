import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { seedIraqLeaveTypes } from '@/lib/iraq/leave';

export async function GET() {
  const session = await requireSession();
  const existing = await db.leaveType.count({ where: { tenantId: session.tenantId } });
  if (existing === 0) await seedIraqLeaveTypes(db, session.tenantId);
  const types = await db.leaveType.findMany({
    where: { tenantId: session.tenantId, isActive: true },
    orderBy: { code: 'asc' },
  });
  return NextResponse.json({ data: types });
}

const Body = z.object({
  code: z.string().min(1),
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  annualEntitlement: z.number().int().nonnegative().default(0),
  carryForward: z.boolean().default(false),
  paid: z.boolean().default(true),
});

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const t = await db.leaveType.create({
    data: { tenantId: session.tenantId, ...parsed.data },
  });
  return NextResponse.json({ data: t }, { status: 201 });
}
