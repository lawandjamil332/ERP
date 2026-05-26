import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { parseCsv, emptySummary, type ImportSummary } from '@/lib/import/csv';

const Row = z.object({
  sku: z.string().min(1),
  barcode: z.string().optional(),
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  hsCode: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  trademark: z.string().optional(),
  unitOfMeasure: z.string().default('PCS'),
  category: z.string().optional(),
  salePrice: z.string().optional(),
  cost: z.string().optional(),
  isService: z.enum(['true', 'false', '1', '0', 'yes', 'no', '']).optional(),
});

function bool(v?: string): boolean {
  if (!v) return false;
  return ['true', '1', 'yes'].includes(v.toLowerCase());
}

export async function POST(req: Request) {
  const session = await requireSession();
  const body = await req.text();
  if (!body) return NextResponse.json({ error: 'empty_body' }, { status: 400 });

  const { rows, errors } = parseCsv<Record<string, string>>(body);
  const summary: ImportSummary = emptySummary();
  for (const e of errors) summary.failures.push({ row: e.row, message: `csv_parse: ${e.message}` });

  for (let i = 0; i < rows.length; i++) {
    summary.attempted++;
    const parsed = Row.safeParse(rows[i]);
    if (!parsed.success) {
      summary.failures.push({
        row: i + 2,
        message: parsed.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; '),
      });
      continue;
    }
    const r = parsed.data;
    try {
      const existing = await db.product.findFirst({ where: { tenantId: session.tenantId, sku: r.sku } });
      const data = {
        sku: r.sku, barcode: r.barcode, nameAr: r.nameAr, nameEn: r.nameEn,
        hsCode: r.hsCode, countryOfOrigin: r.countryOfOrigin, trademark: r.trademark,
        unitOfMeasure: r.unitOfMeasure, category: r.category,
        salePrice: r.salePrice ? new Prisma.Decimal(r.salePrice) : new Prisma.Decimal(0),
        cost:      r.cost      ? new Prisma.Decimal(r.cost)      : new Prisma.Decimal(0),
        isService: bool(r.isService),
      };
      if (existing) {
        await db.product.update({ where: { id: existing.id }, data });
        summary.updated++;
      } else {
        await db.product.create({ data: { tenantId: session.tenantId, ...data } });
        summary.inserted++;
      }
    } catch (e: any) {
      summary.failures.push({ row: i + 2, key: r.sku, message: e?.message ?? 'db_error' });
    }
  }
  return NextResponse.json(summary);
}
