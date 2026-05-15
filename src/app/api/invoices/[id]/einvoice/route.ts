import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { buildEinvoicePayload, submitEinvoice } from '@/lib/iraq/gct-einvoice';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession();

  const inv = await db.invoice.findFirst({
    where: { id, tenantId: session.tenantId, deletedAt: null },
    include: { lines: true, contact: true },
  });
  if (!inv) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (inv.status === 'DRAFT') return NextResponse.json({ error: 'invoice_not_posted' }, { status: 400 });

  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });
  if (!tenant?.taxNumber) {
    return NextResponse.json({ error: 'tenant_missing_tax_number' }, { status: 400 });
  }

  const payload = buildEinvoicePayload({
    tenantId: session.tenantId,
    invoiceId: inv.id,
    invoiceNumber: inv.number,
    taxNumber: tenant.taxNumber,
    commercialReg: tenant.commercialReg,
    tenantName: tenant.nameEn,
  }, inv as any);

  const result = await submitEinvoice(db, {
    tenantId: session.tenantId,
    invoiceId: inv.id,
    invoiceNumber: inv.number,
    taxNumber: tenant.taxNumber,
    commercialReg: tenant.commercialReg,
    tenantName: tenant.nameEn,
  }, payload);

  if (result.status !== 'REJECTED') {
    await db.invoice.update({
      where: { id: inv.id },
      data: { eInvoiceUuid: payload.invoice.uuid, eInvoiceStatus: result.status },
    });
  }

  return NextResponse.json(result);
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession();
  const submissions = await db.eInvoiceSubmission.findMany({
    where: { tenantId: session.tenantId, invoiceId: id },
    orderBy: { submittedAt: 'desc' },
  });
  return NextResponse.json({ data: submissions });
}
