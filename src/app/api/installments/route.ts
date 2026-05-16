import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { buildInstallmentPlan } from '@/lib/iraq/installment';

const Body = z.object({
  contactId: z.string(),
  invoiceId: z.string().optional(),
  productSummary: z.string().min(1),
  totalAmount: z.number().positive(),
  downPayment: z.number().nonnegative().default(0),
  numberOfInstallments: z.number().int().min(1).max(60),
  interestRatePct: z.number().min(0).max(1).default(0),
  startDate: z.coerce.date(),
  currency: z.string().length(3).default('IQD'),
  guarantorName: z.string().optional(),
  guarantorPhone: z.string().optional(),
  guarantorId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await requireSession();
  const rows = await db.installmentPlan.findMany({
    where: { tenantId: session.tenantId },
    include: { schedule: { orderBy: { sequence: 'asc' } } },
    orderBy: { startDate: 'desc' },
    take: 200,
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }
  const b = parsed.data;

  const plan = buildInstallmentPlan({
    totalAmount: b.totalAmount,
    downPayment: b.downPayment,
    numberOfInstallments: b.numberOfInstallments,
    interestRatePct: b.interestRatePct,
    startDate: b.startDate,
  });

  const year = b.startDate.getUTCFullYear();
  const last = await db.installmentPlan.findFirst({
    where: { tenantId: session.tenantId, reference: { startsWith: `IP-${year}-` } },
    orderBy: { reference: 'desc' }, select: { reference: true },
  });
  const seq = last ? parseInt(last.reference.split('-')[2], 10) + 1 : 1;
  const reference = `IP-${year}-${seq.toString().padStart(5, '0')}`;

  const created = await db.installmentPlan.create({
    data: {
      tenantId: session.tenantId, reference,
      contactId: b.contactId, invoiceId: b.invoiceId,
      productSummary: b.productSummary,
      totalAmount: new Prisma.Decimal(b.totalAmount),
      downPayment: new Prisma.Decimal(b.downPayment),
      financedAmount: new Prisma.Decimal(plan.financedAmount),
      numberOfInstallments: b.numberOfInstallments,
      interestRatePct: new Prisma.Decimal(b.interestRatePct),
      installmentAmount: new Prisma.Decimal(plan.installmentAmount),
      currency: b.currency,
      startDate: b.startDate,
      guarantorName: b.guarantorName, guarantorPhone: b.guarantorPhone, guarantorId: b.guarantorId,
      notes: b.notes,
      schedule: {
        create: plan.schedule.map((s) => ({
          sequence: s.sequence,
          dueDate: s.dueDate,
          amount: new Prisma.Decimal(s.amount),
        })),
      },
    },
    include: { schedule: true },
  });

  return NextResponse.json({ data: created, plan }, { status: 201 });
}
