import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth/permissions';

const Body = z.object({
  code: z.string().min(1),
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  rate: z.number().min(0).max(1),
  kind: z.enum(['SALES', 'WITHHOLDING', 'CUSTOMS', 'VAT', 'STAMP']),
  accountId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const guard = await requirePermission('settings', 'view');
  if (guard instanceof NextResponse) return guard;
  const session = guard;
  const rows = await db.taxRate.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { code: 'asc' },
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const guard = await requirePermission('settings', 'create');
  if (guard instanceof NextResponse) return guard;
  const session = guard;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;
  const created = await db.taxRate.create({
    data: {
      tenantId: session.tenantId,
      code: b.code, nameAr: b.nameAr, nameEn: b.nameEn,
      rate: b.rate, kind: b.kind,
      accountId: b.accountId ?? null,
      isActive: b.isActive ?? true,
    },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}

export async function PATCH(req: Request) {
  const guard = await requirePermission('settings', 'edit');
  if (guard instanceof NextResponse) return guard;
  const session = guard;
  const body = await req.json().catch(() => null);
  const { id, ...fields } = body ?? {};
  if (!id) return NextResponse.json({ error: 'id_required' }, { status: 400 });
  const existing = await db.taxRate.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const updated = await db.taxRate.update({ where: { id }, data: fields });
  return NextResponse.json({ data: updated });
}
