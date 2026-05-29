import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildTenantSnapshot } from '@/lib/backup/snapshot';
import { uploadBackupObject, isOffsiteConfigured } from '@/lib/backup/offsite';

/**
 * Scheduled offsite backup. Snapshots every active tenant and ships each to the
 * configured S3-compatible bucket (R2/S3/B2). Protect with CRON_SECRET.
 *
 * Railway cron (nightly 02:00 UTC):  0 2 * * *
 *   curl -X POST -H "x-cron-secret: $CRON_SECRET" https://<host>/api/cron/backup
 */
export async function POST(req: Request) {
  const expected = process.env.CRON_SECRET;
  const provided = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret');
  if (expected && provided !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!isOffsiteConfigured()) {
    return NextResponse.json({ ok: false, skipped: true, reason: 'offsite_storage_not_configured' });
  }

  const tenants = await db.tenant.findMany({ select: { id: true } });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const results: Array<{ tenantId: string; ok: boolean; error?: string }> = [];

  for (const { id } of tenants) {
    try {
      const snapshot = await buildTenantSnapshot(db, id);
      const key = `${id}/${stamp}.json`;
      const up = await uploadBackupObject(key, JSON.stringify(snapshot));
      results.push({ tenantId: id, ok: up.ok, error: up.error });
    } catch (e) {
      results.push({ tenantId: id, ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return NextResponse.json({
    ok: results.every((r) => r.ok),
    tenants: results.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok),
  });
}

export async function GET(req: Request) {
  return POST(req);
}
