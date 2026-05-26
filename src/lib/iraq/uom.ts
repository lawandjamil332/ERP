/**
 * Multi-UoM conversion. BFS over conversion graph; handles forward and inverse.
 */

import type { PrismaClient } from '@prisma/client';
import BigNumber from 'bignumber.js';

export async function convertUom(
  db: PrismaClient, tenantId: string, productId: string,
  qty: BigNumber.Value, fromUom: string, toUom: string
): Promise<BigNumber> {
  if (fromUom === toUom) return new BigNumber(qty);
  const conversions = await db.uomConversion.findMany({ where: { tenantId, productId } });
  const graph = new Map<string, { to: string; factor: BigNumber }[]>();
  for (const c of conversions) {
    const f = new BigNumber(c.factor.toString());
    if (!graph.has(c.fromUom)) graph.set(c.fromUom, []);
    if (!graph.has(c.toUom)) graph.set(c.toUom, []);
    graph.get(c.fromUom)!.push({ to: c.toUom, factor: f });
    graph.get(c.toUom)!.push({ to: c.fromUom, factor: new BigNumber(1).div(f) });
  }
  const queue: { node: string; multiplier: BigNumber; visited: Set<string> }[] =
    [{ node: fromUom, multiplier: new BigNumber(1), visited: new Set([fromUom]) }];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur.node === toUom) return new BigNumber(qty).times(cur.multiplier);
    for (const edge of graph.get(cur.node) ?? []) {
      if (cur.visited.has(edge.to)) continue;
      queue.push({
        node: edge.to,
        multiplier: cur.multiplier.times(edge.factor),
        visited: new Set([...cur.visited, edge.to]),
      });
    }
  }
  throw new Error(`no_conversion_path: ${fromUom} -> ${toUom}`);
}
