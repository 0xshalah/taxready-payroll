/**
 * Audit Logger — Pencatatan aktivitas ke tabel audit_logs
 * Validates: Persyaratan 10.1, 10.2, 10.7, 9.5
 *
 * Digunakan oleh ProtectedRoute untuk mencatat unauthorized access,
 * dan oleh modul lain untuk mencatat aktivitas penting.
 */

import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/auth';

export type AuditActionType =
  | 'payroll_process'
  | 'employee_create'
  | 'employee_update'
  | 'employee_delete'
  | 'salary_change'
  | 'export_document'
  | 'settings_change'
  | 'role_change'
  | 'unauthorized_access';

export interface AuditLogEntry {
  company_id: string;
  user_id: string;
  user_role: UserRole;
  action_type: AuditActionType;
  entity_type: string;
  entity_id?: string;
  changes?: Record<string, unknown>;
}

/**
 * Catat entri audit ke tabel audit_logs.
 * Tidak melempar error jika pencatatan gagal — hanya log ke console.
 * Gunakan logAuditEntryStrict() untuk operasi kritis yang HARUS tercatat.
 */
export async function logAuditEntry(entry: AuditLogEntry): Promise<void> {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      company_id: entry.company_id,
      user_id: entry.user_id,
      user_role: entry.user_role,
      action_type: entry.action_type,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      changes: entry.changes ?? null,
    });

    if (error) {
      console.error('[AuditLogger] Gagal mencatat audit log:', error.message);
    }
  } catch (err) {
    console.error('[AuditLogger] Exception saat mencatat audit log:', err);
  }
}

/**
 * Catat entri audit STRICT — melempar error jika pencatatan gagal.
 * Gunakan untuk operasi kritis (payroll, salary change, role change)
 * di mana operasi HARUS dibatalkan jika audit gagal dicatat.
 *
 * @throws Error jika audit log gagal ditulis
 */
export async function logAuditEntryStrict(entry: AuditLogEntry): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    company_id: entry.company_id,
    user_id: entry.user_id,
    user_role: entry.user_role,
    action_type: entry.action_type,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id ?? null,
    changes: entry.changes ?? null,
  });

  if (error) {
    throw new Error(`[AuditLogger] Operasi dibatalkan — gagal mencatat audit log: ${error.message}`);
  }
}

/**
 * Catat percobaan akses tidak sah (unauthorized access).
 * Dipanggil oleh ProtectedRoute ketika user tidak memiliki izin.
 */
export async function logUnauthorizedAccess(params: {
  userId: string;
  companyId: string;
  userRole: UserRole;
  attemptedResource: string;
  attemptedAction?: string;
}): Promise<void> {
  await logAuditEntry({
    company_id: params.companyId,
    user_id: params.userId,
    user_role: params.userRole,
    action_type: 'unauthorized_access',
    entity_type: params.attemptedResource,
    changes: {
      attempted_resource: params.attemptedResource,
      attempted_action: params.attemptedAction ?? 'access',
      timestamp: new Date().toISOString(),
    },
  });
}

// ============================================================
// Helper Functions untuk Pencatatan Otomatis
// Validates: Persyaratan 10.1, 10.7
// ============================================================

/**
 * Catat proses penggajian (payroll_process).
 * STRICT: Melempar error jika audit gagal — payroll HARUS tercatat.
 */
export async function logPayrollProcess(params: {
  userId: string;
  companyId: string;
  userRole: UserRole;
  periodId: string;
  periodMonth: number;
  periodYear: number;
  employeeCount: number;
  totalNetPay: number;
}): Promise<void> {
  await logAuditEntryStrict({
    company_id: params.companyId,
    user_id: params.userId,
    user_role: params.userRole,
    action_type: 'payroll_process',
    entity_type: 'payroll_period',
    entity_id: params.periodId,
    changes: {
      period: `${params.periodYear}-${String(params.periodMonth).padStart(2, '0')}`,
      employee_count: params.employeeCount,
      total_net_pay: params.totalNetPay,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Catat perubahan data karyawan (employee CRUD).
 */
export async function logEmployeeChange(params: {
  userId: string;
  companyId: string;
  userRole: UserRole;
  action: 'employee_create' | 'employee_update' | 'employee_delete';
  employeeId: string;
  employeeName: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
}): Promise<void> {
  await logAuditEntry({
    company_id: params.companyId,
    user_id: params.userId,
    user_role: params.userRole,
    action_type: params.action,
    entity_type: 'employee',
    entity_id: params.employeeId,
    changes: {
      employee_name: params.employeeName,
      field_changes: params.changes ?? null,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Catat perubahan gaji karyawan (salary_change).
 * STRICT: Melempar error jika audit gagal — perubahan gaji HARUS tercatat.
 * Dicatat terpisah dari employee_update karena merupakan data sensitif.
 */
export async function logSalaryChange(params: {
  userId: string;
  companyId: string;
  userRole: UserRole;
  employeeId: string;
  employeeName: string;
  oldSalary: number;
  newSalary: number;
}): Promise<void> {
  await logAuditEntryStrict({
    company_id: params.companyId,
    user_id: params.userId,
    user_role: params.userRole,
    action_type: 'salary_change',
    entity_type: 'employee',
    entity_id: params.employeeId,
    changes: {
      employee_name: params.employeeName,
      gaji_pokok: { old: params.oldSalary, new: params.newSalary },
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Catat ekspor dokumen (export_document).
 */
export async function logExportDocument(params: {
  userId: string;
  companyId: string;
  userRole: UserRole;
  exportType: 'csv' | 'xml' | 'pdf_bpa1';
  periodMonth: number;
  periodYear: number;
  fileName: string;
}): Promise<void> {
  await logAuditEntry({
    company_id: params.companyId,
    user_id: params.userId,
    user_role: params.userRole,
    action_type: 'export_document',
    entity_type: 'export',
    changes: {
      export_type: params.exportType,
      period: `${params.periodYear}-${String(params.periodMonth).padStart(2, '0')}`,
      file_name: params.fileName,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Catat perubahan pengaturan sistem (settings_change).
 */
export async function logSettingsChange(params: {
  userId: string;
  companyId: string;
  userRole: UserRole;
  settingType: 'ter_rates' | 'bpjs_config';
  changes: Record<string, { old: unknown; new: unknown }>;
}): Promise<void> {
  await logAuditEntry({
    company_id: params.companyId,
    user_id: params.userId,
    user_role: params.userRole,
    action_type: 'settings_change',
    entity_type: params.settingType,
    changes: {
      field_changes: params.changes,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Catat perubahan peran pengguna (role_change).
 * STRICT: Melempar error jika audit gagal — perubahan role HARUS tercatat.
 */
export async function logRoleChange(params: {
  userId: string;
  companyId: string;
  userRole: UserRole;
  targetUserId: string;
  targetUserName: string;
  oldRole: UserRole;
  newRole: UserRole;
}): Promise<void> {
  await logAuditEntryStrict({
    company_id: params.companyId,
    user_id: params.userId,
    user_role: params.userRole,
    action_type: 'role_change',
    entity_type: 'user',
    entity_id: params.targetUserId,
    changes: {
      target_user_name: params.targetUserName,
      role: { old: params.oldRole, new: params.newRole },
      timestamp: new Date().toISOString(),
    },
  });
}
