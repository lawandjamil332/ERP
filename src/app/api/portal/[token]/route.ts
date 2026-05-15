import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const rec = await db.customerPortalToken.findUnique({ where: { token } });
  if (!rec || rec.expiresAt < new Date()) {
    return NextResponse.json({ error: 'invalid_or_expired' }, { status: 404 });
  }
  const contact = await db.contact.findUnique({ where: { id: rec.contactId } });
  if (!contact) return NextResponse.json({ error: 'contact_not_found' }, { status: 404 });
  const tenant = await db.tenant.findUnique({ where: { id: rec.tenantId } });
  const invoices = await db.invoice.findMany({
    where: { tenantId: rec.tenantId, contactId: rec.contactId },
    orderBy: { date: 'desc' },
    take: 100,
    select: {
      id: true, number: true, date: true, dueDate: true,
      currency: true, total: true, amountPaid: true, status: true,
    },
  });
  return NextResponse.json({
    data: {
      tenant: { nameAr: tenant?.nameAr, nameEn: tenant?.nameEn },
      contact: { nameAr: contact.nameAr, nameEn: contact.nameEn, taxNumber: contact.taxNumber },
      invoices,
    },
  });
}
