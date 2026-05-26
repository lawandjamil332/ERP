import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { computeEosi } from '@/lib/iraq/eosi';

const Body = z.object({
  employeeId: z.string(),
  endDate: z.string(),
  reason: z.enum(['RESIGNATION', 'TERMINATION_WITHOUT_CAUSE', 'TERMINATION_FOR_CAUSE', 'DEATH_OR_DISABILITY', 'END_OF_CONTRACT']),
  /** Override the saved monthly salary if needed (e.g. last salary differed). */
  lastMonthlySalary: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await requireSession();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }
  const emp = await db.employee.findFirst({
    where: { id: parsed.data.employeeId, tenantId: session.tenantId },
  });
  if (!emp) return NextResponse.json({ error: 'employee_not_found' }, { status: 404 });

  const result = computeEosi({
    hireDate: emp.hireDate,
    endDate: new Date(parsed.data.endDate),
    lastMonthlySalary: parsed.data.lastMonthlySalary ?? emp.baseSalary.toString(),
    reason: parsed.data.reason,
  });

  return NextResponse.json({
    employee: {
      id: emp.id, empNo: emp.empNo,
      fullNameAr: emp.fullNameAr, fullNameEn: emp.fullNameEn,
      hireDate: emp.hireDate, baseSalary: emp.baseSalary.toString(),
    },
    ...result,
  });
}
