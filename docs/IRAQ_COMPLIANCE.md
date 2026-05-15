# Iraq Compliance — Rules, Numbers, Sources

This document records every Iraq-specific numeric rule encoded in this system,
its rationale, and the public source it was derived from. Review annually with
a licensed Iraqi tax advisor.

## Accounting standards

### Iraqi Unified Accounting System (IUAS) — النظام المحاسبي الموحد
- **Mandated:** Full implementation by 2026
- **Standard:** IFRS-aligned, hierarchical (7 analytical levels), decimal-based
- **Top groups encoded** (`src/lib/iraq/coa.ts`):
  - `1xxx` Assets · `2xxx` Liabilities · `3xxx` Equity · `4xxx` Income
  - `5xxx` Operating expenses · `6xxx` COGS · `7xxx` Manufacturing
  - `8xxx` Services · `9xxx` Memo / off-balance
- Sources:
  - Iraqi Federal Board of Supreme Audit publications
  - Iraqi Union of Accountants and Auditors (IUAA) — IFAC member
  - Iraq Ministry of Finance, United Accounting Manual

## Personal Income Tax (PIT)

### Federal Iraq — `src/lib/iraq/tax.ts → PIT_BRACKETS_FEDERAL_ANNUAL`
Progressive brackets on monthly PAYE income (after allowances), evaluated annually:
| Annual taxable (IQD) | Rate |
|----------------------|------|
| 0 – 250,000          | 3%   |
| 250,001 – 500,000    | 5%   |
| 500,001 – 1,000,000  | 10%  |
| Over 1,000,000       | 15%  |

### KRG — `src/lib/iraq/tax.ts → PIT_FLAT_KURDISTAN`
- Official: 15%
- **Practical: 5%** (applied by KRG tax authorities)
- Tenants in KRG may opt into the official 15% via `krgUseOfficialRate`

### Allowances — `ALLOWANCES_ANNUAL`
| Item              | Annual amount (IQD) |
|-------------------|---------------------|
| Single            | 2,500,000           |
| Married           | 4,500,000           |
| Per child         | 200,000             |
| Over 65           | 300,000             |

Sources: PwC Worldwide Tax Summaries — Iraq Individual Deductions;
Iraqi Ministry of Finance, GCT instructions.

## Social Security — `SS_RATES`

| Party              | General | Oil & Gas |
|--------------------|---------|-----------|
| Employee           | 5%      | 5%        |
| Employer           | 12%     | **25%**   |

Filing:
- Monthly contribution due by **30th of the month following the deduction month**
- Annual SS forms due before **end of February**

Sources: PwC Iraq; Iraqi SS Law; Ramco/Iraq Payroll compliance guides.

## Corporate Income Tax (CIT) — `CIT_RATES`

| Region    | General | Oil & Gas |
|-----------|---------|-----------|
| Federal   | 15%     | **35%**   |
| Kurdistan | 15%     | 15%       |

Filing deadlines:
- Federal: **31 May** of following year
- KRG: **30 June** of following year

## Withholding Tax — `WHT_NONRESIDENT_SERVICES`

- Federal: 15% on services rendered by non-resident providers
- KRG: 0% (retention not practiced)

## Sales / Sector Taxes

Iraq does **not yet** operate a general VAT regime. Sector taxes already exist:
- Hospitality (hotels, restaurants): ~10% (seeded as `HOSP`)
- Telecom: applied at sector level
- Future general VAT slot is reserved in `TaxKind.VAT`

## Invoice Compliance (Nov 2025) — `src/lib/iraq/invoice.ts`

Required on **all cross-border invoices submitted from 1 November 2025**:
- Invoice date and sequential number
- Payment terms
- Shipping terms (Incoterms 2020)
- Invoice amount and currency
- HS code (minimum 6 digits)
- Importer and exporter addresses
- Detailed description of goods (matching HS)
- Country of origin
- Trademark / brand
- Quantity and unit of measure
- Unit price and total price
- Wet signature (digital signatures **not** yet recognised by Iraqi Customs)

Source: Iraqi Customs reform; UK Chamber of Commerce notification;
Iraq Customs `New Commercial Invoice Requirements` circular.

## ASYCUDA World — `src/lib/iraq/invoice.ts → computeImportCost`

Customs procedure:
- Electronic declarations mandatory at major ports (Umm Qasr, Baghdad Airport, Erbil Airport) — paper not accepted
- **HS code mandatory on all inbound cargo manifests since 1 July 2025**
- Average tariff: 4.19%
- Standard customs VAT: 5% on CIF
- Protective tariffs on selected items (e.g. 60% on certain plastics, increased duties on rebar)

## Calendar

- Primary: Gregorian (all GCT filings)
- Cultural / religious: Hijri equivalent stored via Kuwaiti algorithm
  (`src/lib/iraq/dates.ts → gregorianToHijri`). For official religious
  certificates, use the Umm al-Qura calendar.

## Currency

- Base: IQD (0 decimal places in practice)
- Common quote pair: IQD/USD (USD widely used in B2B and imports)
- Other currencies seen: EUR (some imports), TRY (Turkish trade), AED, SAR, JOD, KWD, GBP, CNY
- Stored via Prisma `Decimal(20, 4)` to safely handle every supported currency

## Annual filings cheat-sheet

| Filing            | Federal      | KRG          |
|-------------------|--------------|--------------|
| Monthly SS        | 30th next-month | same       |
| Annual SS forms   | end of Feb   | same         |
| Employee D/4A     | 31 March     | 30 June      |
| Corporate income  | 31 May       | 30 June      |
