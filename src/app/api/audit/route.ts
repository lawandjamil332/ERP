import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

export async function GET(req: Request) {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const entity = searchParams.get('entity');
  const limit = Math.min(500, Number(searchParams.get('limit') ?? 200));
  const logs = await db.auditLog.findMany({
    where: { tenantId: session.tenantId, ...(entity ? { entity } : {}) },
    include: { user: { select: { email: true, fullName: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return NextResponse.json({ data: logs });
}
