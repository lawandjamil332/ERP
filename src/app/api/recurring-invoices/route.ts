import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Line = z.object({
  productId: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitOfMeasure: z.string().default('PCS'),
  unitPrice: z.number().nonnegative(),
  taxRate: z.number().min(0).max(1).default(0),
});

const Body = z.object({
  name: z.string().min(1),
  contactId: z.string(),
  cadence: z.enum(['DAILY','WEEKLY','MONTHLY','QUARTERLY','ANNUALLY']),
  cadenceDay: z.number().int().min(0).max(31).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  autoPost: z.boolean().default(false),
  currency: z.string().length(3).default('IQD'),
  fxRate: z.number().positive().default(1),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(Line).min(1),
});

export async function GET() {
  const session = await requireSession();
  const templates = await db.recurringInvoiceTemplate.findMany({
    where: { tenantId: session.tenantId, isActive: true },
    include: { lines: true },
    orderBy: { nextIssueAt: 'asc' },
  });
  return NextResponse.json({ data: templates });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;
  const created = await db.recurringInvoiceTemplate.create({
    data: {
      tenantId: session.tenantId, name: b.name, contactId: b.contactId,
      cadence: b.cadence, cadenceDay: b.cadenceDay,
      startDate: b.startDate, endDate: b.endDate, nextIssueAt: b.startDate,
      autoPost: b.autoPost, currency: b.currency,
      fxRate: new Prisma.Decimal(b.fxRate),
      paymentTerms: b.paymentTerms, notes: b.notes,
      lines: {
        create: b.lines.map((l) => ({
          productId: l.productId, description: l.description,
          quantity: new Prisma.Decimal(l.quantity), unitOfMeasure: l.unitOfMeasure,
          unitPrice: new Prisma.Decimal(l.unitPrice), taxRate: new Prisma.Decimal(l.taxRate),
        })),
      },
    },
    include: { lines: true },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}
