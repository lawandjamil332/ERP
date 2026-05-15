import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { consolidate } from '@/lib/iraq/consolidation';

export async function GET(req: Request) {
  const session = await requireSession();
  const url = new URL(req.url);
  const groupId = url.searchParams.get('groupId');
  const asOf = url.searchParams.get('asOf');
  const asOfDate = asOf ? new Date(asOf) : new Date();

  if (!groupId) {
    return NextResponse.json({ error: 'groupId_required' }, { status: 400 });
  }

  const group = await db.consolidatedGroup.findFirst({
    where: { id: groupId, tenantId: session.tenantId },
  });
  if (!group) return NextResponse.json({ error: 'group_not_found' }, { status: 404 });

  if (!group.memberTenantIds.includes(session.tenantId)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const rows = await consolidate(db, group.memberTenantIds, asOfDate);
  return NextResponse.json({
    group: { id: group.id, name: group.name, members: group.memberTenantIds },
    asOf: asOfDate.toISOString().slice(0, 10),
    rows,
  });
}
