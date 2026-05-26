/**
 * Material Requirements Planning (MRP) — bill of materials explosion.
 *
 * Given a list of demanded products (work orders, sales-order forecast),
 * recursively expand BOMs into raw-component requirements, subtract on-hand
 * stock, and produce a shortage list.
 */

import type { PrismaClient } from '@prisma/client';
import BigNumber from 'bignumber.js';

export interface MrpDemand {
  productId: string;
  quantity: string;
  /** Optional preferred BOM version. */
  bomVersion?: string;
}

export interface MrpRequirement {
  productId: string;
  required: BigNumber;
  onHand: BigNumber;
  shortage: BigNumber;
  unitOfMeasure: string;
}

export interface MrpResult {
  requirements: MrpRequirement[];
  unresolved: Array<{ productId: string; reason: string }>;
}

export async function explodeBom(
  db: PrismaClient,
  tenantId: string,
  demands: MrpDemand[]
): Promise<MrpResult> {
  const required = new Map<string, BigNumber>();
  const unresolved: MrpResult['unresolved'] = [];

  async function expand(productId: string, qty: BigNumber, depth: number) {
    if (depth > 32) {
      unresolved.push({ productId, reason: 'cyclic_bom_or_too_deep' });
      return;
    }
    const bom = await db.bom.findFirst({
      where: { tenantId, productId, isActive: true },
      include: { components: true },
      orderBy: { version: 'desc' },
    });
    if (!bom || bom.components.length === 0) {
      required.set(productId, (required.get(productId) ?? new BigNumber(0)).plus(qty));
      return;
    }
    for (const c of bom.components) {
      const childQty = qty.times(c.quantity.toString());
      await expand(c.componentProductId, childQty, depth + 1);
    }
  }

  for (const d of demands) {
    await expand(d.productId, new BigNumber(d.quantity), 0);
  }

  const productIds = Array.from(required.keys());
  const products = await db.product.findMany({
    where: { tenantId, id: { in: productIds } },
    select: { id: true, unitOfMeasure: true, stock: { select: { quantity: true } } },
  });
  const onHand = new Map<string, BigNumber>();
  const uom = new Map<string, string>();
  for (const p of products) {
    uom.set(p.id, p.unitOfMeasure);
    const sum = p.stock.reduce(
      (s, st) => s.plus(new BigNumber(st.quantity.toString())),
      new BigNumber(0)
    );
    onHand.set(p.id, sum);
  }

  const requirements: MrpRequirement[] = productIds.map((pid) => {
    const req = required.get(pid)!;
    const have = onHand.get(pid) ?? new BigNumber(0);
    const shortage = BigNumber.max(req.minus(have), new BigNumber(0));
    return {
      productId: pid,
      required: req,
      onHand: have,
      shortage,
      unitOfMeasure: uom.get(pid) ?? 'PCS',
    };
  }).sort((a, b) => b.shortage.minus(a.shortage).toNumber());

  return { requirements, unresolved };
}
