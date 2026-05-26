import { NextResponse } from 'next/server';
import { z } from 'zod';
import BigNumber from 'bignumber.js';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { assertBalanced } from '@/lib/iraq/journals';

const Application = z.object({
  invoiceId: z.string().optional(),
  billId: z.string().optional(),
  amount: z.number().positive(),
});

const Body = z.object({
  number: z.string().min(1),
  date: z.coerce.date(),
  contactId: z.string(),
  direction: z.enum(['IN', 'OUT']),
  method: z.enum(['CASH','BANK_TRANSFER','CHEQUE','CARD','ZAIN_CASH','ASIA_HAWALA','FIB','OTHER']).default('CASH'),
  reference: z.string().optional(),
  currency: z.string().length(3).default('IQD'),
  fxRate: z.number().positive().default(1),
  amount: z.number().positive(),
  notes: z.string().optional(),
  applications: z.array(Application).default([]),
  cashAccountCode: z.string().default('1111'),
});

export async function GET() {
  const session = await requireSession();
  const payments = await db.payment.findMany({
    where: { tenantId: session.tenantId },
    include: { contact: true, applications: true },
    orderBy: { date: 'desc' }, take: 100,
  });
  return NextResponse.json({ data: payments });
}

export async function POST(req: Request) {
  let session;
  try { session = await requireSession(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const p = parsed.data;

  const appSum = p.applications.reduce((s, a) => s + a.amount, 0);
  if (appSum > 0 && Math.abs(appSum - p.amount) > 0.01) {
    return NextResponse.json({ error: 'applications_sum_mismatch' }, { status: 400 });
  }

  const created = await db.$transaction(async (tx) => {
    const pay = await tx.payment.create({
      data: {
        tenantId: session.tenantId,
        number: p.number,
        date: p.date,
        contactId: p.contactId,
        direction: p.direction,
        method: p.method,
        reference: p.reference,
        currency: p.currency,
        fxRate: new Prisma.Decimal(p.fxRate),
        amount: new Prisma.Decimal(p.amount),
        notes: p.notes,
        applications: {
          create: p.applications.map((a) => ({
            invoiceId: a.invoiceId,
            billId: a.billId,
            amount: new Prisma.Decimal(a.amount),
          })),
        },
      },
    });

    for (const a of p.applications) {
      if (a.invoiceId) {
        const inv = await tx.invoice.findUnique({ where: { id: a.invoiceId } });
        if (inv) {
          const newPaid = new BigNumber(inv.amountPaid.toString()).plus(a.amount);
          const total = new BigNumber(inv.total.toString());
          const status = newPaid.gte(total) ? 'PAID' : 'PARTIALLY_PAID';
          await tx.invoice.update({
            where: { id: a.invoiceId },
            data: { amountPaid: new Prisma.Decimal(newPaid.toString()), status },
          });
        }
      }
      if (a.billId) {
        const bill = await tx.bill.findUnique({ where: { id: a.billId } });
        if (bill) {
          const newPaid = new BigNumber(bill.amountPaid.toString()).plus(a.amount);
          const total = new BigNumber(bill.total.toString());
          const status = newPaid.gte(total) ? 'PAID' : 'PARTIALLY_PAID';
          await tx.bill.update({
            where: { id: a.billId },
            data: { amountPaid: new Prisma.Decimal(newPaid.toString()), status },
          });
        }
      }
    }

    const codes = [p.cashAccountCode, '1121', '211'];
    const accounts = await tx.account.findMany({
      where: { tenantId: session.tenantId, code: { in: codes } },
      select: { id: true, code: true },
    });
    const map = new Map(accounts.map((a) => [a.code, a.id]));
    const need = (c: string) => { const id = map.get(c); if (!id) throw new Error(`Account ${c} missing`); return id; };

    const lines = p.direction === 'IN'
      ? [
        { accountCode: p.cashAccountCode, debit: p.amount,  credit: 0 },
        { accountCode: '1121',            debit: 0,         credit: p.amount },
      ]
      : [
        { accountCode: '211',             debit: p.amount,  credit: 0 },
        { accountCode: p.cashAccountCode, debit: 0,         credit: p.amount },
      ];
    assertBalanced(lines.map((l) => ({ accountCode: l.accountCode, debit: l.debit, credit: l.credit })));

    const journal = await tx.journal.create({
      data: {
        tenantId: session.tenantId,
        reference: `JV-PAY-${pay.number}`,
        date: p.date,
        source: 'PAYMENT',
        memo: `${p.direction === 'IN' ? 'Receipt' : 'Payment'} ${pay.number}`,
        isPosted: true,
        postedAt: new Date(),
        lines: {
          create: lines.map((l) => ({
            accountId: need(l.accountCode),
            debit: new Prisma.Decimal(l.debit),
            credit: new Prisma.Decimal(l.credit),
          })),
        },
      },
    });
    await tx.payment.update({ where: { id: pay.id }, data: { postedJournalId: journal.id } });
    return pay;
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
