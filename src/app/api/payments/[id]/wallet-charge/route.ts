import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { charge } from '@/lib/iraq/mobile-wallets';

const Body = z.object({
  provider: z.enum(['zain', 'fastpay', 'fib', 'asia']),
  to: z.string().min(1),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const payment = await db.payment.findFirst({
    where: { id, tenantId: session.tenantId, deletedAt: null },
  });
  if (!payment) return NextResponse.json({ error: 'payment_not_found' }, { status: 404 });

  const result = await charge(parsed.data.provider, {
    to: parsed.data.to,
    amountIqd: payment.currency === 'IQD'
      ? Number(payment.amount)
      : Math.round(Number(payment.amount) * Number(payment.fxRate)),
    reference: payment.number,
    description: payment.notes ?? payment.reference ?? payment.number,
  });

  return NextResponse.json(result);
}
