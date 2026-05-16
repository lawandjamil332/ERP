/**
 * Per-contact ledger / statement of account.
 *
 * Merges Invoices, Bills, and Payments into a chronological running-balance
 * statement — the "بضاعة على الحساب" view Iraqi wholesalers rely on.
 *
 * Positive balance = customer owes the company (AR)
 * Negative balance = company owes the contact (AP)
 */

import { NextResponse } from 'next/server';
import BigNumber from 'bignumber.js';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

interface LedgerEntry {
  date: string;
  type: 'INVOICE' | 'BILL' | 'PAYMENT_IN' | 'PAYMENT_OUT' | 'CREDIT_NOTE';
  reference: string;
  description: string;
  currency: string;
  debit: string;
  credit: string;
  balance: string;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession();
  const url = new URL(req.url);
  const fromQ = url.searchParams.get('from');
  const toQ = url.searchParams.get('to');

  const contact = await db.contact.findFirst({
    where: { id, tenantId: session.tenantId },
  });
  if (!contact) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const filter = {
    ...(fromQ ? { date: { gte: new Date(fromQ) } } : {}),
    ...(toQ ? { date: { lte: new Date(toQ) } } : {}),
  };

  const [invoices, bills, payments] = await Promise.all([
    db.invoice.findMany({
      where: { tenantId: session.tenantId, contactId: id, deletedAt: null, ...filter },
      select: { number: true, date: true, total: true, currency: true, kind: true, notes: true },
      orderBy: { date: 'asc' },
    }),
    db.bill.findMany({
      where: { tenantId: session.tenantId, supplierId: id, deletedAt: null, ...filter },
      select: { number: true, date: true, total: true, currency: true },
      orderBy: { date: 'asc' },
    }),
    db.payment.findMany({
      where: { tenantId: session.tenantId, contactId: id, deletedAt: null, ...filter },
      select: { number: true, date: true, amount: true, direction: true, currency: true, method: true, reference: true },
      orderBy: { date: 'asc' },
    }),
  ]);

  type Raw = { date: Date; type: LedgerEntry['type']; ref: string; desc: string; currency: string; debit: BigNumber; credit: BigNumber };
  const raw: Raw[] = [];

  for (const inv of invoices) {
    const total = new BigNumber(inv.total.toString());
    const isCredit = inv.kind === 'CREDIT_NOTE';
    raw.push({
      date: inv.date,
      type: isCredit ? 'CREDIT_NOTE' : 'INVOICE',
      ref: inv.number,
      desc: isCredit ? 'إشعار دائن — Credit note' : 'فاتورة بيع — Sales invoice',
      currency: inv.currency,
      debit: isCredit ? new BigNumber(0) : total,
      credit: isCredit ? total : new BigNumber(0),
    });
  }
  for (const b of bills) {
    raw.push({
      date: b.date,
      type: 'BILL',
      ref: b.number,
      desc: 'فاتورة شراء — Purchase bill',
      currency: b.currency,
      debit: new BigNumber(0),
      credit: new BigNumber(b.total.toString()),
    });
  }
  for (const p of payments) {
    const amt = new BigNumber(p.amount.toString());
    raw.push({
      date: p.date,
      type: p.direction === 'IN' ? 'PAYMENT_IN' : 'PAYMENT_OUT',
      ref: p.number,
      desc: p.direction === 'IN'
        ? `مقبوضات نقدية (${p.method})`
        : `مدفوعات نقدية (${p.method})`,
      currency: p.currency,
      debit: p.direction === 'IN' ? new BigNumber(0) : amt,
      credit: p.direction === 'IN' ? amt : new BigNumber(0),
    });
  }

  raw.sort((a, b) => a.date.getTime() - b.date.getTime() || a.ref.localeCompare(b.ref));

  const entries: LedgerEntry[] = [];
  let balance = new BigNumber(0);
  for (const r of raw) {
    balance = balance.plus(r.debit).minus(r.credit);
    entries.push({
      date: r.date.toISOString().slice(0, 10),
      type: r.type,
      reference: r.ref,
      description: r.desc,
      currency: r.currency,
      debit: r.debit.toFixed(2),
      credit: r.credit.toFixed(2),
      balance: balance.toFixed(2),
    });
  }

  return NextResponse.json({
    contact: {
      id: contact.id,
      nameAr: contact.nameAr,
      nameEn: contact.nameEn,
      taxNumber: contact.taxNumber,
      currency: contact.currency,
      creditLimit: contact.creditLimit.toString(),
    },
    totals: {
      debit: entries.reduce((s, e) => s.plus(e.debit), new BigNumber(0)).toFixed(2),
      credit: entries.reduce((s, e) => s.plus(e.credit), new BigNumber(0)).toFixed(2),
      balance: balance.toFixed(2),
    },
    entries,
  });
}
