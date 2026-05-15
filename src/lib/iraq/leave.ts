/**
 * Leave management — Iraqi Labor Law defaults.
 * Iraqi private-sector typical entitlements (verify per sector).
 */

import type { PrismaClient } from '@prisma/client';

export const IRAQ_DEFAULT_LEAVE_TYPES = [
  { code: 'ANNUAL',    nameAr: 'إجازة سنوية',     nameEn: 'Annual',     annualEntitlement: 20, carryForward: true,  paid: true },
  { code: 'SICK',      nameAr: 'إجازة مرضية',      nameEn: 'Sick',       annualEntitlement: 30, carryForward: false, paid: true },
  { code: 'HAJJ',      nameAr: 'إجازة حج',         nameEn: 'Hajj',       annualEntitlement: 0,  carryForward: false, paid: true },
  { code: 'MATERNITY', nameAr: 'إجازة أمومة',      nameEn: 'Maternity',  annualEntitlement: 98, carryForward: false, paid: true },
  { code: 'PATERNITY', nameAr: 'إجازة أبوة',       nameEn: 'Paternity',  annualEntitlement: 3,  carryForward: false, paid: true },
  { code: 'BEREAVEMENT', nameAr: 'إجازة وفاة',     nameEn: 'Bereavement', annualEntitlement: 3, carryForward: false, paid: true },
  { code: 'UNPAID',    nameAr: 'إجازة بدون أجر',   nameEn: 'Unpaid',     annualEntitlement: 0,  carryForward: false, paid: false },
] as const;

/** Sun-Thu working days, inclusive. Iraqi weekend: Fri+Sat. */
export function workingDaysIQ(start: Date, end: Date): number {
  if (end < start) return 0;
  let count = 0;
  const d = new Date(start);
  while (d <= end) {
    const day = d.getUTCDay();
    if (day !== 5 && day !== 6) count++;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return count;
}

export async function seedIraqLeaveTypes(db: PrismaClient, tenantId: string): Promise<number> {
  let n = 0;
  for (const t of IRAQ_DEFAULT_LEAVE_TYPES) {
    const existing = await db.leaveType.findUnique({
      where: { tenantId_code: { tenantId, code: t.code } },
    });
    if (existing) continue;
    await db.leaveType.create({ data: { tenantId, ...t } });
    n++;
  }
  return n;
}

export async function accrueAnnualEntitlements(
  db: PrismaClient, tenantId: string, year: number = new Date().getUTCFullYear()
): Promise<number> {
  const employees = await db.employee.findMany({
    where: { tenantId, isActive: true, deletedAt: null },
    select: { id: true },
  });
  const types = await db.leaveType.findMany({
    where: { tenantId, isActive: true, annualEntitlement: { gt: 0 } },
  });
  let granted = 0;
  for (const e of employees) {
    for (const t of types) {
      let carriedIn = 0;
      if (t.carryForward) {
        const prev = await db.leaveBalance.findUnique({
          where: { tenantId_employeeId_leaveTypeId_year: { tenantId, employeeId: e.id, leaveTypeId: t.id, year: year - 1 } },
        });
        if (prev) carriedIn = Math.max(0, prev.entitled + prev.carriedIn - prev.used);
      }
      await db.leaveBalance.upsert({
        where: { tenantId_employeeId_leaveTypeId_year: { tenantId, employeeId: e.id, leaveTypeId: t.id, year } },
        create: { tenantId, employeeId: e.id, leaveTypeId: t.id, year, entitled: t.annualEntitlement, used: 0, carriedIn },
        update: { entitled: t.annualEntitlement, carriedIn },
      });
      granted++;
    }
  }
  return granted;
}
