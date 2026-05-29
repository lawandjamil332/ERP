import { NextResponse } from 'next/server';
import { z } from 'zod';
import BigNumber from 'bignumber.js';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { validateInvoice, type InvoiceKind } from '@/lib/iraq/invoice';
import { buildInvoiceJournalLines, assertBalanced } from '@/lib/iraq/journals';
import { nextSequence } from '@/lib/sequence/next';
import { assertPeriodOpen, isPeriodClosedError } from '@/lib/accounting/period';
import { Prisma } from '@prisma/client';

const Line = z.object({
  productId: z.string().optional(),
  description: z.string().min(1),
  hsCode: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  trademark: z.string().optional(),
  quantity: z.number().positive(),
  unitOfMeasure: z.string().default('PCS'),
  unitPrice: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  taxRate: z.number().min(0).max(1).default(0),
});

const Body = z.object({
  kind: z.enum(['DOMESTIC_SALE', 'DOMESTIC_PURCHASE', 'EXPORT', 'IMPORT']),
  contactId: z.string(),
  date: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  currency: z.string().length(3).default('IQD'),
  fxRate: z.number().positive().default(1),
  paymentTerms: z.string().optional(),
  shippingTerms: z.string().optional(),
  importerAddress: z.string().optional(),
  exporterAddress: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  notes: z.string().optional(),
  postImmediately: z.boolean().default(false),
  lines: z.array(Line).min(1),
});

export async function GET() {
  const session = await requireSession();
  const invoices = await db.invoice.findMany({
    where: { tenantId: session.tenantId },
    include: { contact: true, lines: true },
    orderBy: { date: 'desc' },
    take: 100,
  });
  return NextResponse.json({ data: invoices });
}

export async function POST(req: Request) {
  let session;
  try { session = await requireSession(); }
  catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const body = parsed.data;

  const lines = body.lines.map((l) => {
    const baseAmount  = new BigNumber(l.quantity).times(l.unitPrice);
    const afterDisc   = baseAmount.minus(l.discount);
    const taxAmount   = afterDisc.times(l.taxRate);
    const lineTotal   = afterDisc.plus(taxAmount);
    return { ...l, baseAmount, afterDisc, taxAmount, lineTotal };
  });

  const subtotal      = lines.reduce((s, l) => s.plus(l.afterDisc), new BigNumber(0));
  const taxTotal      = lines.reduce((s, l) => s.plus(l.taxAmount), new BigNumber(0));
  const discountTotal = body.lines.reduce((s, l) => s + l.discount, 0);
  const total         = subtotal.plus(taxTotal);

  // Iraq compliance validation
  const validation = validateInvoice(body.kind as InvoiceKind, {
    number: 'PENDING',
    date: body.date,
    currency: body.currency,
    supplierTaxNumber: 'TENANT',
    total: total.toNumber(),
    paymentTerms: body.paymentTerms,
    shippingTerms: body.shippingTerms,
    importerAddress: body.importerAddress,
    exporterAddress: body.exporterAddress,
    lines: body.lines.map((l) => ({
      description: l.description,
      hsCode: l.hsCode,
      countryOfOrigin: l.countryOfOrigin,
      trademark: l.trademark,
      quantity: l.quantity,
      unitOfMeasure: l.unitOfMeasure,
      unitPrice: l.unitPrice,
    })),
  });
  if (!validation.success) {
    return NextResponse.json(
      { error: 'iraq_compliance_failed', issues: validation.error.issues },
      { status: 422 }
    );
  }

  const created = await db.$transaction(async (tx) => {
    // Race-safe gapless number — atomic increment, never "count + 1".
    const number = await nextSequence(tx, session.tenantId, 'INV', body.date);
    // Block back-dating into a closed accounting period.
    await assertPeriodOpen(tx, session.tenantId, body.date);
    const inv = await tx.invoice.create({
      data: {
        tenantId: session.tenantId,
        number,
        contactId: body.contactId,
        date: body.date,
        dueDate: body.dueDate,
        currency: body.currency,
        fxRate: new Prisma.Decimal(body.fxRate),
        paymentTerms: body.paymentTerms,
        shippingTerms: body.shippingTerms,
        importerAddress: body.importerAddress,
        exporterAddress: body.exporterAddress,
        countryOfOrigin: body.countryOfOrigin,
        subtotal: new Prisma.Decimal(subtotal.toString()),
        taxTotal: new Prisma.Decimal(taxTotal.toString()),
        discountTotal: new Prisma.Decimal(discountTotal),
        total: new Prisma.Decimal(total.toString()),
        status: body.postImmediately ? 'POSTED' : 'DRAFT',
        notes: body.notes,
        lines: {
          create: lines.map((l) => ({
            productId: l.productId,
            description: l.description,
            hsCode: l.hsCode,
            countryOfOrigin: l.countryOfOrigin,
            trademark: l.trademark,
            quantity: new Prisma.Decimal(l.quantity),
            unitOfMeasure: l.unitOfMeasure,
            unitPrice: new Prisma.Decimal(l.unitPrice),
            discount: new Prisma.Decimal(l.discount),
            taxRate: new Prisma.Decimal(l.taxRate),
            taxAmount: new Prisma.Decimal(l.taxAmount.toString()),
            lineTotal: new Prisma.Decimal(l.lineTotal.toString()),
          })),
        },
      },
    });

    if (body.postImmediately) {
      const journalLines = buildInvoiceJournalLines({
        subtotal, taxTotal, total,
        isExport: body.kind === 'EXPORT',
        contactId: body.contactId,
        currency: body.currency,
        fxRate: body.fxRate,
      });
      assertBalanced(journalLines);

      const codes = Array.from(new Set(journalLines.map((l) => l.accountCode)));
      const accounts = await tx.account.findMany({
        where: { tenantId: session.tenantId, code: { in: codes } },
        select: { id: true, code: true },
      });
      const map = new Map(accounts.map((a) => [a.code, a.id]));

      const jRef = await nextSequence(tx, session.tenantId, 'JV', body.date);
      const journal = await tx.journal.create({
        data: {
          tenantId: session.tenantId,
          reference: jRef,
          date: body.date,
          source: 'SALES_INVOICE',
          memo: `Sales invoice ${number}`,
          isPosted: true,
          postedAt: new Date(),
          lines: {
            create: journalLines.map((l) => {
              const accountId = map.get(l.accountCode);
              if (!accountId) throw new Error(`Account ${l.accountCode} not found in chart of accounts`);
              return {
                accountId,
                debit: new Prisma.Decimal(String(l.debit ?? 0)),
                credit: new Prisma.Decimal(String(l.credit ?? 0)),
                currency: l.currency ?? 'IQD',
                fxRate: new Prisma.Decimal(String(l.fxRate ?? 1)),
                memo: l.memo,
                contactId: l.contactId,
              };
            }),
          },
        },
      });

      await tx.invoice.update({
        where: { id: inv.id },
        data: { postedJournalId: journal.id },
      });
    }

    return inv;
  }).catch((e) => {
    if (isPeriodClosedError(e)) {
      return NextResponse.json({ error: 'period_closed', year: e.year, month: e.month }, { status: 422 });
    }
    throw e;
  });
  if (created instanceof NextResponse) return created;

  return NextResponse.json({ data: created }, { status: 201 });
}
