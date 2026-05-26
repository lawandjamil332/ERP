import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth/permissions';

const Body = z.object({
  code: z.string().min(1),
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  branchId: z.string().optional().nullable(),
});

export async function GET() {
  const guard = await requirePermission('pos', 'view');
  if (guard instanceof NextResponse) return guard;
  const session = guard;
  const rows = await db.posTerminal.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { code: 'asc' },
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const guard = await requirePermission('pos', 'create');
  if (guard instanceof NextResponse) return guard;
  const session = guard;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;
  const created = await db.posTerminal.create({
    data: {
      tenantId: session.tenantId,
      code: b.code, nameAr: b.nameAr, nameEn: b.nameEn,
      branchId: b.branchId ?? undefined,
    },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}
