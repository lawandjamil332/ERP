import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { assertBalanced } from '@/lib/iraq/journals';

const Body = z.object({
  employeeId: z.string(),
  date: z.coerce.date().default(() => new Date()),
  amount: z.number().positive(),
  recovery: z.enum(['FULL', 'INSTALMENT']).default('FULL'),
  instalments: z.number().int().min(1).optional(),
  notes: z.string().optional(),
  cashAccountCode: z.string().default('1111'),
});

export async function GET(req: Request) {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const advances = await db.salaryAdvance.findMany({
    where: { tenantId: session.tenantId, ...(status ? { status } : {}) },
    orderBy: { date: 'desc' }, take: 200,
  });
  return NextResponse.json({ data: advances });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;

  const result = await db.$transaction(async (tx) => {
    const adv = await tx.salaryAdvance.create({
      data: {
        tenantId: session.tenantId, employeeId: b.employeeId, date: b.date,
        amount: new Prisma.Decimal(b.amount),
        recovery: b.recovery,
        instalments: b.recovery === 'INSTALMENT' ? (b.instalments ?? 1) : null,
        notes: b.notes,
      },
    });
    const accounts = await tx.account.findMany({
      where: { tenantId: session.tenantId, code: { in: ['1122', b.cashAccountCode] } },
      select: { id: true, code: true },
    });
    const map = new Map(accounts.map((a) => [a.code, a.id]));
    const need = (c: string) => { const id = map.get(c); if (!id) throw new Error(`Account ${c} missing`); return id; };
    const lines = [
      { accountCode: '1122', debit: b.amount, credit: 0 },
      { accountCode: b.cashAccountCode, debit: 0, credit: b.amount },
    ];
    assertBalanced(lines.map((l) => ({ accountCode: l.accountCode, debit: l.debit, credit: l.credit })));
    const journal = await tx.journal.create({
      data: {
        tenantId: session.tenantId,
        reference: `JV-ADV-${adv.id.slice(-8)}`,
        date: b.date, source: 'PAYMENT',
        memo: `Salary advance to employee ${b.employeeId}`,
        isPosted: true, postedAt: new Date(),
        lines: {
          create: lines.map((l) => ({
            accountId: need(l.accountCode),
            debit: new Prisma.Decimal(l.debit),
            credit: new Prisma.Decimal(l.credit),
          })),
        },
      },
    });
    await tx.salaryAdvance.update({ where: { id: adv.id }, data: { postedJournalId: journal.id } });
    return adv;
  });
  return NextResponse.json({ data: result }, { status: 201 });
}
