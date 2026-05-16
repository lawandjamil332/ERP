/**
 * Diwan al-Riqaba al-Maliyya (Federal Board of Supreme Audit) audit pack.
 *
 * Iraqi government contractors and SOEs are audited annually by the Federal
 * Board of Supreme Audit. The board requires:
 *   - Trial balance for the fiscal year
 *   - Journal voucher register (all posted JVs)
 *   - Fixed asset register
 *   - Aged AR/AP at year-end
 *   - Bank reconciliation snapshots
 *
 * This endpoint returns a single multi-section CSV bundle for the requested
 * fiscal year. Future enhancement: ZIP with one CSV per section.
 */

import { NextResponse } from 'next/server';
import BigNumber from 'bignumber.js';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { trialBalance } from '@/lib/iraq/reports';
import { agedReceivables, agedPayables, bucketToObject } from '@/lib/iraq/aging';

function escapeCsv(v: unknown): string {
  const s = v == null ? '' : String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
const row = (cells: unknown[]) => cells.map(escapeCsv).join(',');

export async function GET(req: Request) {
  const session = await requireSession();
  const url = new URL(req.url);
  const year = parseInt(url.searchParams.get('year') ?? new Date().getUTCFullYear().toString(), 10);
  const asOf = new Date(Date.UTC(year, 11, 31));

  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });
  const [tb, ar, ap, fixedAssets, journals] = await Promise.all([
    trialBalance(db, session.tenantId, asOf),
    agedReceivables(db, session.tenantId, asOf),
    agedPayables(db, session.tenantId, asOf),
    db.fixedAsset.findMany({
      where: { tenantId: session.tenantId, acquisitionDate: { lte: asOf } },
      orderBy: { assetCode: 'asc' },
    }),
    db.journal.findMany({
      where: {
        tenantId: session.tenantId,
        isPosted: true,
        date: { gte: new Date(Date.UTC(year, 0, 1)), lte: asOf },
      },
      include: { lines: { include: { account: true } } },
      orderBy: { date: 'asc' },
    }),
  ]);

  const lines: string[] = [];

  lines.push('====== AUDIT PACK ======');
  lines.push(row(['Tenant (AR)', tenant?.nameAr ?? '']));
  lines.push(row(['Tenant (EN)', tenant?.nameEn ?? '']));
  lines.push(row(['Tax number', tenant?.taxNumber ?? '']));
  lines.push(row(['Fiscal year', year]));
  lines.push(row(['Generated', new Date().toISOString()]));
  lines.push(row(['Compliance', 'Iraqi Unified Accounting System (IUAS) / Diwan al-Riqaba al-Maliyya']));
  lines.push('');

  lines.push('====== TRIAL BALANCE ======');
  lines.push(row(['code', 'nameAr', 'nameEn', 'type', 'debit', 'credit', 'balance']));
  let tD = new BigNumber(0), tC = new BigNumber(0);
  for (const r of tb) {
    lines.push(row([r.code, r.nameAr, r.nameEn, r.type, r.debit.toFixed(2), r.credit.toFixed(2), r.balance.toFixed(2)]));
    tD = tD.plus(r.debit); tC = tC.plus(r.credit);
  }
  lines.push(row(['', 'TOTAL', '', '', tD.toFixed(2), tC.toFixed(2), '']));
  lines.push('');

  lines.push('====== JOURNAL VOUCHERS (POSTED) ======');
  lines.push(row(['journalRef', 'date', 'source', 'memo', 'accountCode', 'accountName', 'debit', 'credit', 'lineMemo']));
  for (const j of journals) {
    for (const l of j.lines) {
      lines.push(row([
        j.reference,
        j.date.toISOString().slice(0, 10),
        j.source,
        j.memo ?? '',
        l.account.code,
        l.account.nameAr,
        l.debit.toFixed(2),
        l.credit.toFixed(2),
        l.memo ?? '',
      ]));
    }
  }
  lines.push('');

  lines.push('====== FIXED ASSET REGISTER ======');
  lines.push(row(['assetCode', 'nameAr', 'nameEn', 'category', 'acquisitionDate', 'acquisitionCost', 'usefulLifeYears', 'method', 'accDepreciation', 'netBookValue', 'status']));
  for (const a of fixedAssets) {
    lines.push(row([
      a.assetCode, a.nameAr, a.nameEn, a.category,
      a.acquisitionDate.toISOString().slice(0, 10),
      a.acquisitionCost.toFixed(2),
      a.usefulLife, a.method,
      a.accumulatedDepreciation.toFixed(2),
      a.netBookValue.toFixed(2),
      a.status,
    ]));
  }
  lines.push('');

  lines.push('====== AGED RECEIVABLES (AR) at ' + asOf.toISOString().slice(0, 10) + ' ======');
  lines.push(row(['contactId', 'contactName', 'notDue', 'current', 'd31_60', 'd61_90', 'd91_plus', 'total']));
  for (const r of ar.rows) {
    const b = bucketToObject(r.buckets);
    lines.push(row([r.contactId, r.contactName, b.notDue, b.current, b.d31_60, b.d61_90, b.d91_plus, b.total]));
  }
  const arTot = bucketToObject(ar.totals);
  lines.push(row(['', 'TOTAL AR', arTot.notDue, arTot.current, arTot.d31_60, arTot.d61_90, arTot.d91_plus, arTot.total]));
  lines.push('');

  lines.push('====== AGED PAYABLES (AP) at ' + asOf.toISOString().slice(0, 10) + ' ======');
  lines.push(row(['supplierId', 'supplierName', 'notDue', 'current', 'd31_60', 'd61_90', 'd91_plus', 'total']));
  for (const r of ap.rows) {
    const b = bucketToObject(r.buckets);
    lines.push(row([r.contactId, r.contactName, b.notDue, b.current, b.d31_60, b.d61_90, b.d91_plus, b.total]));
  }
  const apTot = bucketToObject(ap.totals);
  lines.push(row(['', 'TOTAL AP', apTot.notDue, apTot.current, apTot.d31_60, apTot.d61_90, apTot.d91_plus, apTot.total]));
  lines.push('');

  lines.push('====== END OF AUDIT PACK ======');
  lines.push(row(['Lines of journal entries reviewed', journals.reduce((s, j) => s + j.lines.length, 0)]));

  const body = '﻿' + lines.join('\r\n');  // BOM for Excel UTF-8 compatibility
  return new Response(body, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="diwan-audit-pack-FY${year}.csv"`,
    },
  });
}
