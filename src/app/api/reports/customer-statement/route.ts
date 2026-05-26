import { NextResponse } from 'next/server';
import BigNumber from 'bignumber.js';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

export async function GET(req: Request) {
  const session = await requireSession();
  const url = new URL(req.url);
  const contactId = url.searchParams.get('contactId');
  if (!contactId) return NextResponse.json({ error: 'contactId required' }, { status: 400 });

  const contact = await db.contact.findFirst({
    where: { id: contactId, tenantId: session.tenantId },
  });
  if (!contact) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const invoices = await db.invoice.findMany({
    where: { tenantId: session.tenantId, contactId, status: { not: 'CANCELLED' } },
    select: { id: true, number: true, date: true, total: true, currency: true, status: true },
    orderBy: { date: 'asc' },
  });
  const payments = await db.payment.findMany({
    where: { tenantId: session.tenantId, contactId },
    select: { id: true, number: true, date: true, amount: true, direction: true, currency: true, method: true },
    orderBy: { date: 'asc' },
  });

  type Line = { date: Date; ref: string; kind: 'INVOICE' | 'PAYMENT'; debit: number; credit: number; balance: number };
  const lines: Omit<Line, 'balance'>[] = [];
  for (const i of invoices) lines.push({ date: i.date, ref: i.number, kind: 'INVOICE', debit: Number(i.total), credit: 0 });
  for (const p of payments) {
    const amt = Number(p.amount);
    if (p.direction === 'IN') lines.push({ date: p.date, ref: p.number, kind: 'PAYMENT', debit: 0, credit: amt });
    else lines.push({ date: p.date, ref: p.number, kind: 'PAYMENT', debit: amt, credit: 0 });
  }
  lines.sort((a, b) => a.date.getTime() - b.date.getTime());

  const opening = new BigNumber(contact.openingBalance?.toString() ?? '0');
  let running = opening;
  const out: Line[] = lines.map((l) => {
    running = running.plus(l.debit).minus(l.credit);
    return { ...l, balance: running.toNumber() };
  });

  return NextResponse.json({
    contact: { id: contact.id, name: contact.nameEn || contact.nameAr, currency: contact.currency, openingBalance: opening.toNumber() },
    lines: out,
    summary: {
      totalInvoiced: invoices.reduce((s, i) => s + Number(i.total), 0),
      totalPaid: payments.filter((p) => p.direction === 'IN').reduce((s, p) => s + Number(p.amount), 0),
      totalRefunded: payments.filter((p) => p.direction === 'OUT').reduce((s, p) => s + Number(p.amount), 0),
      currentBalance: running.toNumber(),
    },
  });
}
