import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Body = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  permissions: z.record(z.array(z.enum(['view', 'create', 'edit', 'delete', 'approve', 'post']))),
});

export async function GET() {
  const session = await requireSession();
  const rows = await db.role.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;
  const created = await db.role.create({
    data: {
      tenantId: session.tenantId,
      name: b.name, description: b.description,
      permissions: b.permissions,
    },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}
