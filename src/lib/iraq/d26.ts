/**
 * GCT Form D/26 — annual corporate income-tax return.
 *
 * Filed annually with the Iraqi General Commission for Taxes:
 *   - Federal entities: due 31 May of the year following the tax year
 *   - KRG entities: due 30 June
 *
 * D/26 summarises the year's gross revenue, deductible expenses, taxable
 * income, applicable CIT rate, tax due, and prepayments / withholdings.
 * Iraqi CIT is generally a flat 15%; oil & gas / extractive industries pay 35%
 * federal (different in KRG).
 */

import type { PrismaClient } from '@prisma/client';
import BigNumber from 'bignumber.js';
import { trialBalance } from './reports';

export interface D26Result {
  fiscalYear: number;
  grossRevenue: string;
  cogs: string;
  grossProfit: string;
  operatingExpenses: string;
  netProfitBeforeTax: string;
  citRate: string;          // e.g. '0.15'
  taxDue: string;
  prepayments: string;
  withholdings: string;
  taxPayable: string;
  sector: string;
  region: 'FEDERAL' | 'KURDISTAN';
}

export async function buildD26(
  db: PrismaClient,
  tenantId: string,
  fiscalYear: number
): Promise<D26Result> {
  const asOf = new Date(Date.UTC(fiscalYear, 11, 31));
  const tb = await trialBalance(db, tenantId, asOf);
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });

  const sum = (filter: (code: string) => boolean) =>
    tb.filter((r) => filter(r.code)).reduce((s, r) => s.plus(r.balance), new BigNumber(0));

  const revenue = sum((c) => c.startsWith('41') || c.startsWith('42'));      // IUAS income
  const cogs    = sum((c) => c.startsWith('51'));                             // cost of sales
  const opex    = sum((c) => c.startsWith('5') && !c.startsWith('51'));       // other 5xxx
  const gp      = revenue.minus(cogs);
  const npbt    = gp.minus(opex);

  const region = (tenant?.region ?? 'FEDERAL') as 'FEDERAL' | 'KURDISTAN';
  const sector = tenant?.sector ?? 'GENERAL';
  let citRate = '0.15';
  if (region === 'FEDERAL' && sector === 'OIL_GAS') citRate = '0.35';
  if (region === 'KURDISTAN') citRate = '0.15';

  const tax = npbt.gt(0) ? npbt.times(citRate) : new BigNumber(0);

  // Prepayments and withholdings — sum of WHT payable / receivable accounts (placeholder codes).
  const prepay = sum((c) => c === '23');     // current-tax prepayments (assets)
  const wht    = sum((c) => c === '231');    // withholdings receivable

  return {
    fiscalYear,
    grossRevenue: revenue.toFixed(2),
    cogs: cogs.toFixed(2),
    grossProfit: gp.toFixed(2),
    operatingExpenses: opex.toFixed(2),
    netProfitBeforeTax: npbt.toFixed(2),
    citRate,
    taxDue: tax.toFixed(2),
    prepayments: prepay.toFixed(2),
    withholdings: wht.toFixed(2),
    taxPayable: tax.minus(prepay).minus(wht).toFixed(2),
    sector,
    region,
  };
}

export function toD26Csv(r: D26Result, tenant: { nameAr: string; nameEn: string; taxNumber: string | null }): string {
  const rows: string[] = [];
  rows.push(`GCT Form D/26 — Annual Corporate Income Tax Return,Fiscal Year ${r.fiscalYear}`);
  rows.push('');
  rows.push(`Tenant (AR),${tenant.nameAr}`);
  rows.push(`Tenant (EN),${tenant.nameEn}`);
  rows.push(`Tax number,${tenant.taxNumber ?? '—'}`);
  rows.push(`Region,${r.region}`);
  rows.push(`Sector,${r.sector}`);
  rows.push('');
  rows.push('LINE,DESCRIPTION,AMOUNT (IQD)');
  rows.push(`1,Gross revenue,${r.grossRevenue}`);
  rows.push(`2,Cost of goods sold,${r.cogs}`);
  rows.push(`3,Gross profit (1-2),${r.grossProfit}`);
  rows.push(`4,Operating expenses,${r.operatingExpenses}`);
  rows.push(`5,Net profit before tax (3-4),${r.netProfitBeforeTax}`);
  rows.push(`6,CIT rate,${(parseFloat(r.citRate) * 100).toFixed(2)}%`);
  rows.push(`7,Tax due (5×6),${r.taxDue}`);
  rows.push(`8,Prepayments,${r.prepayments}`);
  rows.push(`9,Withholdings,${r.withholdings}`);
  rows.push(`10,Tax payable (7-8-9),${r.taxPayable}`);
  return '﻿' + rows.join('\r\n');
}
