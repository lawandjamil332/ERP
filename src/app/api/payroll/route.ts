import { NextResponse } from 'next/server';
import { z } from 'zod';
import BigNumber from 'bignumber.js';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { computePayroll } from '@/lib/iraq/tax';
import { buildPayrollJournalLines, assertBalanced } from '@/lib/iraq/journals';

const Body = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/),
  overrides: z.record(z.string(), z.object({
    allowances: z.number().nonnegative().optional(),
    overtime: z.number().nonnegative().optional(),
    bonuses: z.number().nonnegative().optional(),
    otherDeductions: z.number().nonnegative().optional(),
  })).optional(),
  postImmediately: z.boolean().default(false),
  /// Optional deductions — default on (Iraqi-compliant) but the user can switch off.
  applyIncomeTax: z.boolean().default(true),
  applySocialSecurity: z.boolean().default(true),
});

export async function POST(req: Request) {
  let session;
  try { session = await requireSession(); }
  catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });

  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });
  if (!tenant) return NextResponse.json({ error: 'tenant_not_found' }, { status: 404 });

  const employees = await db.employee.findMany({
    where: { tenantId: session.tenantId, isActive: true },
  });
  if (!employees.length) return NextResponse.json({ error: 'no_active_employees' }, { status: 400 });

  const lines = employees.map((emp) => {
    const o = parsed.data.overrides?.[emp.id] ?? {};
    const calc = computePayroll(
      {
        baseSalary: emp.baseSalary.toString(),
        allowances: o.allowances ?? 0,
        overtime: o.overtime ?? 0,
        bonuses: o.bonuses ?? 0,
        otherDeductions: o.otherDeductions ?? 0,
        dependents: emp.dependents,
        isMarried: emp.dependents > 0,
      },
      {
        region: tenant.region as 'FEDERAL' | 'KURDISTAN',
        sector: tenant.sector as any,
        applyIncomeTax: parsed.data.applyIncomeTax,
        applySocialSecurity: parsed.data.applySocialSecurity,
      }
    );
    return { emp, calc };
  });

  const totalGross  = lines.reduce((s, l) => s.plus(l.calc.gross),       new BigNumber(0));
  const totalSsEmp  = lines.reduce((s, l) => s.plus(l.calc.ssEmployee),  new BigNumber(0));
  const totalSsEmpr = lines.reduce((s, l) => s.plus(l.calc.ssEmployer),  new BigNumber(0));
  const totalPit    = lines.reduce((s, l) => s.plus(l.calc.incomeTax),   new BigNumber(0));
  const totalOther  = lines.reduce((s, l) => s.plus(l.calc.otherDeductions), new BigNumber(0));
  const totalNet    = lines.reduce((s, l) => s.plus(l.calc.net),         new BigNumber(0));

  const run = await db.$transaction(async (tx) => {
    const created = await tx.payrollRun.create({
      data: {
        tenantId: session.tenantId,
        period: parsed.data.period,
        runDate: new Date(),
        status: parsed.data.postImmediately ? 'POSTED' : 'CALCULATED',
        lines: {
          create: lines.map(({ emp, calc }) => ({
            employeeId: emp.id,
            baseSalary: emp.baseSalary,
            allowances: new Prisma.Decimal(parsed.data.overrides?.[emp.id]?.allowances ?? 0),
            overtime:   new Prisma.Decimal(parsed.data.overrides?.[emp.id]?.overtime ?? 0),
            bonuses:    new Prisma.Decimal(parsed.data.overrides?.[emp.id]?.bonuses ?? 0),
            gross:      new Prisma.Decimal(calc.gross.toString()),
            ssEmployee: new Prisma.Decimal(calc.ssEmployee.toString()),
            ssEmployer: new Prisma.Decimal(calc.ssEmployer.toString()),
            incomeTax:  new Prisma.Decimal(calc.incomeTax.toString()),
            otherDeductions: new Prisma.Decimal(calc.otherDeductions.toString()),
            net:        new Prisma.Decimal(calc.net.toString()),
          })),
        },
      },
    });

    if (parsed.data.postImmediately) {
      const jl = buildPayrollJournalLines({
        gross: totalGross, ssEmployee: totalSsEmp, ssEmployer: totalSsEmpr,
        incomeTax: totalPit, otherDeductions: totalOther, net: totalNet,
      });
      assertBalanced(jl);
      const codes = Array.from(new Set(jl.map((l) => l.accountCode)));
      const accounts = await tx.account.findMany({
        where: { tenantId: session.tenantId, code: { in: codes } },
        select: { id: true, code: true },
      });
      const map = new Map(accounts.map((a) => [a.code, a.id]));
      const journal = await tx.journal.create({
        data: {
          tenantId: session.tenantId,
          reference: `JV-PAY-${parsed.data.period}`,
          date: new Date(),
          source: 'PAYROLL',
          memo: `Payroll for ${parsed.data.period}`,
          isPosted: true,
          postedAt: new Date(),
          lines: {
            create: jl.map((l) => {
              const accountId = map.get(l.accountCode);
              if (!accountId) throw new Error(`Account ${l.accountCode} not in COA`);
              return {
                accountId,
                debit: new Prisma.Decimal(String(l.debit ?? 0)),
                credit: new Prisma.Decimal(String(l.credit ?? 0)),
                memo: l.memo,
              };
            }),
          },
        },
      });
      await tx.payrollRun.update({ where: { id: created.id }, data: { postedJournalId: journal.id } });
    }

    return created;
  });

  return NextResponse.json({
    data: run,
    totals: {
      gross: totalGross.toString(), ssEmployee: totalSsEmp.toString(),
      ssEmployer: totalSsEmpr.toString(), incomeTax: totalPit.toString(),
      net: totalNet.toString(),
    },
  }, { status: 201 });
}
