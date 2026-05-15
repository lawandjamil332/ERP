import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Body = z.object({
  kind: z.enum(['CUSTOMER', 'SUPPLIER', 'BOTH']).default('CUSTOMER'),
  nameAr: z.string().min(1),
  nameEn: z.string().optional(),
  taxNumber: z.string().optional(),
  commercialReg: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  addressAr: z.string().optional(),
  addressEn: z.string().optional(),
  governorate: z.string().optional(),
  currency: z.string().length(3).default('IQD'),
  creditLimit: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  let session;
  try { session = await requireSession(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get('kind') as 'CUSTOMER' | 'SUPPLIER' | 'BOTH' | null;
  const contacts = await db.contact.findMany({
    where: {
      tenantId: session.tenantId,
      isActive: true,
      ...(kind ? { kind: kind === 'BOTH' ? undefined : { in: [kind, 'BOTH'] } } : {}),
    },
    orderBy: { nameAr: 'asc' },
    take: 200,
  });
  return NextResponse.json({ data: contacts });
}

export async function POST(req: Request) {
  let session;
  try { session = await requireSession(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;
  const created = await db.contact.create({
    data: {
      tenantId: session.tenantId,
      kind: b.kind,
      nameAr: b.nameAr,
      nameEn: b.nameEn,
      taxNumber: b.taxNumber,
      commercialReg: b.commercialReg,
      phone: b.phone,
      email: b.email || null,
      addressAr: b.addressAr,
      addressEn: b.addressEn,
      governorate: b.governorate,
      currency: b.currency,
      creditLimit: new Prisma.Decimal(b.creditLimit),
      notes: b.notes,
    },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}
