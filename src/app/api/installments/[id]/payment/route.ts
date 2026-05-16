import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import BigNumber from 'bignumber.js';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { applyPaymentToSchedule } from '@/lib/iraq/installment';

const Body = z.object({
  amount: z.number().positive(),
  paidDate: z.coerce.date().default(() => new Date()),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }
  const { amount, paidDate } = parsed.data;

  const plan = await db.installmentPlan.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { schedule: { orderBy: { sequence: 'asc' } } },
  });
  if (!plan) return NextResponse.json({ error: 'plan_not_found' }, { status: 404 });

  const result = applyPaymentToSchedule(
    plan.schedule.map((s) => ({
      sequence: s.sequence,
      amount: s.amount.toString(),
      paidAmount: s.paidAmount.toString(),
      status: s.status,
    })),
    amount
  );

  await db.$transaction(async (tx) => {
    for (const alloc of result.allocations) {
      const row = plan.schedule.find((s) => s.sequence === alloc.sequence)!;
      await tx.installmentSchedule.update({
        where: { id: row.id },
        data: {
          paidAmount: new Prisma.Decimal(alloc.newPaid),
          status: alloc.newStatus as any,
          paidDate: alloc.newStatus === 'PAID' ? paidDate : row.paidDate,
        },
      });
    }
    // If all schedule rows are PAID, mark plan COMPLETED.
    const stillDue = plan.schedule.reduce((s, r) => {
      const alloc = result.allocations.find((a) => a.sequence === r.sequence);
      const newPaid = alloc ? new BigNumber(alloc.newPaid) : new BigNumber(r.paidAmount.toString());
      return s + (newPaid.gte(r.amount.toString()) ? 0 : 1);
    }, 0);
    if (stillDue === 0) {
      await tx.installmentPlan.update({ where: { id: plan.id }, data: { status: 'COMPLETED' } });
    }
  });

  return NextResponse.json({ data: { allocations: result.allocations, leftoverChange: result.remaining } });
}
