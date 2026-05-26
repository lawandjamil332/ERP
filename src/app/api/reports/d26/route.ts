import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { buildD26, toD26Csv } from '@/lib/iraq/d26';

export async function GET(req: Request) {
  const session = await requireSession();
  const url = new URL(req.url);
  const year = parseInt(url.searchParams.get('year') ?? (new Date().getUTCFullYear() - 1).toString(), 10);
  const format = (url.searchParams.get('format') ?? 'json').toLowerCase();

  const result = await buildD26(db, session.tenantId, year);
  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });

  if (format === 'csv') {
    const csv = toD26Csv(result, {
      nameAr: tenant?.nameAr ?? '',
      nameEn: tenant?.nameEn ?? '',
      taxNumber: tenant?.taxNumber ?? null,
    });
    return new Response(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="D26-FY${year}.csv"`,
      },
    });
  }
  return NextResponse.json({ data: result });
}
