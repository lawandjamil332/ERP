import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { buildEscPosReceipt, previewReceipt, type ReceiptData } from '@/lib/pos/escpos';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession();
  const url = new URL(req.url);
  const format = url.searchParams.get('format') ?? 'preview';

  const order = await db.posOrder.findFirst({
    where: { id, session: { terminal: { tenantId: session.tenantId } } },
    include: {
      lines: true,
      session: { include: { terminal: { include: { branch: true } } } },
    },
  });
  if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });

  const data: ReceiptData = {
    tenantName: tenant?.nameEn ?? '',
    tenantTaxNumber: tenant?.taxNumber ?? undefined,
    branch: order.session.terminal.branch?.nameEn ?? undefined,
    orderNumber: order.number,
    date: order.date,
    lines: order.lines.map((l) => ({
      name: l.productName,
      qty: l.quantity.toString(),
      price: l.unitPrice.toString(),
      total: l.total.toString(),
    })),
    subtotal: order.subtotal.toString(),
    tax: order.taxTotal.toString(),
    discount: order.discount.toString(),
    total: order.total.toString(),
    paid: order.paid.toString(),
    method: order.method,
    currency: 'IQD',
  };

  if (format === 'escpos') {
    const buf = buildEscPosReceipt(data);
    return new Response(new Uint8Array(buf), {
      headers: {
        'content-type': 'application/octet-stream',
        'content-disposition': `attachment; filename="receipt-${order.number}.bin"`,
      },
    });
  }
  return new Response(previewReceipt(data), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
