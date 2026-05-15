import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { buildWhatsAppLink, defaultInvoiceMessage } from '@/lib/iraq/whatsapp';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession();
  const inv = await db.invoice.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { contact: true },
  });
  if (!inv) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!inv.contact.phone) return NextResponse.json({ error: 'contact_has_no_phone' }, { status: 400 });

  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });
  const message = defaultInvoiceMessage({
    tenantName: tenant?.nameAr ?? tenant?.nameEn ?? 'Company',
    number: inv.number,
    total: inv.total.toString(),
    currency: inv.currency,
    dueDate: inv.dueDate?.toISOString().slice(0, 10),
    locale: (tenant?.defaultLocale ?? 'ar') as 'ar' | 'ku' | 'en',
  });
  const link = buildWhatsAppLink(inv.contact.phone, message);
  if (!link) return NextResponse.json({ error: 'invalid_phone' }, { status: 400 });
  return NextResponse.json({ data: { link, message } });
}
