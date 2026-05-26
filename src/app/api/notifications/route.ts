import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

export async function GET() {
  const session = await requireSession();
  const items = await db.notification.findMany({
    where: {
      tenantId: session.tenantId,
      OR: [{ userId: session.userId }, { userId: null }],
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({ data: items });
}

const Patch = z.object({ id: z.string(), read: z.boolean().default(true) });

export async function PATCH(req: Request) {
  const session = await requireSession();
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const result = await db.notification.updateMany({
    where: { id: parsed.data.id, tenantId: session.tenantId },
    data: { readAt: parsed.data.read ? new Date() : null },
  });
  if (result.count === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
