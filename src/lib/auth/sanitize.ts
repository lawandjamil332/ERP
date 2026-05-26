import type { SessionPayload } from './session';

const PAYROLL_VIEW_ROLES = new Set(['OWNER', 'ADMIN', 'HR', 'ACCOUNTANT', 'AUDITOR_READONLY']);
const EMPLOYEE_SENSITIVE = ['baseSalary', 'nationalId', 'ssNumber', 'dateOfBirth'] as const;
const PAYROLL_LINE_SENSITIVE = [
  'baseSalary', 'allowances', 'overtime', 'bonuses', 'gross',
  'ssEmployee', 'ssEmployer', 'incomeTax', 'otherDeductions', 'net',
] as const;

export function canSeePayroll(session: SessionPayload | null): boolean {
  return !!session && PAYROLL_VIEW_ROLES.has(session.role);
}

export function sanitizeEmployee<T extends Record<string, any>>(emp: T | null, session: SessionPayload | null): T | null {
  if (!emp) return emp;
  if (canSeePayroll(session)) return emp;
  const out: any = { ...emp };
  for (const f of EMPLOYEE_SENSITIVE) out[f] = null;
  return out;
}

export function sanitizeEmployees<T extends Record<string, any>>(list: T[], session: SessionPayload | null): T[] {
  return list.map((e) => sanitizeEmployee(e, session)!);
}

export function sanitizePayrollLine<T extends Record<string, any>>(line: T | null, session: SessionPayload | null): T | null {
  if (!line) return line;
  if (canSeePayroll(session)) return line;
  const out: any = { ...line };
  for (const f of PAYROLL_LINE_SENSITIVE) out[f] = null;
  return out;
}
