/**
 * Recurring invoice engine. Walks every active template whose nextIssueAt <= now,
 * generates a new Invoice, advances nextIssueAt, optionally posts the journal.
 */

import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import BigNumber from 'bignumber.js';
import { formatInvoiceNumber } from './invoice';
import { buildInvoiceJournalLines, assertBalanced } from './journals';

export function advanceDate(d: Date, cadence: string, day: number | null): Date {
  const next = new Date(d);
  switch (cadence) {
    case 'DAILY':     next.setUTCDate(next.getUTCDate() + 1); break;
    case 'WEEKLY':    next.setUTCDate(next.getUTCDate() + 7); break;
    case 'MONTHLY':   next.setUTCMonth(next.getUTCMonth() + 1); break;
    case 'QUARTERLY': next.setUTCMonth(next.getUTCMonth() + 3); break;
    case 'ANNUALLY':  next.setUTCFullYear(next.getUTCFullYear() + 1); break;
  }
  if (cadence === 'MONTHLY' && day) next.setUTCDate(Math.min(day, 28));
  return next;
}

export interface RecurringRunResult {
  generated: number;
  templates: Array<{ templateId: string; invoiceId: string; invoiceNumber: string }>;
}

export async function runRecurring(
  db: PrismaClient,
  tenantId: string,
  now: Date = new Date()
): Promise<RecurringRunResult> {
  const templates = await db.recurringInvoiceTemplate.findMany({
    where: {
      tenantId, isActive: true,
      nextIssueAt: { lte: now },
      OR: [{ endDate: null }, { endDate: { gt: now } }],
    },
    include: { lines: true },
  });

  const out: RecurringRunResult = { generated: 0, templates: [] };

  for (const tpl of templates) {
    const lines = tpl.lines.map((l) => {
      const base = new BigNumber(l.quantity.toString()).times(l.unitPrice.toString());
      const tax = base.times(l.taxRate.toString());
      return { ...l, base, tax, total: base.plus(tax) };
    });
    const subtotal = lines.reduce((s, l) => s.plus(l.base), new BigNumber(0));
    const taxTotal = lines.reduce((s, l) => s.plus(l.tax), new BigNumber(0));
    const total    = subtotal.plus(taxTotal);

    const year = now.getUTCFullYear();
    const last = await db.invoice.findFirst({
      where: { tenantId, number: { startsWith: `INV-${year}-` } },
      orderBy: { number: 'desc' }, select: { number: true },
    });
    const seq = last ? parseInt(last.number.split('-')[2], 10) + 1 : 1;
    const number = formatInvoiceNumber('INV', year, seq);

    await db.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          tenantId, number, kind: 'DOMESTIC_SALE',
          contactId: tpl.contactId, date: now,
          currency: tpl.currency, fxRate: tpl.fxRate,
          paymentTerms: tpl.paymentTerms,
          subtotal: new Prisma.Decimal(subtotal.toString()),
          taxTotal: new Prisma.Decimal(taxTotal.toString()),
          total: new Prisma.Decimal(total.toString()),
          status: tpl.autoPost ? 'POSTED' : 'DRAFT',
          notes: tpl.notes,
          lines: {
            create: lines.map((l) => ({
              productId: l.productId,
              description: l.description,
              quantity: new Prisma.Decimal(l.quantity.toString()),
              unitOfMeasure: l.unitOfMeasure,
              unitPrice: new Prisma.Decimal(l.unitPrice.toString()),
              taxRate: new Prisma.Decimal(l.taxRate.toString()),
              taxAmount: new Prisma.Decimal(l.tax.toString()),
              lineTotal: new Prisma.Decimal(l.total.toString()),
            })),
          },
        },
      });

      if (tpl.autoPost) {
        const journalLines = buildInvoiceJournalLines({
          subtotal, taxTotal, total,
          isExport: false, contactId: tpl.contactId,
          currency: tpl.currency, fxRate: tpl.fxRate.toString(),
        });
        assertBalanced(journalLines);
        const codes = Array.from(new Set(journalLines.map((l) => l.accountCode)));
        const accounts = await tx.account.findMany({
          where: { tenantId, code: { in: codes } },
          select: { id: true, code: true },
        });
        const map = new Map(accounts.map((a) => [a.code, a.id]));
        const journal = await tx.journal.create({
          data: {
            tenantId,
            reference: `JV-REC-${number}`,
            date: now, source: 'SALES_INVOICE',
            memo: `Recurring invoice ${number} (${tpl.name})`,
            isPosted: true, postedAt: now,
            lines: {
              create: journalLines.map((l) => ({
                accountId: map.get(l.accountCode)!,
                debit: new Prisma.Decimal(String(l.debit ?? 0)),
                credit: new Prisma.Decimal(String(l.credit ?? 0)),
              })),
            },
          },
        });
        await tx.invoice.update({ where: { id: inv.id }, data: { postedJournalId: journal.id } });
      }

      await tx.recurringInvoiceTemplate.update({
        where: { id: tpl.id },
        data: {
          lastIssuedAt: now,
          nextIssueAt: advanceDate(tpl.nextIssueAt, tpl.cadence, tpl.cadenceDay),
        },
      });

      out.generated++;
      out.templates.push({ templateId: tpl.id, invoiceId: inv.id, invoiceNumber: number });
    });
  }
  return out;
}
