import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { refreshAllTenantRates } from '@/lib/iraq/cbi-rate';

/**
 * Daily CBI rate refresh. Protect with CRON_SECRET header.
 * Railway cron: `0 8 * * 1-5` (08:00 UTC, weekdays).
 *
 *   curl -X POST -H "x-cron-secret: $CRON_SECRET" https://<host>/api/cron/cbi-rate
 */
export async function POST(req: Request) {
  const expected = process.env.CRON_SECRET;
  const provided = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret');
  if (expected && provided !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const result = await refreshAllTenantRates(db);
  return NextResponse.json({
    ok: true,
    updated: result.updated,
    rate: { currency: result.rate.currency, rate: result.rate.rate, source: result.rate.source, date: result.rate.date.toISOString() },
  });
}

export async function GET(req: Request) {
  return POST(req);
}
