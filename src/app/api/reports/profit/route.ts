import { NextResponse } from 'next/server';
import BigNumber from 'bignumber.js';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

type Row = { label: string; revenue: number; cogs: number; profit: number; margin: number };

function makeRow(label: string, revenue: BigNumber, cogs: BigNumber): Row {
  const profit = revenue.minus(cogs);
  const margin = revenue.isZero() ? 0 : profit.div(revenue).times(100).toNumber();
  return { label, revenue: revenue.toNumber(), cogs: cogs.toNumber(), profit: profit.toNumber(), margin };
}

export async function GET() {
  const session = await requireSession();
  const since365 = new Date(); since365.setUTCDate(since365.getUTCDate() - 365);

  const lines = await db.invoiceLine.findMany({
    where: {
      invoice: { tenantId: session.tenantId, status: { in: ['POSTED', 'PARTIALLY_PAID', 'PAID'] }, date: { gte: since365 } },
    },
    include: {
      product: { select: { cost: true } },
      invoice: { select: { date: true, contactId: true, contact: { select: { nameAr: true, nameEn: true } } } },
    },
  });

  let r7 = new BigNumber(0), c7 = new BigNumber(0);
  let r30 = new BigNumber(0), c30 = new BigNumber(0);
  let r365 = new BigNumber(0), c365 = new BigNumber(0);
  const byClient: Record<string, { name: string; rev: BigNumber; cogs: BigNumber }> = {};
  const daily: Record<string, { rev: BigNumber; cogs: BigNumber }> = {};
  const monthly: Record<string, { rev: BigNumber; cogs: BigNumber }> = {};
  const yearly: Record<string, { rev: BigNumber; cogs: BigNumber }> = {};
  const now = Date.now();

  for (const l of lines) {
    const qty = new BigNumber(l.quantity.toString());
    const rev = qty.times(l.unitPrice.toString());
    const cogs = qty.times((l.product?.cost ?? 0).toString());
    const date = l.invoice.date;
    const ageDays = (now - date.getTime()) / (1000 * 60 * 60 * 24);

    r365 = r365.plus(rev); c365 = c365.plus(cogs);
    if (ageDays <= 30) { r30 = r30.plus(rev); c30 = c30.plus(cogs); }
    if (ageDays <= 7) { r7 = r7.plus(rev); c7 = c7.plus(cogs); }

    const cid = l.invoice.contactId;
    const cname = l.invoice.contact.nameEn || l.invoice.contact.nameAr;
    if (!byClient[cid]) byClient[cid] = { name: cname, rev: new BigNumber(0), cogs: new BigNumber(0) };
    byClient[cid].rev = byClient[cid].rev.plus(rev);
    byClient[cid].cogs = byClient[cid].cogs.plus(cogs);

    const d = date.toISOString().slice(0, 10);
    const m = date.toISOString().slice(0, 7);
    const y = date.toISOString().slice(0, 4);
    daily[d] ??= { rev: new BigNumber(0), cogs: new BigNumber(0) };
    daily[d].rev = daily[d].rev.plus(rev); daily[d].cogs = daily[d].cogs.plus(cogs);
    monthly[m] ??= { rev: new BigNumber(0), cogs: new BigNumber(0) };
    monthly[m].rev = monthly[m].rev.plus(rev); monthly[m].cogs = monthly[m].cogs.plus(cogs);
    yearly[y] ??= { rev: new BigNumber(0), cogs: new BigNumber(0) };
    yearly[y].rev = yearly[y].rev.plus(rev); yearly[y].cogs = yearly[y].cogs.plus(cogs);
  }

  const profit7 = r7.minus(c7).toNumber();
  const profit30 = r30.minus(c30).toNumber();
  const profit365 = r365.minus(c365).toNumber();

  return NextResponse.json({
    totals: { d7: profit7, d30: profit30, d365: profit365 },
    byClient: Object.values(byClient).map((c) => makeRow(c.name, c.rev, c.cogs)).sort((a, b) => b.profit - a.profit),
    byEmployee: [],
    daily: Object.entries(daily).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 31).map(([k, v]) => makeRow(k, v.rev, v.cogs)),
    monthly: Object.entries(monthly).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12).map(([k, v]) => makeRow(k, v.rev, v.cogs)),
    yearly: Object.entries(yearly).sort((a, b) => b[0].localeCompare(a[0])).map(([k, v]) => makeRow(k, v.rev, v.cogs)),
  });
}
