/**
 * GCT D/4A — annual employee income-tax return.
 * Due 31 March (federal) or 30 June (KRG).
 */

import type { PrismaClient } from '@prisma/client';
import BigNumber from 'bignumber.js';

export interface D4ARow {
  empNo: string;
  fullNameAr: string;
  nationalId: string | null;
  ssNumber: string | null;
  hireDate: string;
  baseSalaryAnnual: string;
  allowancesAnnual: string;
  grossAnnual: string;
  ssEmployeeAnnual: string;
  incomeTaxAnnual: string;
  netAnnual: string;
}

export interface D4ATotals {
  baseSalaryAnnual: string;
  allowancesAnnual: string;
  grossAnnual: string;
  ssEmployeeAnnual: string;
  incomeTaxAnnual: string;
  netAnnual: string;
}

export async function buildD4A(
  db: PrismaClient,
  tenantId: string,
  fiscalYear: number
): Promise<{ rows: D4ARow[]; totals: D4ATotals }> {
  const runs = await db.payrollRun.findMany({
    where: {
      tenantId,
      period: { startsWith: `${fiscalYear}-` },
      status: { in: ['POSTED', 'PAID'] },
    },
    include: { lines: { include: { employee: true } } },
  });

  const perEmp = new Map<string, any>();
  for (const run of runs) {
    for (const l of run.lines) {
      const e = perEmp.get(l.employeeId) ?? {
        employee: l.employee,
        base: new BigNumber(0), allow: new BigNumber(0), gross: new BigNumber(0),
        ssEmp: new BigNumber(0), pit: new BigNumber(0), net: new BigNumber(0),
      };
      e.base   = e.base.plus(l.baseSalary.toString());
      e.allow  = e.allow.plus(l.allowances.toString()).plus(l.bonuses.toString()).plus(l.overtime.toString());
      e.gross  = e.gross.plus(l.gross.toString());
      e.ssEmp  = e.ssEmp.plus(l.ssEmployee.toString());
      e.pit    = e.pit.plus(l.incomeTax.toString());
      e.net    = e.net.plus(l.net.toString());
      perEmp.set(l.employeeId, e);
    }
  }

  const rows: D4ARow[] = Array.from(perEmp.values()).map((e: any) => ({
    empNo: e.employee.empNo,
    fullNameAr: e.employee.fullNameAr,
    nationalId: e.employee.nationalId,
    ssNumber: e.employee.ssNumber,
    hireDate: e.employee.hireDate.toISOString().slice(0, 10),
    baseSalaryAnnual: e.base.toFixed(0),
    allowancesAnnual: e.allow.toFixed(0),
    grossAnnual: e.gross.toFixed(0),
    ssEmployeeAnnual: e.ssEmp.toFixed(0),
    incomeTaxAnnual: e.pit.toFixed(0),
    netAnnual: e.net.toFixed(0),
  }));

  const totals = rows.reduce<D4ATotals>(
    (s, r) => ({
      baseSalaryAnnual: new BigNumber(s.baseSalaryAnnual).plus(r.baseSalaryAnnual).toFixed(0),
      allowancesAnnual: new BigNumber(s.allowancesAnnual).plus(r.allowancesAnnual).toFixed(0),
      grossAnnual: new BigNumber(s.grossAnnual).plus(r.grossAnnual).toFixed(0),
      ssEmployeeAnnual: new BigNumber(s.ssEmployeeAnnual).plus(r.ssEmployeeAnnual).toFixed(0),
      incomeTaxAnnual: new BigNumber(s.incomeTaxAnnual).plus(r.incomeTaxAnnual).toFixed(0),
      netAnnual: new BigNumber(s.netAnnual).plus(r.netAnnual).toFixed(0),
    }),
    { baseSalaryAnnual: '0', allowancesAnnual: '0', grossAnnual: '0', ssEmployeeAnnual: '0', incomeTaxAnnual: '0', netAnnual: '0' }
  );

  return { rows, totals };
}

export function toD4ACsv(rows: D4ARow[], totals: D4ATotals): string {
  const headers = [
    'Emp No', 'Name (AR)', 'National ID', 'SS Number', 'Hire Date',
    'Base salary (annual)', 'Allowances/Bonuses (annual)', 'Gross (annual)',
    'SS Employee (annual)', 'Income Tax (annual)', 'Net (annual)',
  ];
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push([
      r.empNo, csv(r.fullNameAr), r.nationalId ?? '', r.ssNumber ?? '', r.hireDate,
      r.baseSalaryAnnual, r.allowancesAnnual, r.grossAnnual,
      r.ssEmployeeAnnual, r.incomeTaxAnnual, r.netAnnual,
    ].join(','));
  }
  lines.push(['', 'TOTAL', '', '', '',
    totals.baseSalaryAnnual, totals.allowancesAnnual, totals.grossAnnual,
    totals.ssEmployeeAnnual, totals.incomeTaxAnnual, totals.netAnnual,
  ].join(','));
  return lines.join('\n');
}

function csv(s: string): string {
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
