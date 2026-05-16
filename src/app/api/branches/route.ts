import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Body = z.object({
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  code: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  altPhone: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  commercialReg: z.string().optional().nullable(),
  governorate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'CLOSED']).optional(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  userIds: z.array(z.string()).optional(),
});

export async function GET() {
  const session = await requireSession();
  const rows = await db.branch.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;

  const year = new Date().getUTCFullYear();
  let code = b.code;
  if (!code) {
    const last = await db.branch.findFirst({
      where: { tenantId: session.tenantId, code: { startsWith: `BRN-${year}-` } },
      orderBy: { code: 'desc' }, select: { code: true },
    });
    const seq = last ? parseInt(last.code.split('-')[2], 10) + 1 : 1;
    code = `BRN-${year}-${seq.toString().padStart(5, '0')}`;
  }

  const created = await db.branch.create({
    data: {
      tenantId: session.tenantId,
      nameAr: b.nameAr, nameEn: b.nameEn, code,
      email: b.email ?? undefined, phone: b.phone ?? undefined, altPhone: b.altPhone ?? undefined,
      taxNumber: b.taxNumber ?? undefined, commercialReg: b.commercialReg ?? undefined,
      governorate: b.governorate ?? undefined, address: b.address ?? undefined,
      city: b.city ?? undefined, state: b.state ?? undefined,
      postalCode: b.postalCode ?? undefined, country: b.country ?? undefined,
      status: b.status ?? 'ACTIVE',
      description: b.description ?? undefined, notes: b.notes ?? undefined,
      userIds: b.userIds ?? undefined,
    },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}
