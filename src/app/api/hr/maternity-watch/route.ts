/**
 * Maternity-leave return-to-work watcher.
 *
 * Iraqi Labor Law grants female employees 98 days of paid maternity leave.
 * This endpoint lists employees currently on maternity leave and surfaces
 * the projected return-to-work date so HR can plan.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

export async function GET() {
  const session = await requireSession();
  const now = new Date();

  const rows = await db.leaveRequest.findMany({
    where: {
      tenantId: session.tenantId,
      status: 'APPROVED',
      leaveType: { code: 'MATERNITY' },
      endDate: { gte: now },
    },
    include: { leaveType: true },
    orderBy: { endDate: 'asc' },
    take: 200,
  });

  const employeeIds = Array.from(new Set(rows.map((r) => r.employeeId)));
  const employees = await db.employee.findMany({
    where: { tenantId: session.tenantId, id: { in: employeeIds } },
    select: { id: true, empNo: true, fullNameAr: true, fullNameEn: true, jobTitle: true, department: true },
  });
  const emap = new Map(employees.map((e) => [e.id, e]));

  return NextResponse.json({
    data: rows.map((r) => {
      const e = emap.get(r.employeeId);
      const daysToReturn = Math.ceil((r.endDate.getTime() - now.getTime()) / 86_400_000);
      return {
        leaveRequestId: r.id,
        employeeId: r.employeeId,
        empNo: e?.empNo,
        fullNameAr: e?.fullNameAr,
        fullNameEn: e?.fullNameEn,
        jobTitle: e?.jobTitle,
        department: e?.department,
        startDate: r.startDate.toISOString().slice(0, 10),
        returnDate: r.endDate.toISOString().slice(0, 10),
        daysToReturn,
        daysToReturnBucket: daysToReturn <= 7 ? 'this_week' : daysToReturn <= 30 ? 'this_month' : 'later',
      };
    }),
  });
}
