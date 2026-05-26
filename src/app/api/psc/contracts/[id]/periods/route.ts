import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { computePscPeriod } from '@/lib/iraq/psc';

const Body = z.object({
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2]|Q[1-4])$/),
  grossRevenue: z.number().nonnegative(),
  recoverableCosts: z.number().nonnegative(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession();
  const contract = await db.pscContract.findFirst({
    where: { id, tenantId: session.tenantId },
  });
  if (!contract) return NextResponse.json({ error: 'contract_not_found' }, { status: 404 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });

  const result = computePscPeriod({
    grossRevenue: parsed.data.grossRevenue,
    recoverableCosts: parsed.data.recoverableCosts,
    costRecoveryCap: contract.costRecoveryCap.toString(),
    contractorProfitShare: contract.contractorProfitShare.toString(),
    royaltyRate: contract.royaltyRate.toString(),
  });

  const row = await db.pscPeriod.upsert({
    where: { contractId_period: { contractId: id, period: parsed.data.period } },
    create: {
      contractId: id, period: parsed.data.period,
      grossRevenue: new Prisma.Decimal(parsed.data.grossRevenue),
      recoverableCosts: new Prisma.Decimal(parsed.data.recoverableCosts),
      royaltyPaid: new Prisma.Decimal(result.royaltyPaid),
      costRecovered: new Prisma.Decimal(result.costRecovered),
      profitOil: new Prisma.Decimal(result.profitOil),
      contractorShare: new Prisma.Decimal(result.contractorShare),
      governmentShare: new Prisma.Decimal(result.governmentShare),
    },
    update: {
      grossRevenue: new Prisma.Decimal(parsed.data.grossRevenue),
      recoverableCosts: new Prisma.Decimal(parsed.data.recoverableCosts),
      royaltyPaid: new Prisma.Decimal(result.royaltyPaid),
      costRecovered: new Prisma.Decimal(result.costRecovered),
      profitOil: new Prisma.Decimal(result.profitOil),
      contractorShare: new Prisma.Decimal(result.contractorShare),
      governmentShare: new Prisma.Decimal(result.governmentShare),
    },
  });

  return NextResponse.json({ data: row, breakdown: result });
}
