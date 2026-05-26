import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import BigNumber from 'bignumber.js';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { assertBalanced } from '@/lib/iraq/journals';

const Line = z.object({
  productSku: z.string(),
  productName: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  taxRate: z.number().min(0).max(1).default(0),
});

const Body = z.object({
  sessionId: z.string(),
  method: z.enum(['CASH','BANK_TRANSFER','CARD','ZAIN_CASH','FIB']).default('CASH'),
  lines: z.array(Line).min(1),
  discount: z.number().nonnegative().default(0),
});

export async function POST(req: Request) {
  let session;
  try { session = await requireSession(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const ses = await db.posSession.findUnique({ where: { id: parsed.data.sessionId } });
  if (!ses || ses.closedAt) return NextResponse.json({ error: 'session_closed' }, { status: 400 });

  const lines = parsed.data.lines.map((l) => {
    const base = new BigNumber(l.quantity).times(l.unitPrice);
    const tax  = base.times(l.taxRate);
    return { ...l, base, tax, total: base.plus(tax) };
  });
  const subtotal = lines.reduce((s, l) => s.plus(l.base), new BigNumber(0));
  const taxTotal = lines.reduce((s, l) => s.plus(l.tax), new BigNumber(0));
  const total    = subtotal.plus(taxTotal).minus(parsed.data.discount);

  const created = await db.$transaction(async (tx) => {
    const count = await tx.posOrder.count({ where: { sessionId: ses.id } });
    const number = `${ses.id.slice(-4)}-${String(count + 1).padStart(4, '0')}`;
    const order = await tx.posOrder.create({
      data: {
        sessionId: ses.id,
        number,
        subtotal: new Prisma.Decimal(subtotal.toString()),
        taxTotal: new Prisma.Decimal(taxTotal.toString()),
        discount: new Prisma.Decimal(parsed.data.discount),
        total: new Prisma.Decimal(total.toString()),
        paid: new Prisma.Decimal(total.toString()),
        method: parsed.data.method,
        lines: {
          create: lines.map((l) => ({
            productSku: l.productSku,
            productName: l.productName,
            quantity: new Prisma.Decimal(l.quantity),
            unitPrice: new Prisma.Decimal(l.unitPrice),
            taxRate: new Prisma.Decimal(l.taxRate),
            total: new Prisma.Decimal(l.total.toString()),
          })),
        },
      },
    });

    const accounts = await tx.account.findMany({
      where: { tenantId: session.tenantId, code: { in: ['1111', '411', '2134'] } },
      select: { id: true, code: true },
    });
    const map = new Map(accounts.map((a) => [a.code, a.id]));
    const need = (c: string) => { const id = map.get(c); if (!id) throw new Error(`Account ${c} missing`); return id; };

    const jLines = [
      { accountCode: '1111', debit: total },
      { accountCode: '411',  credit: subtotal.minus(parsed.data.discount) },
      ...(taxTotal.gt(0) ? [{ accountCode: '2134', credit: taxTotal }] : []),
    ];
    assertBalanced(jLines.map((l) => ({ accountCode: l.accountCode, debit: l.debit, credit: l.credit })));

    const journal = await tx.journal.create({
      data: {
        tenantId: session.tenantId,
        reference: `JV-POS-${number}`,
        date: new Date(),
        source: 'POS',
        memo: `POS order ${number}`,
        isPosted: true,
        postedAt: new Date(),
        lines: {
          create: jLines.map((l) => ({
            accountId: need(l.accountCode),
            debit: new Prisma.Decimal(String(l.debit ?? 0)),
            credit: new Prisma.Decimal(String(l.credit ?? 0)),
          })),
        },
      },
    });
    await tx.posOrder.update({ where: { id: order.id }, data: { postedJournalId: journal.id } });
    return order;
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
