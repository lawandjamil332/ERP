import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import BigNumber from 'bignumber.js';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { monthlyDepreciation, endOfMonth } from '@/lib/iraq/depreciation';

const Body = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/),
});

export async function POST(req: Request) {
  let session;
  try { session = await requireSession(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const { period } = parsed.data;
  const eom = endOfMonth(period);

  const result = await db.$transaction(async (tx) => {
    const assets = await tx.fixedAsset.findMany({
      where: { tenantId: session.tenantId, status: 'ACTIVE' },
    });

    let total = new BigNumber(0);
    for (const a of assets) {
      const monthsInService = Math.max(0, Math.round(
        (eom.getTime() - a.acquisitionDate.getTime()) / (30.44 * 24 * 3_600_000)
      ));
      const amount = monthlyDepreciation({
        acquisitionCost: a.acquisitionCost.toString(),
        salvageValue: a.salvageValue.toString(),
        usefulLife: a.usefulLife,
        method: a.method as 'STRAIGHT_LINE' | 'DECLINING_BALANCE',
        decliningRate: a.decliningRate?.toString(),
        accumulatedDepreciation: a.accumulatedDepreciation.toString(),
        monthsInService,
      });
      if (amount.lte(0)) continue;

      total = total.plus(amount);
      await tx.fixedAsset.update({
        where: { id: a.id },
        data: {
          accumulatedDepreciation: new Prisma.Decimal(
            new BigNumber(a.accumulatedDepreciation.toString()).plus(amount).toString()
          ),
          netBookValue: new Prisma.Decimal(
            new BigNumber(a.acquisitionCost.toString()).minus(
              new BigNumber(a.accumulatedDepreciation.toString()).plus(amount)
            ).toString()
          ),
        },
      });
    }

    const accounts = await tx.account.findMany({
      where: { tenantId: session.tenantId, code: { in: ['54', '128'] } },
      select: { id: true, code: true },
    });
    const map = new Map(accounts.map((a) => [a.code, a.id]));
    const need = (c: string) => {
      const id = map.get(c); if (!id) throw new Error(`Account ${c} missing`); return id;
    };

    const journal = await tx.journal.create({
      data: {
        tenantId: session.tenantId,
        reference: `JV-DEP-${period}`,
        date: eom,
        source: 'MANUAL',
        memo: `Depreciation for ${period}`,
        isPosted: true,
        postedAt: new Date(),
        lines: total.gt(0) ? {
          create: [
            { accountId: need('54'),  debit: new Prisma.Decimal(total.toString()), credit: new Prisma.Decimal(0) },
            { accountId: need('128'), debit: new Prisma.Decimal(0), credit: new Prisma.Decimal(total.toString()) },
          ],
        } : { create: [] },
      },
    });

    const run = await tx.depreciationRun.upsert({
      where: { tenantId_period: { tenantId: session.tenantId, period } },
      create: {
        tenantId: session.tenantId,
        period,
        runDate: new Date(),
        total: new Prisma.Decimal(total.toString()),
        postedJournalId: journal.id,
      },
      update: {
        runDate: new Date(),
        total: new Prisma.Decimal(total.toString()),
        postedJournalId: journal.id,
      },
    });

    return { run, total: total.toString() };
  });

  return NextResponse.json({ data: result }, { status: 201 });
}
