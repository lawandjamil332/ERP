/**
 * Role-based access control. Each role has a set of granted actions.
 * Used by API routes and server components to authorize sensitive operations.
 */

import { requireSession, type SessionPayload } from './session';

export type Action =
  | 'invoice:create' | 'invoice:post' | 'invoice:void'
  | 'bill:create'    | 'bill:post'    | 'bill:void'
  | 'payment:create'
  | 'payroll:run'    | 'payroll:post'
  | 'employee:edit'  | 'employee:create'
  | 'contact:edit'   | 'contact:create'
  | 'product:edit'   | 'product:create'
  | 'account:edit'   | 'journal:manual'
  | 'tenant:settings'
  | 'audit:view'     | 'reports:view'  | 'pos:operate';

const ALL: Action[] = [
  'invoice:create','invoice:post','invoice:void',
  'bill:create','bill:post','bill:void',
  'payment:create',
  'payroll:run','payroll:post',
  'employee:edit','employee:create',
  'contact:edit','contact:create',
  'product:edit','product:create',
  'account:edit','journal:manual',
  'tenant:settings',
  'audit:view','reports:view','pos:operate',
];

export const ROLE_GRANTS: Record<string, Action[]> = {
  OWNER: ALL,
  ADMIN: ALL,
  ACCOUNTANT: [
    'invoice:create','invoice:post',
    'bill:create','bill:post',
    'payment:create',
    'journal:manual','account:edit',
    'reports:view','audit:view',
  ],
  SALES:      ['invoice:create','contact:create','contact:edit','reports:view'],
  PURCHASES:  ['bill:create','contact:create','contact:edit','reports:view'],
  INVENTORY:  ['product:create','product:edit','reports:view'],
  HR:         ['employee:create','employee:edit','payroll:run','payroll:post','reports:view'],
  CASHIER:    ['pos:operate','payment:create'],
  STAFF:      [],
  AUDITOR_READONLY: ['reports:view','audit:view'],
};

export function can(session: SessionPayload | null, action: Action): boolean {
  if (!session) return false;
  return (ROLE_GRANTS[session.role] ?? []).includes(action);
}

export async function authorize(action: Action): Promise<SessionPayload> {
  const session = await requireSession();
  if (!can(session, action)) {
    const err = new Error(`forbidden: ${action}`);
    (err as any).status = 403;
    throw err;
  }
  return session;
}
