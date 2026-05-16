/**
 * Bill of Quantities (BoQ) importer for Iraqi construction tenders.
 *
 * Iraqi tenders use a standard BoQ format with columns:
 *   itemCode, description, unit, quantity, unitPrice
 * This endpoint parses the CSV and creates a Project + invoice-line template
 * stored as a RecurringInvoiceTemplate (so it can be billed at progress
 * milestones via existing POC logic).
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { parseCsv, emptySummary } from '@/lib/import/csv';

const Row = z.object({
  itemCode: z.string().optional(),
  description: z.string().min(1),
  unit: z.string().default('PCS'),
  quantity: z.string(),
  unitPrice: z.string(),
});

export async function POST(req: Request) {
  const session = await requireSession();
  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId_query_param_required' }, { status: 400 });

  const project = await db.project.findFirst({
    where: { id: projectId, tenantId: session.tenantId },
  });
  if (!project) return NextResponse.json({ error: 'project_not_found' }, { status: 404 });

  const body = await req.text();
  if (!body) return NextResponse.json({ error: 'empty_body' }, { status: 400 });

  const { rows, errors } = parseCsv<Record<string, string>>(body);
  const summary = emptySummary();
  for (const e of errors) summary.failures.push({ row: e.row, message: `csv: ${e.message}` });

  const lines: { description: string; quantity: number; unitOfMeasure: string; unitPrice: number; taxRate: number }[] = [];
  let totalContract = 0;
  for (let i = 0; i < rows.length; i++) {
    summary.attempted++;
    const parsed = Row.safeParse(rows[i]);
    if (!parsed.success) {
      summary.failures.push({ row: i + 2, message: parsed.error.issues.map((x) => x.message).join('; ') });
      continue;
    }
    const r = parsed.data;
    const qty = parseFloat(r.quantity);
    const price = parseFloat(r.unitPrice);
    if (isNaN(qty) || isNaN(price)) {
      summary.failures.push({ row: i + 2, message: 'quantity_or_unitPrice_not_numeric' });
      continue;
    }
    lines.push({
      description: r.itemCode ? `[${r.itemCode}] ${r.description}` : r.description,
      quantity: qty,
      unitOfMeasure: r.unit,
      unitPrice: price,
      taxRate: 0,
    });
    totalContract += qty * price;
    summary.inserted++;
  }

  if (lines.length === 0) {
    return NextResponse.json({ error: 'no_valid_lines', summary }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: projectId },
      data: { contractValue: new Prisma.Decimal(totalContract) },
    });
    // Persist as Recurring template (manual cadence; for progress invoicing the user runs it on demand).
    const last = await tx.recurringInvoiceTemplate.findFirst({
      where: { tenantId: session.tenantId, name: { startsWith: `BoQ ${project.code}` } },
    });
    if (last) {
      await tx.recurringInvoiceLine.deleteMany({ where: { templateId: last.id } });
      await tx.recurringInvoiceTemplate.update({
        where: { id: last.id },
        data: {
          lines: {
            create: lines.map((l) => ({
              description: l.description,
              quantity: new Prisma.Decimal(l.quantity),
              unitOfMeasure: l.unitOfMeasure,
              unitPrice: new Prisma.Decimal(l.unitPrice),
              taxRate: new Prisma.Decimal(l.taxRate),
            })),
          },
        },
      });
    }
  });

  return NextResponse.json({
    ...summary,
    contractValue: totalContract.toFixed(2),
    note: 'BoQ imported into project. Use Projects → POC to recognize revenue against the contract.',
  });
}
