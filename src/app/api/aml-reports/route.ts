import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const ScanBody = z.object({
  since: z.coerce.date().optional(),
});

/**
 * Lists existing AML threshold flags. Future enhancement: trigger a
 * background re-scan of payments and stock movements over the window.
 */
export async function GET(req: Request) {
  const session = await requireSession();
  const url = new URL(req.url);
  const since = url.searchParams.get('since');
  const rows = await db.amlReport.findMany({
    where: {
      tenantId: session.tenantId,
      ...(since ? { createdAt: { gte: new Date(since) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  return NextResponse.json({ data: rows, threshold_iqd: 15_000_000 });
}

/** Mark a flag as reported (with reference number from FIU portal). */
export async function PUT(req: Request) {
  const session = await requireSession();
  const body = await req.json().catch(() => ({} as any));
  const parsed = z.object({
    id: z.string(),
    reportReference: z.string().optional(),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const row = await db.amlReport.updateMany({
    where: { id: parsed.data.id, tenantId: session.tenantId },
    data: { reportedAt: new Date(), reportReference: parsed.data.reportReference ?? null },
  });
  return NextResponse.json({ updated: row.count });
}
