import { NextResponse } from 'next/server';
import { z } from 'zod';
import BigNumber from 'bignumber.js';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth/permissions';

const Body = z.object({
  bankAccountId: z.string(),
  statementDate: z.coerce.date(),
  openingBalance: z.number(),
  closingBalance: z.number(),
  matched: z.array(z.object({
    paymentId: z.string(),
    statementRef: z.string().optional(),
    amount: z.number(),
  })).default([]),
  complete: z.boolean().default(false),
});

export async function GET(req: Request) {
  const guard = await requirePermission('finance', 'view');
  if (guard instanceof NextResponse) return guard;
  const session = guard;
  const url = new URL(req.url);
  const bankAccountId = url.searchParams.get('bankAccountId');
  const rows = await db.bankReconciliation.findMany({
    where: { tenantId: session.tenantId, ...(bankAccountId ? { bankAccountId } : {}) },
    orderBy: { statementDate: 'desc' },
    take: 50,
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const guard = await requirePermission('finance', 'create');
  if (guard instanceof NextResponse) return guard;
  const session = guard;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;

  const matchedSum = new BigNumber(b.matched.reduce((s, m) => s + m.amount, 0));
  const expectedDelta = new BigNumber(b.closingBalance).minus(b.openingBalance);
  const balanced = matchedSum.minus(expectedDelta).abs().lt(0.01);

  const created = await db.bankReconciliation.create({
    data: {
      tenantId: session.tenantId,
      bankAccountId: b.bankAccountId,
      statementDate: b.statementDate,
      openingBalance: b.openingBalance.toFixed(4),
      closingBalance: b.closingBalance.toFixed(4),
      matchedJson: b.matched,
      status: b.complete && balanced ? 'COMPLETED' : 'IN_PROGRESS',
      completedAt: b.complete && balanced ? new Date() : null,
    },
  });
  return NextResponse.json({ data: created, balanced, expectedDelta: expectedDelta.toNumber() }, { status: 201 });
}

/**
 * Auto-match suggestions: returns recent unreconciled payments on this bank
 * account ordered by date. The UI uses this as the candidate pool to drag/match
 * against statement lines.
 */
export async function PATCH(req: Request) {
  const guard = await requirePermission('finance', 'view');
  if (guard instanceof NextResponse) return guard;
  const session = guard;
  const { bankAccountId } = await req.json().catch(() => ({ bankAccountId: '' }));
  if (!bankAccountId) return NextResponse.json({ error: 'bankAccountId_required' }, { status: 400 });

  // Already-matched payment ids from past completed reconciliations.
  const past = await db.bankReconciliation.findMany({
    where: { tenantId: session.tenantId, bankAccountId, status: 'COMPLETED' },
    select: { matchedJson: true },
  });
  const used = new Set<string>();
  for (const r of past) {
    const arr = (r.matchedJson as { paymentId: string }[] | null) ?? [];
    for (const m of arr) used.add(m.paymentId);
  }

  const candidates = await db.payment.findMany({
    where: { tenantId: session.tenantId, method: { in: ['BANK_TRANSFER', 'CHEQUE'] } },
    orderBy: { date: 'desc' },
    take: 200,
    select: { id: true, number: true, date: true, amount: true, direction: true, reference: true },
  });
  return NextResponse.json({ candidates: candidates.filter((p) => !used.has(p.id)) });
}
