import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const InventorySettings = z.object({
  allowNegativeInventory: z.boolean().optional(),
  stockOrdersSales: z.boolean().optional(),
  stockOrdersPurchases: z.boolean().optional(),
  trackExpiry: z.boolean().optional(),
  trackLotNumber: z.boolean().optional(),
  trackSerialNumber: z.boolean().optional(),
  hideDiscountColumn: z.boolean().optional(),
  hideTaxColumn: z.boolean().optional(),
});

const ManufacturingSettings = z.object({
  autoGenerateCode: z.boolean().optional(),
  autoCreateJournalEntry: z.boolean().optional(),
  allowNegativeStock: z.boolean().optional(),
  defaultStatus: z.enum(['DRAFT', 'RELEASED', 'IN_PROGRESS']).optional(),
  costingMethod: z.enum(['STANDARD', 'FIFO', 'LIFO', 'AVERAGE']).optional(),
});

const Body = z.object({
  inventory: InventorySettings.optional(),
  manufacturing: ManufacturingSettings.optional(),
  theme: z.enum(['LIGHT', 'DARK', 'AUTO']).optional(),
});

export async function GET() {
  const session = await requireSession();
  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId }, select: { uiSettings: true } });
  return NextResponse.json({ data: tenant?.uiSettings ?? {} });
}

export async function PATCH(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId }, select: { uiSettings: true } });
  const current = (tenant?.uiSettings as Record<string, unknown> | null) ?? {};
  const merged = {
    ...current,
    ...(parsed.data.inventory ? { inventory: { ...(current.inventory as object ?? {}), ...parsed.data.inventory } } : {}),
    ...(parsed.data.manufacturing ? { manufacturing: { ...(current.manufacturing as object ?? {}), ...parsed.data.manufacturing } } : {}),
    ...(parsed.data.theme ? { theme: parsed.data.theme } : {}),
  };
  const updated = await db.tenant.update({ where: { id: session.tenantId }, data: { uiSettings: merged }, select: { uiSettings: true } });
  return NextResponse.json({ data: updated.uiSettings });
}
