import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Row = z.object({
  date: z.coerce.date(),
  reference: z.string().optional(),
  description: z.string().optional(),
  debit: z.number().nonnegative().default(0),
  credit: z.number().nonnegative().default(0),
  balance: z.number().optional(),
});

const Body = z.object({
  bankAccountId: z.string(),
  rows: z.array(Row),
});

export async function POST(req: Request) {
  let session;
  try { session = await requireSession(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });

  const acct = await db.bankAccount.findFirst({
    where: { id: parsed.data.bankAccountId, tenantId: session.tenantId },
  });
  if (!acct) return NextResponse.json({ error: 'bank_account_not_found' }, { status: 404 });

  const created = await db.bankStatement.createMany({
    data: parsed.data.rows.map((r) => ({
      tenantId: session.tenantId,
      bankAccountId: acct.id,
      date: r.date,
      reference: r.reference,
      description: r.description,
      debit: new Prisma.Decimal(r.debit),
      credit: new Prisma.Decimal(r.credit),
      balance: r.balance !== undefined ? new Prisma.Decimal(r.balance) : undefined,
    })),
  });
  return NextResponse.json({ data: { imported: created.count } }, { status: 201 });
}
