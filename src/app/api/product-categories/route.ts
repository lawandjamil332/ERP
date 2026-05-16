import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Body = z.object({
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

export async function GET() {
  const session = await requireSession();
  const rows = await db.productCategory.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }, { nameEn: 'asc' }],
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;
  const slug = b.slug ?? toSlug(b.nameEn) ?? toSlug(b.nameAr);
  const created = await db.productCategory.create({
    data: {
      tenantId: session.tenantId,
      nameAr: b.nameAr, nameEn: b.nameEn, slug,
      parentId: b.parentId ?? undefined,
      sortOrder: b.sortOrder ?? 0,
      isActive: b.isActive ?? true,
    },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}
