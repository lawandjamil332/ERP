/**
 * Iraq invoice & customs compliance helpers.
 *
 * Iraq introduced new commercial-invoice requirements effective 1 November 2025,
 * and the ASYCUDA World customs system has required HS codes on all inbound
 * cargo manifests since 1 July 2025. This module validates invoice payloads
 * against those rules before they can be posted.
 *
 * Cross-border (import/export) invoices: stricter — HS code, country of origin,
 * trademark, importer & exporter address, Incoterms, consignee tax ID required,
 * wet signature still required by Iraqi Customs (digital not yet recognised).
 *
 * Domestic invoices: lighter requirements but still need supplier tax ID,
 * tax number on customer if business, sequential numbering, and Arabic copy
 * for GCT inspections.
 */

import { z } from 'zod';

export const INVOICE_KIND = ['DOMESTIC_SALE', 'DOMESTIC_PURCHASE', 'EXPORT', 'IMPORT'] as const;
export type InvoiceKind = (typeof INVOICE_KIND)[number];

/** Minimum HS code length required by Iraqi Customs (ASYCUDA). */
export const HS_CODE_MIN_DIGITS = 6;

/** Common Iraqi Incoterms — full Incoterms 2020 set, listed in priority order. */
export const INCOTERMS_2020 = [
  'EXW','FCA','CPT','CIP','DAP','DPU','DDP',
  'FAS','FOB','CFR','CIF',
] as const;

const InvoiceLineSchema = z.object({
  description: z.string().min(1),
  hsCode: z.string().regex(/^\d{6,}$/, 'HS code must be at least 6 digits').optional(),
  countryOfOrigin: z.string().length(2).optional(),
  trademark: z.string().optional(),
  quantity: z.number().positive(),
  unitOfMeasure: z.string().min(1),
  unitPrice: z.number().nonnegative(),
});

const BaseInvoiceSchema = z.object({
  number: z.string().min(1, 'Sequential number is required'),
  date: z.coerce.date(),
  currency: z.string().length(3),
  supplierTaxNumber: z.string().min(1, 'Supplier tax number is required for GCT'),
  customerTaxNumber: z.string().optional(),
  customerNationalId: z.string().optional(),
  total: z.number().positive(),
  lines: z.array(InvoiceLineSchema).min(1, 'At least one line is required'),
});

export const DomesticInvoiceSchema = BaseInvoiceSchema.refine(
  (i) => i.customerTaxNumber || i.customerNationalId || i.total < 1_000_000,
  { message: 'Customer tax number or national ID required for invoices ≥ 1,000,000 IQD' }
);

export const CrossBorderInvoiceSchema = BaseInvoiceSchema.extend({
  shippingTerms: z.enum(INCOTERMS_2020, {
    errorMap: () => ({ message: 'Iraqi Customs requires valid Incoterms 2020 code' }),
  }),
  importerAddress: z.string().min(1, 'Importer address required (Nov 2025 rules)'),
  exporterAddress: z.string().min(1, 'Exporter address required (Nov 2025 rules)'),
  paymentTerms: z.string().min(1),
}).superRefine((inv, ctx) => {
  inv.lines.forEach((line, i) => {
    if (!line.hsCode) {
      ctx.addIssue({ code: 'custom', path: ['lines', i, 'hsCode'],
        message: 'HS code (≥6 digits) required on cross-border invoices' });
    }
    if (!line.countryOfOrigin) {
      ctx.addIssue({ code: 'custom', path: ['lines', i, 'countryOfOrigin'],
        message: 'Country of origin required on cross-border invoices' });
    }
    if (!line.trademark) {
      ctx.addIssue({ code: 'custom', path: ['lines', i, 'trademark'],
        message: 'Trademark required on cross-border invoices' });
    }
  });
});

export function validateInvoice(kind: InvoiceKind, payload: unknown) {
  switch (kind) {
    case 'DOMESTIC_SALE':
    case 'DOMESTIC_PURCHASE':
      return DomesticInvoiceSchema.safeParse(payload);
    case 'EXPORT':
    case 'IMPORT':
      return CrossBorderInvoiceSchema.safeParse(payload);
  }
}

/**
 * Computes the customs cost basis for an imported good.
 * Iraqi Customs applies duty on CIF (Cost + Insurance + Freight),
 * then a flat 5% customs VAT on top. Tariff defaults to 4.19% average.
 */
export function computeImportCost(args: {
  cost: number;
  insurance?: number;
  freight?: number;
  tariffRate?: number;
  customsVatRate?: number;
  protectiveTariffs?: number;
}) {
  const insurance = args.insurance ?? 0;
  const freight   = args.freight ?? 0;
  const tariff    = args.tariffRate ?? 0.0419;
  const customs   = args.customsVatRate ?? 0.05;
  const protective = args.protectiveTariffs ?? 0;

  const cif = args.cost + insurance + freight;
  const duty       = cif * tariff;
  const protDuty   = cif * protective;
  const customsVat = (cif + duty + protDuty) * customs;
  const total      = cif + duty + protDuty + customsVat;

  return { cif, duty, protDuty, customsVat, total };
}

/**
 * Format an Iraqi invoice number with a tenant-configurable prefix and
 * year-padded sequence. Example: INV-2026-000001.
 */
export function formatInvoiceNumber(prefix: string, year: number, sequence: number) {
  return `${prefix}-${year}-${String(sequence).padStart(6, '0')}`;
}
