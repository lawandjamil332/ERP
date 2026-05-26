import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { computePoc } from '@/lib/iraq/poc';

const Body = z.object({
  costsToDate: z.string(),
  estimatedTotalCost: z.string(),
  revenueRecognizedPrior: z.string().default('0'),
  retentionRate: z.string().optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }
  try {
    const r = await computePoc(db, session.tenantId, { projectId: id, ...parsed.data });
    return NextResponse.json({
      projectId: r.projectId,
      contractValue: r.contractValue.toFixed(4),
      costsToDate: r.costsToDate.toFixed(4),
      estimatedTotalCost: r.estimatedTotalCost.toFixed(4),
      percentComplete: r.percentComplete.times(100).toFixed(2) + '%',
      revenueEarnedToDate: r.revenueEarnedToDate.toFixed(4),
      revenueRecognizedPrior: r.revenueRecognizedPrior.toFixed(4),
      revenueToRecognizeNow: r.revenueToRecognizeNow.toFixed(4),
      retentionToDate: r.retentionToDate.toFixed(4),
      retentionRate: r.retentionRate.times(100).toFixed(2) + '%',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
