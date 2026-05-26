import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

export async function GET() {
  const session = await requireSession();
  const tenantId = session.tenantId;

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

  const invoices = await db.invoice.findMany({
    where: {
      tenantId, date: { gte: start },
      status: { in: ['POSTED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'] },
    },
    select: { date: true, total: true, contactId: true,
      contact: { select: { nameAr: true, nameEn: true } } },
  });

  const monthlyMap = new Map<string, number>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (11 - i), 1));
    monthlyMap.set(d.toISOString().slice(0, 7), 0);
  }
  for (const inv of invoices) {
    const k = inv.date.toISOString().slice(0, 7);
    monthlyMap.set(k, (monthlyMap.get(k) ?? 0) + Number(inv.total));
  }
  const salesTrend = Array.from(monthlyMap.entries()).map(([month, total]) => ({ month, total }));

  const byContact = new Map<string, { name: string; total: number }>();
  for (const inv of invoices) {
    const name = inv.contact.nameAr ?? inv.contact.nameEn ?? '—';
    const cur = byContact.get(inv.contactId) ?? { name, total: 0 };
    cur.total += Number(inv.total);
    byContact.set(inv.contactId, cur);
  }
  const topCustomers = Array.from(byContact.values())
    .sort((a, b) => b.total - a.total).slice(0, 8);

  const payments = await db.payment.findMany({
    where: { tenantId, date: { gte: start } },
    select: { date: true, amount: true, direction: true },
  });
  const cashflowMap = new Map<string, { inflow: number; outflow: number }>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (11 - i), 1));
    cashflowMap.set(d.toISOString().slice(0, 7), { inflow: 0, outflow: 0 });
  }
  for (const p of payments) {
    const k = p.date.toISOString().slice(0, 7);
    const row = cashflowMap.get(k) ?? { inflow: 0, outflow: 0 };
    if (p.direction === 'IN') row.inflow += Number(p.amount);
    else row.outflow += Number(p.amount);
    cashflowMap.set(k, row);
  }
  const cashflow = Array.from(cashflowMap.entries()).map(([month, v]) => ({ month, ...v }));

  return NextResponse.json({ salesTrend, topCustomers, cashflow });
}
