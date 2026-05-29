import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth/permissions';
import { buildTenantSnapshot } from '@/lib/backup/snapshot';

/**
 * Full logical backup of the current tenant's core business data as JSON.
 * Downloaded to the user's machine; can be re-imported via /api/backup/restore.
 */
export async function GET() {
  const guard = await requirePermission('settings', 'view');
  if (guard instanceof NextResponse) return guard;
  const session = guard;

  const payload = await buildTenantSnapshot(db, session.tenantId);

  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="erp-backup-${stamp}.json"`,
      'cache-control': 'no-store',
    },
  });
}
