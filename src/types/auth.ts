/**
 * Type definitions untuk modul autentikasi dan RBAC
 * Validates: Persyaratan 9.1, 9.2, 9.3, 9.4
 */

/** Peran pengguna dalam sistem */
export type UserRole = 'owner' | 'hr_staff' | 'regular_staff';

/** Resource yang dapat diakses */
export type Resource =
  | 'employees'
  | 'payroll'
  | 'export'
  | 'settings'
  | 'audit'
  | 'user_management'
  | 'profile'
  | 'my_payslips'
  | 'tarif_changelog';

/** Aksi yang dapat dilakukan pada resource */
export type Action = 'read' | 'write' | 'delete';

/** Permission = kombinasi resource + action */
export interface Permission {
  resource: Resource;
  action: Action;
}

/** Data user dari database */
export interface User {
  id: string;
  company_id: string;
  email: string;
  nama: string;
  role: UserRole;
  created_at: string;
}

/** State autentikasi */
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

/** Kredensial login */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Data registrasi perusahaan baru */
export interface RegisterData {
  email: string;
  password: string;
  nama: string;
  nama_perusahaan: string;
  npwp_badan: string;
  alamat?: string;
  jkk_risk_class?: number;
}
