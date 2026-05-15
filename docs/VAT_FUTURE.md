# Future VAT in Iraq

## Status (May 2026)

Iraq currently does **not** operate a general VAT. Existing taxes are
sector-specific (hospitality 10%, telecom). Reform discussions are ongoing
and the GCT 2024 IMF technical assistance recommended VAT introduction.

When VAT is introduced, expected modalities:

| Field                | Likely value                                    |
|----------------------|-------------------------------------------------|
| Standard rate        | 5–15% (GCC band; 5% is the regional default)    |
| Registration threshold | ~100M IQD/year revenue                        |
| Filing periodicity   | Monthly large taxpayers, quarterly otherwise    |
| Zero-rated           | Exports of goods, basic foodstuffs              |
| Exempt               | Education, healthcare, financial services       |
| Reverse charge       | Cross-border B2B services                       |

## Already in place

- `TaxKind.VAT` enum value is reserved on `TaxRate`.
- `src/lib/iraq/vat.ts` provides:
  - `VatConfig` type
  - `DEFAULT_VAT_CONFIG_PLACEHOLDER`
  - `computeVatReturn({ taxableSales, taxablePurchases, config })`
- Invoice and Bill models already track `taxRate` and `taxAmount` per line.

## What to build when Iraq publishes the regime

1. Per-tenant `VatConfig` row in a new `VatSettings` table
2. VAT return form: `src/app/[locale]/dashboard/vat/return/page.tsx`
3. Auto-apply standard rate on Invoice/Bill creation when tenant is VAT-registered
4. Reverse-charge support on Bills from non-resident suppliers

Expect 1–2 days of work when the regime is published.
