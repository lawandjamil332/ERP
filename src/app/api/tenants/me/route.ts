import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const PatchBody = z.object({
  nameAr: z.string().min(2).optional(),
  nameKu: z.string().optional(),
  nameEn: z.string().min(2).optional(),
  governorate: z.string().optional(),
  defaultLocale: z.enum(['ar', 'ku', 'en']).optional(),
  ramadanMode: z.boolean().optional(),
  useArabicNumerals: z.boolean().optional(),
});

export async function GET() {
  const session = await requireSession();
  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });
  if (!tenant) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ data: tenant });
}

export async function PATCH(req: Request) {
  const session = await requireSession();
  const parsed = PatchBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const updated = await db.tenant.update({
    where: { id: session.tenantId },
    data: parsed.data,
  });
  return NextResponse.json({ data: updated });
}
