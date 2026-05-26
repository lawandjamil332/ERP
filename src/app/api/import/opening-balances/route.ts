import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import BigNumber from 'bignumber.js';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { parseCsv, emptySummary, type ImportSummary } from '@/lib/import/csv';
import { assertBalanced } from '@/lib/iraq/journals';

const Row = z.object({
  accountCode: z.string().min(1),
  debit: z.string().optional(),
  credit: z.string().optional(),
  memo: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await requireSession();
  const url = new URL(req.url);
  const date = url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
  const body = await req.text();
  if (!body) return NextResponse.json({ error: 'empty_body' }, { status: 400 });

  const { rows, errors } = parseCsv<Record<string, string>>(body);
  const summary: ImportSummary = emptySummary();
  for (const e of errors) summary.failures.push({ row: e.row, message: `csv_parse: ${e.message}` });

  const accounts = await db.account.findMany({
    where: { tenantId: session.tenantId },
    select: { id: true, code: true },
  });
  const byCode = new Map(accounts.map((a) => [a.code, a.id]));

  type Line = { accountId: string; debit: string; credit: string; memo?: string };
  const lines: Line[] = [];

  for (let i = 0; i < rows.length; i++) {
    summary.attempted++;
    const parsed = Row.safeParse(rows[i]);
    if (!parsed.success) {
      summary.failures.push({ row: i + 2, message: parsed.error.issues.map((x) => x.message).join('; ') });
      continue;
    }
    const accountId = byCode.get(parsed.data.accountCode);
    if (!accountId) {
      summary.failures.push({ row: i + 2, key: parsed.data.accountCode, message: 'account_code_not_found' });
      continue;
    }
    const debit = parsed.data.debit || '0';
    const credit = parsed.data.credit || '0';
    if (new BigNumber(debit).isNaN() || new BigNumber(credit).isNaN()) {
      summary.failures.push({ row: i + 2, message: 'invalid_decimal' });
      continue;
    }
    lines.push({ accountId, debit, credit, memo: parsed.data.memo });
    summary.inserted++;
  }

  if (lines.length === 0) {
    return NextResponse.json({ error: 'no_valid_lines', summary }, { status: 400 });
  }

  try {
    assertBalanced(lines.map((l) => ({
      accountCode: '_',
      debit: l.debit !== '0' ? new BigNumber(l.debit) : undefined,
      credit: l.credit !== '0' ? new BigNumber(l.credit) : undefined,
    })));
  } catch (e: any) {
    return NextResponse.json({ error: 'unbalanced', message: e.message, summary }, { status: 400 });
  }

  const journal = await db.journal.create({
    data: {
      tenantId: session.tenantId,
      reference: `OPEN-${date}-${Date.now().toString(36)}`,
      date: new Date(date),
      memo: 'Opening balances import',
      source: 'OPENING_BALANCE',
      isPosted: true,
      postedAt: new Date(),
      lines: {
        create: lines.map((l) => ({
          accountId: l.accountId,
          debit: new Prisma.Decimal(l.debit),
          credit: new Prisma.Decimal(l.credit),
          memo: l.memo,
        })),
      },
    },
  });

  return NextResponse.json({ ok: true, journalId: journal.id, summary });
}
