/**
 * Iraq tax compliance — personal income tax (PIT), corporate income tax (CIT),
 * social security, withholding tax.
 *
 * All numeric rules below are sourced from Iraq's General Commission for Taxes (GCT),
 * PwC Worldwide Tax Summaries (Iraq), and Iraqi Ministry of Finance publications.
 * See docs/IRAQ_COMPLIANCE.md for full citations.
 *
 * IMPORTANT: tax law changes. These rules MUST be reviewed annually by a
 * licensed Iraqi tax advisor before each fiscal year. The implementation is
 * structured so brackets/rates can be overridden per-tenant per-year via the
 * database without code changes (see PayrollSettings — TODO future model).
 */

import BigNumber from 'bignumber.js';

export type TaxRegion = 'FEDERAL' | 'KURDISTAN';
export type Sector =
  | 'GENERAL' | 'OIL_GAS' | 'TELECOM' | 'HOSPITALITY' | 'CONSTRUCTION'
  | 'RETAIL'  | 'MANUFACTURING' | 'AGRICULTURE' | 'HEALTHCARE' | 'EDUCATION'
  | 'TRANSPORT';

/**
 * Personal income tax brackets — federal Iraq, private-sector employees.
 * Progressive rates 3% → 15% on monthly taxable income (after allowances).
 * Brackets here are expressed in monthly IQD on a yearly-equivalent basis;
 * Iraq applies PAYE monthly so we calculate per-month gross-up internally.
 *
 * The brackets in Iraqi tax law are stated annually; we hold them annually
 * and divide by 12 inside the engine for PAYE.
 */
export const PIT_BRACKETS_FEDERAL_ANNUAL: ReadonlyArray<{
  upTo: number | null; // IQD, inclusive upper bound; null = no upper bound
  rate: number;        // decimal
}> = [
  { upTo:  250_000, rate: 0.03 },
  { upTo:  500_000, rate: 0.05 },
  { upTo: 1_000_000, rate: 0.10 },
  { upTo:       null, rate: 0.15 },
];

/**
 * In the Kurdistan Region of Iraq the official PIT is 15%, but in practice
 * the tax authority applies a flat 5%. We default to the practical rate;
 * tenants in KRG can opt into 15% in settings if their auditor requires.
 */
export const PIT_FLAT_KURDISTAN = 0.05;
export const PIT_FLAT_KURDISTAN_OFFICIAL = 0.15;

/**
 * Annual personal allowances (IQD) — private-sector employees.
 * Source: Iraq Income Tax Law and GCT instructions (current rates through 2026).
 */
export const ALLOWANCES_ANNUAL = {
  single:     2_500_000,
  married:    4_500_000,
  perChild:     200_000,
  agedOver65:   300_000,
} as const;

/**
 * Social security contribution rates.
 * Employer 12% (25% for oil & gas), employee 5% — applied to gross salary.
 */
export const SS_RATES = {
  employee: 0.05,
  employer: { default: 0.12, oilGas: 0.25 },
} as const;

/**
 * Corporate income tax — flat 15% federally on net taxable income.
 * Oil & gas: 35% in federal Iraq. KRG applies a flat 15% even for oil & gas.
 */
export const CIT_RATES = {
  federal: { general: 0.15, oilGas: 0.35 },
  kurdistan: { general: 0.15, oilGas: 0.15 },
} as const;

/**
 * Withholding tax on payments to non-resident service providers — common
 * rate is 15% in federal Iraq; KRG does not currently observe this retention.
 */
export const WHT_NONRESIDENT_SERVICES = {
  federal: 0.15,
  kurdistan: 0,
} as const;

export interface EmployeeForPayroll {
  baseSalary: BigNumber.Value;    // monthly IQD
  allowances?: BigNumber.Value;
  overtime?: BigNumber.Value;
  bonuses?: BigNumber.Value;
  otherDeductions?: BigNumber.Value;
  isMarried?: boolean;
  dependents?: number;            // number of children
  isOver65?: boolean;
}

export interface TenantPayrollContext {
  region: TaxRegion;
  sector: Sector;
  /// KRG tenant choosing official 15% over practical 5%
  krgUseOfficialRate?: boolean;
  /// Deduct income tax (PIT)? Default true. Set false to skip (e.g. exempt staff).
  applyIncomeTax?: boolean;
  /// Deduct social security (employee + employer)? Default true.
  applySocialSecurity?: boolean;
}

export interface PayrollComputation {
  gross: BigNumber;
  taxableMonthly: BigNumber;
  incomeTax: BigNumber;
  ssEmployee: BigNumber;
  ssEmployer: BigNumber;
  otherDeductions: BigNumber;
  net: BigNumber;
  /// Total cost to employer (gross + employer SS)
  employerCost: BigNumber;
}

/**
 * Compute one employee's monthly payroll under Iraqi rules.
 *
 * Method:
 *   1. gross         = base + allowances + overtime + bonuses
 *   2. annualAllow   = single|married + perChild × dependents + agedOver65?
 *   3. taxableMonthly = max(0, gross − annualAllow / 12)
 *   4. ssEmployee    = gross × 5%
 *   5. incomeTax     — progressive (federal) or flat (KRG) on taxableMonthly
 *   6. ssEmployer    = gross × (12% | 25%)
 *   7. net           = gross − ssEmployee − incomeTax − otherDeductions
 */
export function computePayroll(
  emp: EmployeeForPayroll,
  ctx: TenantPayrollContext
): PayrollComputation {
  const base   = bn(emp.baseSalary);
  const allow  = bn(emp.allowances ?? 0);
  const ot     = bn(emp.overtime ?? 0);
  const bonus  = bn(emp.bonuses ?? 0);
  const other  = bn(emp.otherDeductions ?? 0);
  const gross  = base.plus(allow).plus(ot).plus(bonus);

  // Personal allowance (annual → monthly)
  const annualAllow =
    (emp.isMarried ? ALLOWANCES_ANNUAL.married : ALLOWANCES_ANNUAL.single)
    + ALLOWANCES_ANNUAL.perChild * (emp.dependents ?? 0)
    + (emp.isOver65 ? ALLOWANCES_ANNUAL.agedOver65 : 0);
  const monthlyAllow = bn(annualAllow).div(12);
  const taxableMonthly = BigNumber.maximum(gross.minus(monthlyAllow), 0);

  const applySs = ctx.applySocialSecurity !== false;
  const applyPit = ctx.applyIncomeTax !== false;

  const ssEmployee = applySs ? gross.times(SS_RATES.employee) : new BigNumber(0);
  const ssEmployerRate =
    ctx.sector === 'OIL_GAS' ? SS_RATES.employer.oilGas : SS_RATES.employer.default;
  const ssEmployer = applySs ? gross.times(ssEmployerRate) : new BigNumber(0);

  const incomeTax = !applyPit
    ? new BigNumber(0)
    : ctx.region === 'KURDISTAN'
      ? taxableMonthly.times(ctx.krgUseOfficialRate ? PIT_FLAT_KURDISTAN_OFFICIAL : PIT_FLAT_KURDISTAN)
      : pitProgressiveMonthly(taxableMonthly);

  const net = gross.minus(ssEmployee).minus(incomeTax).minus(other);
  const employerCost = gross.plus(ssEmployer);

  return {
    gross, taxableMonthly, incomeTax,
    ssEmployee, ssEmployer, otherDeductions: other, net, employerCost,
  };
}

/**
 * Progressive PIT on a single month's taxable income.
 * We convert the monthly amount to annual, slice across brackets, then divide back.
 */
function pitProgressiveMonthly(monthlyTaxable: BigNumber): BigNumber {
  if (monthlyTaxable.lte(0)) return bn(0);
  const annual = monthlyTaxable.times(12);
  let remaining = annual;
  let lower = bn(0);
  let tax = bn(0);
  for (const bracket of PIT_BRACKETS_FEDERAL_ANNUAL) {
    const upper = bracket.upTo === null ? null : bn(bracket.upTo);
    const slice = upper === null
      ? remaining
      : BigNumber.minimum(remaining, upper.minus(lower));
    if (slice.lte(0)) break;
    tax = tax.plus(slice.times(bracket.rate));
    remaining = remaining.minus(slice);
    if (upper === null || remaining.lte(0)) break;
    lower = upper;
  }
  return tax.div(12);
}

/**
 * Corporate income tax on net taxable profit (annual).
 */
export function computeCIT(
  netTaxableProfit: BigNumber.Value,
  ctx: { region: TaxRegion; sector: Sector }
): BigNumber {
  const rates = ctx.region === 'KURDISTAN' ? CIT_RATES.kurdistan : CIT_RATES.federal;
  const rate = ctx.sector === 'OIL_GAS' ? rates.oilGas : rates.general;
  return bn(netTaxableProfit).times(rate);
}

function bn(v: BigNumber.Value) { return new BigNumber(v); }
