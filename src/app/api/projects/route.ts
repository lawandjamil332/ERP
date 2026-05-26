import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Milestone = z.object({
  name: z.string().min(1),
  percentage: z.number().min(0).max(100),
  retentionPct: z.number().min(0).max(0.5).default(0.10),
});

const Body = z.object({
  code: z.string().min(1),
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  clientId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  contractValue: z.number().positive(),
  currency: z.string().length(3).default('IQD'),
  milestones: z.array(Milestone).default([]),
});

export async function GET() {
  const session = await requireSession();
  const projects = await db.project.findMany({
    where: { tenantId: session.tenantId },
    include: { milestones: true },
    orderBy: { code: 'asc' },
  });
  return NextResponse.json({ data: projects });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;
  const created = await db.project.create({
    data: {
      tenantId: session.tenantId,
      code: b.code, nameAr: b.nameAr, nameEn: b.nameEn,
      clientId: b.clientId, startDate: b.startDate, endDate: b.endDate,
      contractValue: new Prisma.Decimal(b.contractValue),
      currency: b.currency,
      milestones: {
        create: b.milestones.map((m) => {
          const amount = b.contractValue * (m.percentage / 100);
          return {
            name: m.name,
            percentage: new Prisma.Decimal(m.percentage / 100),
            amount: new Prisma.Decimal(amount),
            retention: new Prisma.Decimal(amount * m.retentionPct),
          };
        }),
      },
    },
    include: { milestones: true },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}
