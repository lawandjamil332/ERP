import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { sendEmail } from '@/lib/email';
import { formatMoney } from '@/lib/iraq/money';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await ctx.params;
  const parsed = z.object({
    to: z.string().email().optional(),
    cc: z.string().email().optional(),
  }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const inv = await db.invoice.findFirst({
    where: { id, tenantId: session.tenantId, deletedAt: null },
    include: { contact: true, lines: true },
  });
  if (!inv) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });

  const to = parsed.data.to || inv.contact.email;
  if (!to) return NextResponse.json({ error: 'no_email_address' }, { status: 400 });

  const total = formatMoney(Number(inv.total), inv.currency as 'IQD', 'ar');
  const html = `
    <div dir="rtl" style="font-family: Tajawal, Cairo, system-ui, sans-serif">
      <h2>${tenant?.nameAr ?? ''}</h2>
      <p>السلام عليكم،</p>
      <p>تجدون مرفقاً فاتورة رقم <strong>${inv.number}</strong> بقيمة <strong>${total}</strong>.</p>
      ${inv.dueDate ? `<p>تاريخ الاستحقاق: ${new Intl.DateTimeFormat('ar-IQ').format(inv.dueDate)}</p>` : ''}
      <p>للاستفسار، يرجى الرد على هذا البريد.</p>
      <p>شكراً.</p>
      <hr/>
      <p style="font-family:system-ui,sans-serif" dir="ltr">
        Invoice ${inv.number} for ${total} from ${tenant?.nameEn ?? tenant?.nameAr ?? 'us'}.
      </p>
    </div>
  `;

  const result = await sendEmail({
    to,
    subject: `فاتورة ${inv.number} / Invoice ${inv.number}`,
    html,
  });
  return NextResponse.json({ data: result });
}
