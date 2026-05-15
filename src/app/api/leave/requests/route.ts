import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { workingDaysIQ } from '@/lib/iraq/leave';

const Body = z.object({
  employeeId: z.string(),
  leaveTypeId: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().optional(),
});

const Decide = z.object({
  id: z.string(),
  action: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const requests = await db.leaveRequest.findMany({
    where: { tenantId: session.tenantId, ...(status ? { status: status as any } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ data: requests });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;
  const days = workingDaysIQ(b.startDate, b.endDate);
  if (days <= 0) return NextResponse.json({ error: 'zero_working_days' }, { status: 400 });
  const created = await db.leaveRequest.create({
    data: {
      tenantId: session.tenantId, employeeId: b.employeeId,
      leaveTypeId: b.leaveTypeId,
      startDate: b.startDate, endDate: b.endDate, days,
      reason: b.reason,
    },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await requireSession();
  const parsed = Decide.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const req_ = await db.leaveRequest.findFirst({
    where: { id: parsed.data.id, tenantId: session.tenantId },
  });
  if (!req_) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const result = await db.$transaction(async (tx) => {
    const updated = await tx.leaveRequest.update({
      where: { id: parsed.data.id },
      data: {
        status: parsed.data.action,
        decidedBy: session.userId,
        decidedAt: new Date(),
        notes: parsed.data.notes,
      },
    });
    if (parsed.data.action === 'APPROVED') {
      const year = req_.startDate.getUTCFullYear();
      await tx.leaveBalance.upsert({
        where: {
          tenantId_employeeId_leaveTypeId_year: {
            tenantId: session.tenantId, employeeId: req_.employeeId,
            leaveTypeId: req_.leaveTypeId, year,
          },
        },
        create: {
          tenantId: session.tenantId, employeeId: req_.employeeId,
          leaveTypeId: req_.leaveTypeId, year,
          entitled: 0, used: req_.days, carriedIn: 0,
        },
        update: { used: { increment: req_.days } },
      });
    }
    return updated;
  });
  return NextResponse.json({ data: result });
}
