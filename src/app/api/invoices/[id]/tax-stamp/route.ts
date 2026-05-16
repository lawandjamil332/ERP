import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { computeTaxStamp } from '@/lib/iraq/tax-stamp';

/**
 * Compute (GET) or apply (POST) the Iraqi tax stamp (طوابع مالية) for an
 * invoice. Tenant governorate determines the threshold and rate.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession();
  const invoice = await db.invoice.findFirst({
    where: { id, tenantId: session.tenantId, deletedAt: null },
  });
  if (!invoice) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });
  const calc = computeTaxStamp({
    invoiceTotalIqd: invoice.total.toString(),
    governorate: tenant?.governorate,
  });
  return NextResponse.json({
    invoiceId: invoice.id,
    governorate: tenant?.governorate ?? null,
    currentApplied: invoice.taxStampApplied,
    currentAmount: invoice.taxStampAmount.toString(),
    suggested: calc,
  });
}

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession();
  const invoice = await db.invoice.findFirst({
    where: { id, tenantId: session.tenantId, deletedAt: null },
  });
  if (!invoice) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });
  const calc = computeTaxStamp({
    invoiceTotalIqd: invoice.total.toString(),
    governorate: tenant?.governorate,
  });
  const updated = await db.invoice.update({
    where: { id },
    data: {
      taxStampApplied: calc.applies,
      taxStampAmount: new Prisma.Decimal(calc.stampAmount),
    },
  });
  return NextResponse.json({ data: updated, calc });
}
