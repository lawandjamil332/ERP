import { describe, it, expect } from 'vitest';
import { can, permissionsForRole } from './permissions';

describe('RBAC — built-in role matrix', () => {
  it('OWNER and ADMIN can do everything', () => {
    for (const role of ['OWNER', 'ADMIN']) {
      expect(can(role, 'users', 'delete')).toBe(true);
      expect(can(role, 'accounting', 'post')).toBe(true);
      expect(can(role, 'pos', 'view')).toBe(true);
    }
  });

  it('ACCOUNTANT controls finance/accounting but not user management', () => {
    expect(can('ACCOUNTANT', 'accounting', 'post')).toBe(true);
    expect(can('ACCOUNTANT', 'finance', 'edit')).toBe(true);
    expect(can('ACCOUNTANT', 'users', 'create')).toBe(false);
    expect(can('ACCOUNTANT', 'users', 'view')).toBe(false);
  });

  it('SALES can create sales + use POS but cannot touch accounting', () => {
    expect(can('SALES', 'sales', 'create')).toBe(true);
    expect(can('SALES', 'pos', 'create')).toBe(true);
    expect(can('SALES', 'accounting', 'view')).toBe(false);
    expect(can('SALES', 'inventory', 'edit')).toBe(false); // view-only
    expect(can('SALES', 'inventory', 'view')).toBe(true);
  });

  it('CASHIER is POS-focused, cannot delete sales', () => {
    expect(can('CASHIER', 'pos', 'post')).toBe(true);
    expect(can('CASHIER', 'sales', 'create')).toBe(true);
    expect(can('CASHIER', 'sales', 'delete')).toBe(false);
    expect(can('CASHIER', 'accounting', 'view')).toBe(false);
  });

  it('AUDITOR_READONLY can view everything but mutate nothing', () => {
    const sections = ['sales', 'purchases', 'accounting', 'finance', 'hr', 'payroll', 'reports', 'users'] as const;
    for (const s of sections) {
      expect(can('AUDITOR_READONLY', s, 'view')).toBe(true);
      expect(can('AUDITOR_READONLY', s, 'create')).toBe(false);
      expect(can('AUDITOR_READONLY', s, 'edit')).toBe(false);
      expect(can('AUDITOR_READONLY', s, 'delete')).toBe(false);
      expect(can('AUDITOR_READONLY', s, 'post')).toBe(false);
    }
  });

  it('HR cannot post journal entries', () => {
    expect(can('HR', 'hr', 'create')).toBe(true);
    expect(can('HR', 'payroll', 'post')).toBe(true);
    expect(can('HR', 'accounting', 'post')).toBe(false);
  });

  it('unknown role is denied everything (fail-closed)', () => {
    expect(can('RANDOM', 'sales', 'view')).toBe(false);
    expect(permissionsForRole('RANDOM')).toEqual({});
  });

  it('permissionsForRole returns a usable matrix for the UI', () => {
    const m = permissionsForRole('SALES');
    expect(m.sales).toContain('create');
    expect(m.inventory).toEqual(['view']);
  });
});
