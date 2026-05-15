import { describe, it, expect, vi } from 'vitest';
import { explodeBom } from './mrp';

function mockDb(opts: {
  boms: Array<{ productId: string; components: Array<{ componentProductId: string; quantity: string }> }>;
  products: Array<{ id: string; unitOfMeasure: string; stock: Array<{ quantity: string }> }>;
}) {
  return {
    bom: {
      findFirst: vi.fn(async ({ where }: any) => {
        const b = opts.boms.find((x) => x.productId === where.productId);
        if (!b) return null;
        return {
          components: b.components.map((c) => ({
            componentProductId: c.componentProductId,
            quantity: { toString: () => c.quantity },
          })),
        };
      }),
    },
    product: {
      findMany: vi.fn(async ({ where }: any) => {
        const ids: string[] = where.id.in;
        return opts.products
          .filter((p) => ids.includes(p.id))
          .map((p) => ({
            id: p.id,
            unitOfMeasure: p.unitOfMeasure,
            stock: p.stock.map((s) => ({ quantity: { toString: () => s.quantity } })),
          }));
      }),
    },
  } as any;
}

describe('explodeBom', () => {
  it('expands a single-level BOM', async () => {
    const db = mockDb({
      boms: [{ productId: 'CHAIR', components: [
        { componentProductId: 'LEG', quantity: '4' },
        { componentProductId: 'SEAT', quantity: '1' },
      ]}],
      products: [
        { id: 'LEG', unitOfMeasure: 'PCS', stock: [{ quantity: '10' }] },
        { id: 'SEAT', unitOfMeasure: 'PCS', stock: [{ quantity: '5' }] },
      ],
    });
    const out = await explodeBom(db, 't1', [{ productId: 'CHAIR', quantity: '3' }]);
    const leg = out.requirements.find((r) => r.productId === 'LEG')!;
    expect(leg.required.toString()).toBe('12');
    expect(leg.shortage.toString()).toBe('2');
    const seat = out.requirements.find((r) => r.productId === 'SEAT')!;
    expect(seat.required.toString()).toBe('3');
    expect(seat.shortage.toString()).toBe('0');
  });

  it('expands a two-level BOM', async () => {
    const db = mockDb({
      boms: [
        { productId: 'BIKE', components: [{ componentProductId: 'WHEEL', quantity: '2' }] },
        { productId: 'WHEEL', components: [
          { componentProductId: 'SPOKE', quantity: '32' },
          { componentProductId: 'TIRE',  quantity: '1' },
        ]},
      ],
      products: [
        { id: 'SPOKE', unitOfMeasure: 'PCS', stock: [{ quantity: '100' }] },
        { id: 'TIRE',  unitOfMeasure: 'PCS', stock: [{ quantity: '5' }] },
      ],
    });
    const out = await explodeBom(db, 't1', [{ productId: 'BIKE', quantity: '4' }]);
    const spoke = out.requirements.find((r) => r.productId === 'SPOKE')!;
    expect(spoke.required.toString()).toBe('256');  // 4 * 2 wheels * 32 spokes
    const tire = out.requirements.find((r) => r.productId === 'TIRE')!;
    expect(tire.required.toString()).toBe('8');     // 4 * 2 wheels * 1 tire
    expect(tire.shortage.toString()).toBe('3');     // 8 - 5
  });
});
