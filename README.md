# Iraq ERP — نظام تخطيط موارد المؤسسة للعراق

A production-grade, **multi-tenant ERP system built specifically for Iraqi compliance**:
trilingual (Arabic / Kurdish / English), RTL-first, IQD-base multi-currency, with the
Iraqi Unified Accounting System (IUAS 2026) and General Commission for Taxes (GCT) rules
baked into the engine.

> **Status:** Foundation + Iraq compliance core + vertical slice (login → modules →
> post a compliant invoice → run payroll with Iraqi PIT/SS). Built to be extended
> module-by-module by your team.

---

## What's in the box

### Iraq-specific compliance (the heart of this system)

| Area | Implementation | Source |
|------|----------------|--------|
| Chart of accounts | Full **Iraqi Unified Accounting System (IUAS / النظام المحاسبي الموحد)** — IFRS-aligned, hierarchical (7 levels), 60+ accounts seeded in AR + EN | Federal Board of Supreme Audit reform, mandated 2026 |
| Personal Income Tax (PIT) | Progressive **3% → 5% → 10% → 15%** brackets; KRG flat **5%** practical (15% official) | Iraqi Income Tax Law, GCT instructions |
| Personal allowances | Single 2.5M IQD/yr • Married 4.5M • per child 200k • over-65 300k | Same |
| Social Security | Employee **5%**, Employer **12%** (**25%** for oil & gas) | Iraqi SS Law |
| Corporate Income Tax | Federal **15%** (35% oil & gas); KRG flat **15%** | PwC Iraq Tax Summary |
| Withholding Tax | Federal 15% on non-resident services; KRG **not observed** | KRG vs Federal practice |
| Invoice fields (Nov 2025) | HS code ≥6 digits, country of origin, trademark, importer/exporter address, Incoterms 2020, payment & shipping terms | Iraqi Customs reforms |
| ASYCUDA World support | HS code validation, CIF + tariff (4.19%) + customs VAT (5%) computation | Mandatory since 1 Jul 2025 |
| Tax regions | Federal Iraq vs Kurdistan Region (KRG) — different rates, deadlines, practices | Tenant-level switch |
| Filing deadline tracking | Monthly SS (30th of following month), annual SS (Feb 28), D/4A (Mar 31 / Jun 30 KRG), CIT (May 31 / Jun 30 KRG) | GCT calendar |
| Currency | **IQD-base**, multi-currency (USD/EUR/TRY/AED/SAR/JOD/KWD/GBP/CNY); BigNumber.js precision; CBI rate hook | Iraq trade reality |
| Calendar | Gregorian primary + Hijri equivalent (Kuwaiti algorithm) for cultural/religious docs | Iraqi practice |
| Tax kinds | Sales (hospitality 10%, telecom), Withholding, Customs, Stamp duty + future VAT slot | Iraqi tax types |
| Mobile money | Zain Cash, FIB, Asia Hawala as payment methods | Iraqi market |
| Audit trail | Every state-changing action logged with before/after diff | GCT audit-readiness |

### Modules

- **Accounting** — General Ledger, Journals (double-entry, balanced, locked once posted), Chart of Accounts (IUAS)
- **Sales / Invoicing** — Domestic, Export, Import — Nov-2025 invoice validator built in
- **Purchases** — Bills with withholding tax, supplier-side
- **Inventory** — Multi-warehouse, HS-tagged products, stock thresholds
- **HR** — Employees, departments, dependents (drives PIT allowance)
- **Payroll** — Monthly runs, automatic SS/PIT, journal posting
- **POS** — Sessions, orders (terminals configurable per branch)
- **CRM** — Contacts (customer / supplier / both), credit limits
- **Fixed Assets** — Register with straight-line & declining-balance depreciation
- **Projects & Cost Centers** — Construction-sector-ready dimensional tagging
- **Reports** — Trial Balance, Income Statement stub, Balance Sheet stub

### Architecture

```
Next.js 15 (App Router) ─┬─ /app/[locale]/auth     trilingual login
                          ├─ /app/[locale]/dashboard 10+ module pages
                          └─ /app/api               typed REST endpoints
TypeScript (strict)
Tailwind CSS + shadcn/ui   custom RTL theme, Iraqi-green accent
next-intl                  ar (RTL) / ku (RTL) / en (LTR), per-route locale
Prisma + PostgreSQL        30+ models, multi-tenant, Decimal(20,4) money
Argon2id passwords
JWT sessions (jose)        httpOnly cookies, 12h TTL, tenant-scoped
Zod                        request validation + Iraq invoice compliance schemas
BigNumber.js               every monetary calculation
```

---

## Getting started

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- pnpm (or npm/yarn)

### Setup

```bash
# 1. Install
pnpm install

# 2. Configure env
cp .env.example .env
# Edit DATABASE_URL and JWT_SECRET

# 3. Apply schema + seed demo tenant
pnpm db:migrate
pnpm db:seed

# 4. Run
pnpm dev          # → http://localhost:3000
```

### Demo login (after seed)

| User              | Email                 | Password         |
|-------------------|-----------------------|------------------|
| Owner             | owner@demo.iq         | Owner@2026!      |
| Accountant        | accountant@demo.iq    | Accountant@2026! |
| HR                | hr@demo.iq            | HR@2026!         |

---

## Compliance disclaimer

This codebase implements Iraqi tax and accounting rules **based on publicly
available sources at time of writing**. Tax law changes — every tenant should
have a licensed Iraqi tax advisor review the configured rates and brackets
**before each fiscal year**. See `docs/IRAQ_COMPLIANCE.md` for the source of
every numeric rule.
