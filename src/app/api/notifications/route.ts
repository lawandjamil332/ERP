import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

export async function GET() {
  const session = await requireSession();
  const items = await db.notification.findMany({
    where: { tenantId: session.tenantId, userId: { in: [session.userId, null] as any } },
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
  const n = await db.notification.update({
    where: { id: parsed.data.id },
    data: { readAt: parsed.data.read ? new Date() : null },
  });
  return NextResponse.json({ data: n });
}
