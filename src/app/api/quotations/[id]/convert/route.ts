import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { formatInvoiceNumber } from '@/lib/iraq/invoice';

/**
 * Convert an accepted quotation into a DRAFT invoice. The original quotation is
 * marked CONVERTED and linked to the new invoice for traceability.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession();

  const q = await db.quotation.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { lines: true },
  });
  if (!q) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (q.status === 'CONVERTED' && q.convertedInvoiceId) {
    return NextResponse.json({ error: 'already_converted', invoiceId: q.convertedInvoiceId }, { status: 409 });
  }

  const year = q.date.getUTCFullYear();
  const last = await db.invoice.findFirst({
    where: { tenantId: session.tenantId, number: { startsWith: `INV-${year}-` } },
    orderBy: { number: 'desc' }, select: { number: true },
  });
  const seq = last ? parseInt(last.number.split('-')[2], 10) + 1 : 1;
  const number = formatInvoiceNumber('INV', year, seq);

  const invoice = await db.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        tenantId: session.tenantId, number,
        contactId: q.contactId,
        date: new Date(),
        currency: q.currency,
        fxRate: q.fxRate,
        subtotal: q.subtotal, taxTotal: q.taxTotal,
        discountTotal: q.discountTotal,
        total: q.total,
        status: 'DRAFT',
        notes: q.notes ? `${q.notes}\n— Converted from quotation ${q.number}` : `Converted from quotation ${q.number}`,
        lines: {
          create: q.lines.map((l) => ({
            productId: l.productId,
            description: l.description,
            quantity: l.quantity,
            unitOfMeasure: l.unitOfMeasure,
            unitPrice: l.unitPrice,
            discount: l.discount,
            taxRate: l.taxRate,
            taxAmount: l.taxAmount,
            lineTotal: l.lineTotal,
          })),
        },
      },
    });
    await tx.quotation.update({
      where: { id: q.id },
      data: { status: 'CONVERTED', convertedInvoiceId: inv.id },
    });
    return inv;
  });

  return NextResponse.json({ data: invoice });
}
