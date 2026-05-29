import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth/permissions';
import { hasFreshReauth } from '@/lib/auth/reauth';

const Body = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  action: z.enum(['CLOSE', 'REOPEN']),
});

export async function GET(req: Request) {
  const guard = await requirePermission('accounting', 'view');
  if (guard instanceof NextResponse) return guard;
  const session = guard;
  const url = new URL(req.url);
  const year = parseInt(url.searchParams.get('year') ?? `${new Date().getUTCFullYear()}`, 10);
  const rows = await db.accountingPeriod.findMany({
    where: { tenantId: session.tenantId, year },
    orderBy: { month: 'asc' },
  });
  // Fill missing months so the UI gets all 12.
  const map = new Map(rows.map((r) => [r.month, r]));
  const data = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return map.get(month) ?? { id: null, year, month, status: 'OPEN', closedAt: null };
  });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const guard = await requirePermission('accounting', 'post');
  if (guard instanceof NextResponse) return guard;
  const session = guard;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  // Sensitive action — require re-auth proof (≤5 minutes old).
  const fresh = await hasFreshReauth(session.userId);
  if (!fresh) return NextResponse.json({ error: 'reauth_required' }, { status: 401 });

  const { year, month, action } = parsed.data;
  const status = action === 'CLOSE' ? 'CLOSED' : 'OPEN';

  const period = await db.accountingPeriod.upsert({
    where: { tenantId_year_month: { tenantId: session.tenantId, year, month } },
    create: {
      tenantId: session.tenantId, year, month, status,
      closedAt: status === 'CLOSED' ? new Date() : null,
      closedById: status === 'CLOSED' ? session.userId : null,
    },
    update: {
      status,
      closedAt: status === 'CLOSED' ? new Date() : null,
      closedById: status === 'CLOSED' ? session.userId : null,
    },
  });
  return NextResponse.json({ data: period });
}
