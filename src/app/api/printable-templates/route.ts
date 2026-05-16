import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Body = z.object({
  kind: z.enum(['SALES_INVOICE', 'PURCHASE_INVOICE', 'QUOTATION', 'PAYMENT_RECEIPT', 'EXPENSE_VOUCHER', 'DELIVERY_NOTE']),
  name: z.string().min(1),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  paperSize: z.string().optional(),
  layout: z.object({
    sections: z.record(z.boolean()).optional(),
    styles: z.record(z.string()).optional(),
    text: z.record(z.string()).optional(),
  }),
});

export async function GET(req: Request) {
  const session = await requireSession();
  const kind = new URL(req.url).searchParams.get('kind');
  const rows = await db.printableTemplate.findMany({
    where: { tenantId: session.tenantId, ...(kind ? { kind: kind as never } : {}) },
    orderBy: [{ kind: 'asc' }, { isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;

  if (b.isDefault) {
    await db.printableTemplate.updateMany({
      where: { tenantId: session.tenantId, kind: b.kind, isDefault: true },
      data: { isDefault: false },
    });
  }
  const created = await db.printableTemplate.create({
    data: {
      tenantId: session.tenantId,
      kind: b.kind, name: b.name,
      isDefault: b.isDefault ?? false,
      isActive: b.isActive ?? true,
      paperSize: b.paperSize ?? 'A4',
      layout: b.layout,
    },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}
