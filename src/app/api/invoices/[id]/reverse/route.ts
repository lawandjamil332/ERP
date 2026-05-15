/**
 * Credit-note generation. Iraqi tax law: invoices cannot be deleted —
 * they must be reversed with a credit note (إشعار دائن).
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import BigNumber from 'bignumber.js';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { formatInvoiceNumber } from '@/lib/iraq/invoice';
import { assertBalanced } from '@/lib/iraq/journals';

const Body = z.object({
  reason: z.string().min(1),
  partial: z.array(z.object({
    invoiceLineId: z.string(),
    quantity: z.number().positive(),
  })).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  let session;
  try { session = await requireSession(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });

  const original = await db.invoice.findFirst({
    where: { id, tenantId: session.tenantId, deletedAt: null },
    include: { lines: true },
  });
  if (!original) return NextResponse.json({ error: 'invoice_not_found' }, { status: 404 });
  if (original.status === 'REVERSED') return NextResponse.json({ error: 'already_reversed' }, { status: 409 });
  if (original.kind === 'CREDIT_NOTE' || original.kind === 'DEBIT_NOTE') {
    return NextResponse.json({ error: 'cannot_reverse_note' }, { status: 400 });
  }

  const lineMap = new Map(original.lines.map((l) => [l.id, l]));
  const linesToReverse = parsed.data.partial
    ? parsed.data.partial.map((p) => {
        const src = lineMap.get(p.invoiceLineId);
        if (!src) throw new Error(`line_not_found: ${p.invoiceLineId}`);
        return { src, qty: new BigNumber(p.quantity) };
      })
    : original.lines.map((src) => ({ src, qty: new BigNumber(src.quantity.toString()) }));

  const linesData = linesToReverse.map(({ src, qty }) => {
    const unit = new BigNumber(src.unitPrice.toString());
    const base = qty.times(unit);
    const tax = base.times(src.taxRate.toString());
    const total = base.plus(tax);
    return { src, qty, base, tax, total };
  });

  const subtotal = linesData.reduce((s, l) => s.plus(l.base), new BigNumber(0));
  const taxTotal = linesData.reduce((s, l) => s.plus(l.tax), new BigNumber(0));
  const total    = subtotal.plus(taxTotal);

  const year = new Date().getUTCFullYear();
  const last = await db.invoice.findFirst({
    where: { tenantId: session.tenantId, number: { startsWith: `CN-${year}-` } },
    orderBy: { number: 'desc' }, select: { number: true },
  });
  const seq = last ? parseInt(last.number.split('-')[2], 10) + 1 : 1;
  const number = formatInvoiceNumber('CN', year, seq);

  const created = await db.$transaction(async (tx) => {
    const cn = await tx.invoice.create({
      data: {
        tenantId: session.tenantId,
        number,
        kind: 'CREDIT_NOTE',
        reversesInvoiceId: original.id,
        contactId: original.contactId,
        date: new Date(),
        currency: original.currency,
        fxRate: original.fxRate,
        subtotal: new Prisma.Decimal(subtotal.toString()),
        taxTotal: new Prisma.Decimal(taxTotal.toString()),
        total: new Prisma.Decimal(total.toString()),
        status: 'POSTED',
        notes: `Credit note for ${original.number}: ${parsed.data.reason}`,
        lines: {
          create: linesData.map(({ src, qty, base, tax, total }) => ({
            productId: src.productId,
            description: `[Reversal] ${src.description}`,
            hsCode: src.hsCode,
            countryOfOrigin: src.countryOfOrigin,
            trademark: src.trademark,
            quantity: new Prisma.Decimal(qty.toString()),
            unitOfMeasure: src.unitOfMeasure,
            unitPrice: src.unitPrice,
            taxRate: src.taxRate,
            taxAmount: new Prisma.Decimal(tax.toString()),
            lineTotal: new Prisma.Decimal(total.toString()),
          })),
        },
      },
    });

    const isExport = original.kind === 'EXPORT';
    const salesAccount = isExport ? '412' : '411';
    const codes = ['1121', salesAccount, '2134'];
    const accounts = await tx.account.findMany({
      where: { tenantId: session.tenantId, code: { in: codes } },
      select: { id: true, code: true },
    });
    const map = new Map(accounts.map((a) => [a.code, a.id]));
    const lines: { accountCode: string; debit?: BigNumber; credit?: BigNumber }[] = [
      { accountCode: '1121',        credit: total },
      { accountCode: salesAccount,  debit: subtotal },
      ...(taxTotal.gt(0) ? [{ accountCode: '2134', debit: taxTotal }] : []),
    ];
    assertBalanced(lines);
    const journal = await tx.journal.create({
      data: {
        tenantId: session.tenantId,
        reference: `JV-CN-${seq}-${year}`,
        date: new Date(),
        source: 'SALES_INVOICE',
        memo: `Credit note ${number} reverses ${original.number}`,
        isPosted: true, postedAt: new Date(),
        lines: {
          create: lines.map((l) => ({
            accountId: map.get(l.accountCode)!,
            debit: new Prisma.Decimal(String(l.debit ?? 0)),
            credit: new Prisma.Decimal(String(l.credit ?? 0)),
            currency: original.currency,
            fxRate: original.fxRate,
            contactId: original.contactId,
          })),
        },
      },
    });
    await tx.invoice.update({ where: { id: cn.id }, data: { postedJournalId: journal.id } });

    if (!parsed.data.partial) {
      await tx.invoice.update({ where: { id: original.id }, data: { status: 'REVERSED' } });
    }

    return cn;
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
