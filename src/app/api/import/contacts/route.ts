import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { parseCsv, emptySummary, type ImportSummary } from '@/lib/import/csv';

const ContactRow = z.object({
  kind: z.enum(['CUSTOMER', 'SUPPLIER', 'BOTH']).default('CUSTOMER'),
  nameAr: z.string().min(2),
  nameEn: z.string().optional(),
  taxNumber: z.string().optional(),
  commercialReg: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  addressAr: z.string().optional(),
  governorate: z.string().optional(),
  currency: z.string().default('IQD'),
  creditLimit: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await requireSession();
  const body = await req.text();
  if (!body) return NextResponse.json({ error: 'empty_body' }, { status: 400 });

  const { rows, errors } = parseCsv<Record<string, string>>(body);
  const summary: ImportSummary = emptySummary();
  for (const e of errors) summary.failures.push({ row: e.row, message: `csv_parse: ${e.message}` });

  for (let i = 0; i < rows.length; i++) {
    summary.attempted++;
    const parsed = ContactRow.safeParse(rows[i]);
    if (!parsed.success) {
      summary.failures.push({
        row: i + 2,
        message: parsed.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; '),
      });
      continue;
    }
    const r = parsed.data;
    try {
      const existing = r.taxNumber
        ? await db.contact.findFirst({ where: { tenantId: session.tenantId, taxNumber: r.taxNumber } })
        : await db.contact.findFirst({ where: { tenantId: session.tenantId, nameAr: r.nameAr, deletedAt: null } });
      if (existing) {
        await db.contact.update({
          where: { id: existing.id },
          data: {
            kind: r.kind, nameAr: r.nameAr, nameEn: r.nameEn || undefined,
            taxNumber: r.taxNumber || undefined,
            commercialReg: r.commercialReg || undefined,
            phone: r.phone || undefined,
            email: r.email || undefined,
            addressAr: r.addressAr || undefined,
            governorate: r.governorate || undefined,
            currency: r.currency,
            creditLimit: r.creditLimit ? new Prisma.Decimal(r.creditLimit) : undefined,
          },
        });
        summary.updated++;
      } else {
        await db.contact.create({
          data: {
            tenantId: session.tenantId,
            kind: r.kind, nameAr: r.nameAr, nameEn: r.nameEn,
            taxNumber: r.taxNumber,
            commercialReg: r.commercialReg,
            phone: r.phone, email: r.email || undefined,
            addressAr: r.addressAr, governorate: r.governorate,
            currency: r.currency,
            creditLimit: r.creditLimit ? new Prisma.Decimal(r.creditLimit) : new Prisma.Decimal(0),
          },
        });
        summary.inserted++;
      }
    } catch (e: any) {
      summary.failures.push({ row: i + 2, key: r.nameAr, message: e?.message ?? 'db_error' });
    }
  }
  return NextResponse.json(summary);
}
