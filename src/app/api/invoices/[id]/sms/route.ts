import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { sendSms, buildPaymentReminderSms } from '@/lib/sms';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await ctx.params;
  const parsed = z.object({
    to: z.string().optional(),
    locale: z.enum(['ar', 'ku', 'en']).default('ar'),
  }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const inv = await db.invoice.findFirst({
    where: { id, tenantId: session.tenantId, deletedAt: null },
    include: { contact: true },
  });
  if (!inv) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });
  const to = parsed.data.to || inv.contact.phone || '';
  if (!to) return NextResponse.json({ error: 'no_phone' }, { status: 400 });

  const message = buildPaymentReminderSms({
    tenantName: tenant?.nameAr ?? tenant?.nameEn ?? 'Iraq ERP',
    invoiceNumber: inv.number,
    total: inv.total.toString(),
    currency: inv.currency,
    dueDate: inv.dueDate?.toISOString().slice(0, 10),
    locale: parsed.data.locale,
  });
  const result = await sendSms({ to, message, tenantId: session.tenantId });
  return NextResponse.json(result);
}
