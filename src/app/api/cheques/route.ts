import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const Body = z.object({
  number: z.string().min(1),
  direction: z.enum(['IN', 'OUT']),
  bank: z.string().min(1),
  branch: z.string().optional(),
  drawer: z.string().min(1),
  beneficiary: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().length(3).default('IQD'),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  contactId: z.string().optional(),
  invoiceId: z.string().optional(),
  billId: z.string().optional(),
  notes: z.string().optional(),
});

const StatusUpdate = z.object({
  id: z.string(),
  status: z.enum(['REGISTERED','DEPOSITED','CLEARED','BOUNCED','CANCELLED','REPLACED']),
});

export async function GET(req: Request) {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const cheques = await db.cheque.findMany({
    where: {
      tenantId: session.tenantId,
      ...(status ? { status: status as any } : {}),
    },
    orderBy: { dueDate: 'asc' },
    take: 200,
  });
  return NextResponse.json({ data: cheques });
}

export async function POST(req: Request) {
  let session;
  try { session = await requireSession(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const c = parsed.data;
  const created = await db.cheque.create({
    data: {
      tenantId: session.tenantId,
      number: c.number, direction: c.direction,
      bank: c.bank, branch: c.branch,
      drawer: c.drawer, beneficiary: c.beneficiary,
      amount: new Prisma.Decimal(c.amount),
      currency: c.currency,
      issueDate: c.issueDate, dueDate: c.dueDate,
      contactId: c.contactId, invoiceId: c.invoiceId, billId: c.billId,
      notes: c.notes,
    },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}

export async function PATCH(req: Request) {
  let session;
  try { session = await requireSession(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const parsed = StatusUpdate.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const updated = await db.cheque.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      clearedAt: parsed.data.status === 'CLEARED' ? new Date() : undefined,
    },
  });
  return NextResponse.json({ data: updated });
}
