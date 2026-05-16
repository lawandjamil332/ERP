import { NextResponse } from 'next/server';
import { z } from 'zod';
import argon2 from 'argon2';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Body = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(['OWNER', 'ADMIN', 'ACCOUNTANT', 'SALES', 'PURCHASES', 'INVENTORY', 'HR', 'CASHIER', 'STAFF', 'AUDITOR_READONLY']),
  password: z.string().min(6),
  locale: z.string().optional(),
});

export async function GET() {
  const session = await requireSession();
  const rows = await db.user.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, fullName: true, phone: true, role: true, locale: true, isActive: true, lastLoginAt: true, createdAt: true },
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;
  const passwordHash = await argon2.hash(b.password, { type: argon2.argon2id });
  const created = await db.user.create({
    data: {
      tenantId: session.tenantId,
      email: b.email.toLowerCase(),
      passwordHash,
      fullName: b.fullName,
      phone: b.phone,
      role: b.role,
      locale: b.locale ?? 'ar',
    },
    select: { id: true, email: true, fullName: true, role: true, isActive: true },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}
