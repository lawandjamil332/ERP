import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { agedReceivables, agedPayables, bucketToObject } from '@/lib/iraq/aging';

export async function GET(req: Request) {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const kind = (searchParams.get('kind') ?? 'AR').toUpperCase();
  const asOf = searchParams.get('asOf') ? new Date(searchParams.get('asOf')!) : new Date();
  const result = kind === 'AP'
    ? await agedPayables(db, session.tenantId, asOf)
    : await agedReceivables(db, session.tenantId, asOf);
  return NextResponse.json({
    data: {
      kind, asOf: asOf.toISOString(),
      rows: result.rows.map((r) => ({
        contactId: r.contactId,
        contactName: r.contactName,
        buckets: bucketToObject(r.buckets),
      })),
      totals: bucketToObject(result.totals),
    },
  });
}
