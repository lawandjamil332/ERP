import { NextResponse } from 'next/server';
import { verifySession, type SessionPayload } from './session';

export type Section =
  | 'sales' | 'purchases' | 'inventory' | 'manufacturing' | 'accounting'
  | 'finance' | 'hr' | 'payroll' | 'pos' | 'reports' | 'settings' | 'users';

export type Action = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'post';

const ALL: Action[] = ['view', 'create', 'edit', 'delete', 'approve', 'post'];
const VIEW: Action[] = ['view'];
const RW: Action[] = ['view', 'create', 'edit'];
const RWP: Action[] = ['view', 'create', 'edit', 'post'];

type Matrix = Partial<Record<Section, Action[]>>;

/** Default permission matrix for built-in roles. Custom roles override via DB. */
const ROLE_MATRIX: Record<string, Matrix> = {
  OWNER: fullAccess(),
  ADMIN: fullAccess(),
  ACCOUNTANT: {
    accounting: ALL, finance: ALL, reports: ALL,
    sales: RWP, purchases: RWP, payroll: RWP,
    inventory: VIEW, manufacturing: VIEW, settings: VIEW,
  },
  SALES: {
    sales: ALL, pos: ALL, reports: VIEW,
    inventory: VIEW, finance: VIEW,
  },
  PURCHASES: {
    purchases: ALL, reports: VIEW, inventory: RW, finance: VIEW,
  },
  INVENTORY: {
    inventory: ALL, manufacturing: ALL, reports: VIEW,
  },
  HR: {
    hr: ALL, payroll: ALL, reports: VIEW,
  },
  CASHIER: {
    pos: ALL, sales: RW, inventory: VIEW,
  },
  STAFF: {
    sales: VIEW, inventory: VIEW, reports: VIEW,
  },
  AUDITOR_READONLY: {
    sales: VIEW, purchases: VIEW, inventory: VIEW, manufacturing: VIEW,
    accounting: VIEW, finance: VIEW, hr: VIEW, payroll: VIEW,
    pos: VIEW, reports: VIEW, settings: VIEW, users: VIEW,
  },
};

function fullAccess(): Matrix {
  const m: Matrix = {};
  const sections: Section[] = ['sales', 'purchases', 'inventory', 'manufacturing', 'accounting', 'finance', 'hr', 'payroll', 'pos', 'reports', 'settings', 'users'];
  for (const s of sections) m[s] = ALL;
  return m;
}

/** Pure check — does this role permit the action on the section? */
export function can(role: string, section: Section, action: Action): boolean {
  const matrix = ROLE_MATRIX[role];
  if (!matrix) return false;
  return matrix[section]?.includes(action) ?? false;
}

/** Returns the full permission map for a role (used by the UI to pre-fill matrices). */
export function permissionsForRole(role: string): Matrix {
  return ROLE_MATRIX[role] ?? {};
}

/**
 * API guard. Use at the top of a route handler:
 *
 *   const guard = await requirePermission('users', 'create');
 *   if (guard instanceof NextResponse) return guard;
 *   const session = guard; // typed SessionPayload
 */
export async function requirePermission(
  section: Section,
  action: Action,
): Promise<SessionPayload | NextResponse> {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!can(session.role, section, action)) {
    return NextResponse.json(
      { error: 'forbidden', detail: `Role ${session.role} lacks ${action} on ${section}` },
      { status: 403 },
    );
  }
  return session;
}
