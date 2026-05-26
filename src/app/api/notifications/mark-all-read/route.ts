import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

export async function POST() {
  const session = await requireSession();
  const result = await db.notification.updateMany({
    where: {
      tenantId: session.tenantId,
      OR: [{ userId: session.userId }, { userId: null }],
      readAt: null,
    },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true, count: result.count });
}
