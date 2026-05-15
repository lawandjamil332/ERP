import { describe, it, expect } from 'vitest';
import { validateInvoice, formatInvoiceNumber, computeImportCost, HS_CODE_MIN_DIGITS } from './invoice';

describe('Iraq invoice validation', () => {
  const validDomestic = {
    number: 'INV-2026-000001',
    date: new Date('2026-01-15'),
    currency: 'IQD',
    supplierTaxNumber: 'IQ-001',
    total: 500_000,
    lines: [{ description: 'Wheat 50kg', quantity: 1, unitOfMeasure: 'BAG', unitPrice: 500_000 }],
  };

  it('accepts a domestic invoice without HS code', () => {
    expect(validateInvoice('DOMESTIC_SALE', validDomestic).success).toBe(true);
  });

  it('rejects a cross-border invoice missing HS/origin/trademark', () => {
    const r = validateInvoice('EXPORT', {
      ...validDomestic,
      shippingTerms: 'FOB', paymentTerms: 'Net 30',
      importerAddress: 'Tehran', exporterAddress: 'Baghdad',
    });
    expect(r.success).toBe(false);
  });

  it('accepts a complete cross-border invoice', () => {
    const r = validateInvoice('EXPORT', {
      ...validDomestic,
      shippingTerms: 'FOB', paymentTerms: 'Net 30',
      importerAddress: 'Tehran', exporterAddress: 'Baghdad',
      lines: [{
        description: 'Wheat', quantity: 1, unitOfMeasure: 'BAG', unitPrice: 500_000,
        hsCode: '100199', countryOfOrigin: 'IQ', trademark: 'Local',
      }],
    });
    expect(r.success).toBe(true);
  });
});

describe('formatInvoiceNumber', () => {
  it('zero-pads to 6 digits', () => {
    expect(formatInvoiceNumber('INV', 2026, 7)).toBe('INV-2026-000007');
  });
});

describe('computeImportCost (Iraq Customs)', () => {
  it('CIF + 4.19% tariff + 5% customs VAT', () => {
    const r = computeImportCost({ cost: 1_000_000, insurance: 10_000, freight: 50_000 });
    expect(r.cif).toBe(1_060_000);
    expect(r.duty).toBeCloseTo(1_060_000 * 0.0419, 2);
  });
  it('exposes HS_CODE_MIN_DIGITS = 6', () => {
    expect(HS_CODE_MIN_DIGITS).toBe(6);
  });
});
