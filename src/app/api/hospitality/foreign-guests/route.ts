/**
 * Iraqi Ministry of Interior foreign-guest report.
 *
 * Hotels are required to submit a daily report of foreign guests checked in
 * to the security/immigration authority. The format is locally defined per
 * province; here we emit a CSV with the most commonly requested columns.
 *
 * GET /api/hospitality/foreign-guests?date=YYYY-MM-DD
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

function csv(cells: unknown[]) {
  return cells.map((c) => {
    const s = c == null ? '' : String(c);
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',');
}

export async function GET(req: Request) {
  const session = await requireSession();
  const url = new URL(req.url);
  const dateStr = url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
  const day = new Date(dateStr);
  if (isNaN(day.getTime())) return NextResponse.json({ error: 'invalid_date' }, { status: 400 });
  const next = new Date(day); next.setUTCDate(next.getUTCDate() + 1);

  const folios = await db.hotelFolio.findMany({
    where: {
      tenantId: session.tenantId,
      checkIn: { gte: day, lt: next },
    },
    orderBy: { checkIn: 'asc' },
  });

  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });

  const lines: string[] = [];
  lines.push(csv(['Hotel', tenant?.nameEn ?? '', 'Tax number', tenant?.taxNumber ?? '', 'Date', dateStr]));
  lines.push('');
  lines.push(csv(['folio_number', 'guest_name', 'id_type', 'id_number', 'room', 'check_in', 'check_out', 'status']));
  for (const f of folios) {
    lines.push(csv([
      f.number,
      f.guestName,
      f.guestIdType ?? '',
      f.guestIdNumber ?? '',
      f.roomNumber,
      f.checkIn.toISOString(),
      f.checkOut?.toISOString() ?? '',
      f.status,
    ]));
  }

  return new Response('﻿' + lines.join('\r\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="foreign-guests-${dateStr}.csv"`,
    },
  });
}
