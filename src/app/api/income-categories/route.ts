import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Body = z.object({
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  parentId: z.string().optional().nullable(),
  accountCode: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const session = await requireSession();
  const rows = await db.incomeCategory.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ parentId: 'asc' }, { nameEn: 'asc' }],
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;
  const created = await db.incomeCategory.create({
    data: {
      tenantId: session.tenantId,
      nameAr: b.nameAr, nameEn: b.nameEn,
      parentId: b.parentId ?? undefined,
      accountCode: b.accountCode ?? undefined,
      isActive: b.isActive ?? true,
    },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}
