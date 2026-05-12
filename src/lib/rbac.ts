/**
 * Role-Based Access Control (RBAC) — Permission checking
 * Validates: Persyaratan 9.2, 9.3, 9.4, 9.5
 *
 * Matriks RBAC:
 * - Owner: full access (read, write, delete) pada semua resource
 * - HR Staff: read+write pada employees, payroll, export, profile, my_payslips.
 *            TANPA delete employees. TANPA akses settings, audit, user_management.
 * - Regular Staff: read only pada profile dan my_payslips. TANPA akses lainnya.
 */

import type { UserRole, Resource, Action } from '@/types/auth';

/**
 * Matriks permission: role → resource → action[]
 * Jika action tidak ada di array, berarti ditolak.
 */
const PERMISSION_MATRIX: Record<UserRole, Partial<Record<Resource, Action[]>>> = {
  owner: {
    employees: ['read', 'write', 'delete'],
    payroll: ['read', 'write', 'delete'],
    export: ['read', 'write', 'delete'],
    settings: ['read', 'write', 'delete'],
    audit: ['read', 'write', 'delete'],
    user_management: ['read', 'write', 'delete'],
    profile: ['read', 'write', 'delete'],
    my_payslips: ['read', 'write', 'delete'],
  },
  hr_staff: {
    employees: ['read', 'write'],
    payroll: ['read', 'write'],
    export: ['read', 'write'],
    profile: ['read', 'write'],
    my_payslips: ['read', 'write'],
  },
  regular_staff: {
    profile: ['read'],
    my_payslips: ['read'],
  },
};

/**
 * Cek apakah role tertentu memiliki izin untuk melakukan action pada resource.
 *
 * @param role - Peran pengguna (owner | hr_staff | regular_staff)
 * @param resource - Resource yang ingin diakses
 * @param action - Aksi yang ingin dilakukan (read | write | delete)
 * @returns true jika diizinkan, false jika ditolak
 */
export function checkPermission(role: UserRole, resource: Resource, action: Action): boolean {
  const rolePermissions = PERMISSION_MATRIX[role];
  if (!rolePermissions) {
    return false;
  }

  const allowedActions = rolePermissions[resource];
  if (!allowedActions) {
    return false;
  }

  return allowedActions.includes(action);
}

/**
 * Mendapatkan semua resource yang dapat diakses oleh role tertentu.
 * Berguna untuk menentukan menu navigasi yang ditampilkan.
 */
export function getAccessibleResources(role: UserRole): Resource[] {
  const rolePermissions = PERMISSION_MATRIX[role];
  if (!rolePermissions) {
    return [];
  }
  return Object.keys(rolePermissions) as Resource[];
}

/**
 * Mendapatkan semua action yang diizinkan untuk role pada resource tertentu.
 */
export function getAllowedActions(role: UserRole, resource: Resource): Action[] {
  const rolePermissions = PERMISSION_MATRIX[role];
  if (!rolePermissions) {
    return [];
  }
  return rolePermissions[resource] ?? [];
}
