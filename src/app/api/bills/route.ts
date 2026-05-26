import { NextResponse } from 'next/server';
import { z } from 'zod';
import BigNumber from 'bignumber.js';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { WHT_NONRESIDENT_SERVICES } from '@/lib/iraq/tax';
import { assertBalanced, type JournalLineInput } from '@/lib/iraq/journals';

const Line = z.object({
  productId: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitOfMeasure: z.string().default('PCS'),
  unitPrice: z.number().nonnegative(),
  taxRate: z.number().min(0).max(1).default(0),
});

const Body = z.object({
  number: z.string().min(1),
  supplierId: z.string(),
  date: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  currency: z.string().length(3).default('IQD'),
  fxRate: z.number().positive().default(1),
  withholdingRate: z.number().min(0).max(1).optional(),
  notes: z.string().optional(),
  postImmediately: z.boolean().default(false),
  lines: z.array(Line).min(1),
});

export async function GET() {
  const session = await requireSession();
  const bills = await db.bill.findMany({
    where: { tenantId: session.tenantId },
    include: { supplier: true, lines: true },
    orderBy: { date: 'desc' }, take: 100,
  });
  return NextResponse.json({ data: bills });
}

export async function POST(req: Request) {
  let session;
  try { session = await requireSession(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;

  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });
  const supplier = await db.contact.findFirst({ where: { id: b.supplierId, tenantId: session.tenantId } });
  if (!supplier) return NextResponse.json({ error: 'supplier_not_found' }, { status: 404 });

  const lines = b.lines.map((l) => {
    const base   = new BigNumber(l.quantity).times(l.unitPrice);
    const tax    = base.times(l.taxRate);
    const total  = base.plus(tax);
    return { ...l, base, tax, total };
  });
  const subtotal = lines.reduce((s, l) => s.plus(l.base),  new BigNumber(0));
  const taxTotal = lines.reduce((s, l) => s.plus(l.tax),   new BigNumber(0));
  const total    = subtotal.plus(taxTotal);

  const whtRate =
    b.withholdingRate ??
    (tenant?.region === 'FEDERAL' && supplier.governorate?.toLowerCase().includes('outside')
      ? WHT_NONRESIDENT_SERVICES.federal
      : 0);
  const withholding = subtotal.times(whtRate);

  const created = await db.$transaction(async (tx) => {
    const bill = await tx.bill.create({
      data: {
        tenantId: session.tenantId,
        number: b.number,
        supplierId: b.supplierId,
        date: b.date,
        dueDate: b.dueDate,
        currency: b.currency,
        fxRate: new Prisma.Decimal(b.fxRate),
        subtotal: new Prisma.Decimal(subtotal.toString()),
        taxTotal: new Prisma.Decimal(taxTotal.toString()),
        withholding: new Prisma.Decimal(withholding.toString()),
        total: new Prisma.Decimal(total.toString()),
        status: b.postImmediately ? 'POSTED' : 'DRAFT',
        lines: {
          create: lines.map((l) => ({
            productId: l.productId,
            description: l.description,
            quantity: new Prisma.Decimal(l.quantity),
            unitOfMeasure: l.unitOfMeasure,
            unitPrice: new Prisma.Decimal(l.unitPrice),
            taxRate: new Prisma.Decimal(l.taxRate),
            taxAmount: new Prisma.Decimal(l.tax.toString()),
            lineTotal: new Prisma.Decimal(l.total.toString()),
          })),
        },
      },
    });

    if (b.postImmediately) {
      const codes = ['524', '2134', '211', '2135'];
      const accounts = await tx.account.findMany({
        where: { tenantId: session.tenantId, code: { in: codes } },
        select: { id: true, code: true },
      });
      const map = new Map(accounts.map((a) => [a.code, a.id]));
      const need = (code: string) => {
        const id = map.get(code);
        if (!id) throw new Error(`Account ${code} missing`);
        return id;
      };

      const jLines: JournalLineInput[] = [
        { accountCode: '524',  debit: subtotal },
        ...(taxTotal.gt(0) ? [{ accountCode: '2134', debit: taxTotal }] : []),
        { accountCode: '211',  credit: total.minus(withholding) },
        ...(withholding.gt(0) ? [{ accountCode: '2135', credit: withholding }] : []),
      ];
      assertBalanced(jLines);

      const journal = await tx.journal.create({
        data: {
          tenantId: session.tenantId,
          reference: `JV-BILL-${bill.number}`,
          date: b.date,
          source: 'PURCHASE_BILL',
          memo: `Supplier bill ${bill.number}`,
          isPosted: true,
          postedAt: new Date(),
          lines: {
            create: jLines.map((l) => ({
              accountId: need(l.accountCode),
              debit: new Prisma.Decimal(String(l.debit ?? 0)),
              credit: new Prisma.Decimal(String(l.credit ?? 0)),
            })),
          },
        },
      });

      await tx.bill.update({ where: { id: bill.id }, data: { postedJournalId: journal.id } });
    }

    return bill;
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
