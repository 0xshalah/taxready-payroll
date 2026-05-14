/**
 * Unit tests untuk RBAC permission checking
 * Validates: Persyaratan 9.2, 9.3, 9.4, 9.5
 */

import { describe, it, expect } from 'vitest';
import { checkPermission, getAccessibleResources, getAllowedActions } from './rbac';
import type { UserRole, Resource, Action } from '@/types/auth';

describe('checkPermission', () => {
  describe('Owner — full access', () => {
    const role: UserRole = 'owner';

    it('dapat read, write, delete pada employees', () => {
      expect(checkPermission(role, 'employees', 'read')).toBe(true);
      expect(checkPermission(role, 'employees', 'write')).toBe(true);
      expect(checkPermission(role, 'employees', 'delete')).toBe(true);
    });

    it('dapat read, write, delete pada payroll', () => {
      expect(checkPermission(role, 'payroll', 'read')).toBe(true);
      expect(checkPermission(role, 'payroll', 'write')).toBe(true);
      expect(checkPermission(role, 'payroll', 'delete')).toBe(true);
    });

    it('dapat read, write, delete pada settings', () => {
      expect(checkPermission(role, 'settings', 'read')).toBe(true);
      expect(checkPermission(role, 'settings', 'write')).toBe(true);
      expect(checkPermission(role, 'settings', 'delete')).toBe(true);
    });

    it('dapat read, write, delete pada audit', () => {
      expect(checkPermission(role, 'audit', 'read')).toBe(true);
      expect(checkPermission(role, 'audit', 'write')).toBe(true);
      expect(checkPermission(role, 'audit', 'delete')).toBe(true);
    });

    it('dapat read, write, delete pada user_management', () => {
      expect(checkPermission(role, 'user_management', 'read')).toBe(true);
      expect(checkPermission(role, 'user_management', 'write')).toBe(true);
      expect(checkPermission(role, 'user_management', 'delete')).toBe(true);
    });

    it('dapat read, write, delete pada export', () => {
      expect(checkPermission(role, 'export', 'read')).toBe(true);
      expect(checkPermission(role, 'export', 'write')).toBe(true);
      expect(checkPermission(role, 'export', 'delete')).toBe(true);
    });

    it('dapat akses profile dan my_payslips', () => {
      expect(checkPermission(role, 'profile', 'read')).toBe(true);
      expect(checkPermission(role, 'my_payslips', 'read')).toBe(true);
    });
  });

  describe('HR Staff — read+write tanpa delete employees, tanpa settings/audit/user_management', () => {
    const role: UserRole = 'hr_staff';

    it('dapat read dan write pada employees', () => {
      expect(checkPermission(role, 'employees', 'read')).toBe(true);
      expect(checkPermission(role, 'employees', 'write')).toBe(true);
    });

    it('TIDAK dapat delete employees', () => {
      expect(checkPermission(role, 'employees', 'delete')).toBe(false);
    });

    it('dapat read dan write pada payroll', () => {
      expect(checkPermission(role, 'payroll', 'read')).toBe(true);
      expect(checkPermission(role, 'payroll', 'write')).toBe(true);
    });

    it('dapat read dan write pada export', () => {
      expect(checkPermission(role, 'export', 'read')).toBe(true);
      expect(checkPermission(role, 'export', 'write')).toBe(true);
    });

    it('TIDAK dapat akses settings', () => {
      expect(checkPermission(role, 'settings', 'read')).toBe(false);
      expect(checkPermission(role, 'settings', 'write')).toBe(false);
    });

    it('TIDAK dapat akses audit', () => {
      expect(checkPermission(role, 'audit', 'read')).toBe(false);
    });

    it('TIDAK dapat akses user_management', () => {
      expect(checkPermission(role, 'user_management', 'read')).toBe(false);
      expect(checkPermission(role, 'user_management', 'write')).toBe(false);
    });

    it('dapat akses profile dan my_payslips', () => {
      expect(checkPermission(role, 'profile', 'read')).toBe(true);
      expect(checkPermission(role, 'profile', 'write')).toBe(true);
      expect(checkPermission(role, 'my_payslips', 'read')).toBe(true);
    });
  });

  describe('Regular Staff — read only pada profile dan my_payslips', () => {
    const role: UserRole = 'regular_staff';

    it('dapat read profile', () => {
      expect(checkPermission(role, 'profile', 'read')).toBe(true);
    });

    it('TIDAK dapat write profile', () => {
      expect(checkPermission(role, 'profile', 'write')).toBe(false);
    });

    it('dapat read my_payslips', () => {
      expect(checkPermission(role, 'my_payslips', 'read')).toBe(true);
    });

    it('TIDAK dapat write my_payslips', () => {
      expect(checkPermission(role, 'my_payslips', 'write')).toBe(false);
    });

    it('TIDAK dapat akses employees', () => {
      expect(checkPermission(role, 'employees', 'read')).toBe(false);
      expect(checkPermission(role, 'employees', 'write')).toBe(false);
      expect(checkPermission(role, 'employees', 'delete')).toBe(false);
    });

    it('TIDAK dapat akses payroll', () => {
      expect(checkPermission(role, 'payroll', 'read')).toBe(false);
    });

    it('TIDAK dapat akses export', () => {
      expect(checkPermission(role, 'export', 'read')).toBe(false);
    });

    it('TIDAK dapat akses settings', () => {
      expect(checkPermission(role, 'settings', 'read')).toBe(false);
    });

    it('TIDAK dapat akses audit', () => {
      expect(checkPermission(role, 'audit', 'read')).toBe(false);
    });

    it('TIDAK dapat akses user_management', () => {
      expect(checkPermission(role, 'user_management', 'read')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('menolak role yang tidak valid', () => {
      expect(checkPermission('invalid_role' as UserRole, 'employees', 'read')).toBe(false);
    });

    it('menolak resource yang tidak valid', () => {
      expect(checkPermission('owner', 'invalid_resource' as Resource, 'read')).toBe(false);
    });

    it('menolak action yang tidak valid', () => {
      expect(checkPermission('owner', 'employees', 'invalid_action' as Action)).toBe(false);
    });
  });
});

describe('getAccessibleResources', () => {
  it('Owner dapat akses semua 9 resource', () => {
    const resources = getAccessibleResources('owner');
    expect(resources).toHaveLength(9);
    expect(resources).toContain('employees');
    expect(resources).toContain('payroll');
    expect(resources).toContain('export');
    expect(resources).toContain('settings');
    expect(resources).toContain('audit');
    expect(resources).toContain('user_management');
    expect(resources).toContain('profile');
    expect(resources).toContain('my_payslips');
    expect(resources).toContain('tarif_changelog');
  });

  it('HR Staff dapat akses 6 resource', () => {
    const resources = getAccessibleResources('hr_staff');
    expect(resources).toHaveLength(6);
    expect(resources).toContain('employees');
    expect(resources).toContain('payroll');
    expect(resources).toContain('export');
    expect(resources).toContain('profile');
    expect(resources).toContain('my_payslips');
    expect(resources).toContain('tarif_changelog');
  });

  it('Regular Staff hanya dapat akses 2 resource', () => {
    const resources = getAccessibleResources('regular_staff');
    expect(resources).toHaveLength(2);
    expect(resources).toContain('profile');
    expect(resources).toContain('my_payslips');
  });

  it('Role tidak valid mengembalikan array kosong', () => {
    expect(getAccessibleResources('invalid' as UserRole)).toEqual([]);
  });
});

describe('getAllowedActions', () => {
  it('Owner mendapat read, write, delete pada employees', () => {
    const actions = getAllowedActions('owner', 'employees');
    expect(actions).toEqual(['read', 'write', 'delete']);
  });

  it('HR Staff mendapat read, write pada employees (tanpa delete)', () => {
    const actions = getAllowedActions('hr_staff', 'employees');
    expect(actions).toEqual(['read', 'write']);
  });

  it('Regular Staff mendapat read saja pada profile', () => {
    const actions = getAllowedActions('regular_staff', 'profile');
    expect(actions).toEqual(['read']);
  });

  it('HR Staff tidak punya akses ke settings → array kosong', () => {
    const actions = getAllowedActions('hr_staff', 'settings');
    expect(actions).toEqual([]);
  });
});
