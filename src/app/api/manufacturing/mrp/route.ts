import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { explodeBom } from '@/lib/iraq/mrp';

const Body = z.object({
  demands: z.array(z.object({
    productId: z.string(),
    quantity: z.string(),
    bomVersion: z.string().optional(),
  })).min(1),
});

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const result = await explodeBom(db, session.tenantId, parsed.data.demands);
  return NextResponse.json({
    requirements: result.requirements.map((r) => ({
      productId: r.productId,
      required: r.required.toFixed(4),
      onHand: r.onHand.toFixed(4),
      shortage: r.shortage.toFixed(4),
      unitOfMeasure: r.unitOfMeasure,
    })),
    unresolved: result.unresolved,
  });
}
