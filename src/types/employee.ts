/**
 * Type definitions untuk modul karyawan
 * Validates: Persyaratan 1.5, 2.2, 2.3
 */

/** Status PTKP (Penghasilan Tidak Kena Pajak) */
export type PTKPStatus =
  | 'TK/0'
  | 'TK/1'
  | 'TK/2'
  | 'TK/3'
  | 'K/0'
  | 'K/1'
  | 'K/2'
  | 'K/3';

/** Data karyawan dari database (setelah dekripsi) */
export interface Employee {
  id: string;
  company_id: string;
  nik: string;
  nama_lengkap: string;
  ptkp_status: PTKPStatus;
  tanggal_bergabung: string; // ISO date string YYYY-MM-DD
  jabatan: string;
  gaji_pokok: number;
  tunjangan_tetap: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Data form input karyawan (untuk create/update) */
export interface EmployeeFormData {
  nik: string;
  nama_lengkap: string;
  ptkp_status: PTKPStatus;
  tanggal_bergabung: string; // ISO date string YYYY-MM-DD
  jabatan: string;
  gaji_pokok: number;
  tunjangan_tetap: number;
}
