import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth/permissions';

const Body = z.object({
  entity: z.enum(['Invoice', 'Bill', 'Payment']),
  thresholdAmount: z.number().nonnegative(),
  currency: z.string().default('IQD'),
  approverRole: z.enum(['OWNER', 'ADMIN', 'ACCOUNTANT', 'SALES', 'PURCHASES', 'INVENTORY', 'HR', 'CASHIER', 'STAFF', 'AUDITOR_READONLY']),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const guard = await requirePermission('settings', 'view');
  if (guard instanceof NextResponse) return guard;
  const session = guard;
  const rows = await db.approvalRule.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ entity: 'asc' }, { thresholdAmount: 'asc' }],
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const guard = await requirePermission('settings', 'edit');
  if (guard instanceof NextResponse) return guard;
  const session = guard;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;
  const created = await db.approvalRule.create({
    data: {
      tenantId: session.tenantId,
      entity: b.entity,
      thresholdAmount: b.thresholdAmount.toFixed(4),
      currency: b.currency,
      approverRole: b.approverRole,
      isActive: b.isActive,
    },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}

export async function DELETE(req: Request) {
  const guard = await requirePermission('settings', 'delete');
  if (guard instanceof NextResponse) return guard;
  const session = guard;
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id_required' }, { status: 400 });
  const result = await db.approvalRule.deleteMany({ where: { id, tenantId: session.tenantId } });
  if (result.count === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
