/**
 * ASYCUDA World customs-declaration export.
 * Iraqi Customs requires HS codes on all inbound cargo manifests since 1 Jul 2025.
 */

import type { PrismaClient } from '@prisma/client';

export async function buildAsycudaExport(
  db: PrismaClient,
  tenantId: string,
  invoiceId: string
): Promise<{ csv: string; filename: string }> {
  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, tenantId },
    include: { contact: true, lines: { include: { product: true } } },
  });
  if (!invoice) throw new Error('invoice_not_found');
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });

  const headers = [
    'Invoice Number','Invoice Date','Currency','FX to IQD',
    'Incoterms','Importer Name','Importer Address','Exporter Name','Exporter Address',
    'Line','HS Code','Description','Country of Origin','Trademark',
    'Quantity','UoM','Unit Price','Line Total',
  ];

  const lines = [headers.join(',')];
  invoice.lines.forEach((l, i) => {
    lines.push([
      csv(invoice.number),
      invoice.date.toISOString().slice(0, 10),
      invoice.currency,
      invoice.fxRate.toString(),
      invoice.shippingTerms ?? '',
      csv(invoice.contact.nameEn ?? invoice.contact.nameAr),
      csv(invoice.importerAddress ?? invoice.contact.addressEn ?? ''),
      csv(tenant?.nameEn ?? ''),
      csv(invoice.exporterAddress ?? ''),
      String(i + 1),
      l.hsCode ?? '',
      csv(l.description),
      l.countryOfOrigin ?? '',
      csv(l.trademark ?? ''),
      l.quantity.toString(),
      l.unitOfMeasure,
      l.unitPrice.toString(),
      l.lineTotal.toString(),
    ].join(','));
  });

  return {
    csv: lines.join('\n'),
    filename: `ASYCUDA-${invoice.number}.csv`,
  };
}

function csv(s: string): string {
  if (!s) return '';
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
