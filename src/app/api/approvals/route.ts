import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { advanceApproval } from '@/lib/approvals/gate';

/** List approvals: pending ones the caller's role can decide, plus recent decided. */
export async function GET() {
  const session = await requireSession();
  const canDecideAll = session.role === 'OWNER' || session.role === 'ADMIN';

  const pending = await db.approval.findMany({
    where: {
      tenantId: session.tenantId,
      status: 'PENDING',
      ...(canDecideAll ? {} : { approverRole: session.role }),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const decided = await db.approval.findMany({
    where: { tenantId: session.tenantId, status: { in: ['APPROVED', 'REJECTED'] } },
    orderBy: { decidedAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({ pending, decided, canDecide: true });
}

const Decide = z.object({
  id: z.string(),
  decision: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().optional(),
});

export async function PATCH(req: Request) {
  const session = await requireSession();
  const parsed = Decide.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const approval = await db.approval.findFirst({
    where: { tenantId: session.tenantId, id: parsed.data.id },
  });
  if (!approval) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (approval.status !== 'PENDING') return NextResponse.json({ error: 'already_decided' }, { status: 409 });

  const canDecide =
    session.role === 'OWNER' || session.role === 'ADMIN' || session.role === approval.approverRole;
  if (!canDecide) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  // Segregation of Duties: whoever requested the action cannot decide it.
  if (approval.requestedById && approval.requestedById === session.userId) {
    return NextResponse.json(
      { error: 'sod_violation', detail: 'You cannot approve a request you initiated.' },
      { status: 403 },
    );
  }

  const updated = await advanceApproval(
    db,
    approval.id,
    parsed.data.decision,
    session.userId,
    parsed.data.note,
  );
  return NextResponse.json({ data: updated });
}
