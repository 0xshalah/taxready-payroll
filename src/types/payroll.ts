/**
 * Type definitions untuk modul payroll (PPh 21, BPJS, Batch Processing)
 * Validates: Persyaratan 2.1, 2.2, 2.4, 2.5, 3.1, 3.2, 4.1, 4.2
 */

import type { PTKPStatus } from './employee';

/** Kategori TER (Tarif Efektif Rata-rata) */
export type TERCategory = 'A' | 'B' | 'C';

/** Tarif TER dari tabel konfigurasi */
export interface TERRate {
  id: string;
  category: TERCategory;
  lower_bound: number; // Batas bawah bruto (Rp)
  upper_bound: number; // Batas atas bruto (Rp)
  rate_percent: number; // Persentase TER (misal: 2.5)
}

/** Input untuk perhitungan PPh 21 */
export interface PPh21Input {
  gross_income: number; // Penghasilan bruto
  ptkp_status: PTKPStatus; // Status PTKP karyawan
}

/** Hasil perhitungan PPh 21 */
export interface PPh21Result {
  ter_category: TERCategory;
  ter_rate_percent: number;
  pph21_amount: number; // Hasil PPh 21 (dibulatkan ke bawah)
}

/** Konfigurasi tarif BPJS per perusahaan */
export interface BPJSConfig {
  jht_employer_rate: number; // default 3.7%
  jht_employee_rate: number; // default 2%
  jp_employer_rate: number; // default 2%
  jp_employee_rate: number; // default 1%
  jkm_employer_rate: number; // default 0.3%
  jkk_rate: number; // 0.24% - 1.74% per company
  jkp_employer_rate: number; // default 0.36%
  kesehatan_employer_rate: number; // default 4%
  kesehatan_employee_rate: number; // default 1%
  jp_wage_ceiling: number; // Batas atas upah JP
  kesehatan_wage_ceiling: number; // Batas atas upah Kesehatan
  jkk_discount_start?: string; // ISO date string
  jkk_discount_end?: string; // ISO date string
}

/** Input untuk perhitungan BPJS */
export interface BPJSInput {
  base_wage: number; // Gaji Pokok + Tunjangan Tetap
  payroll_period: Date; // Untuk cek diskon JKK
}

/** Hasil perhitungan BPJS */
export interface BPJSResult {
  employer: {
    jht: number;
    jp: number;
    jkm: number;
    jkk: number;
    jkp: number;
    kesehatan: number;
    total: number;
  };
  employee: {
    jht: number;
    jp: number;
    kesehatan: number;
    total: number;
  };
}

/** Data karyawan untuk input batch payroll */
export interface EmployeePayrollData {
  employee_id: string;
  nama: string;
  nik: string;
  ptkp_status: PTKPStatus;
  gaji_pokok: number;
  tunjangan_tetap: number;
  uang_lembur: number;
}

/** Input untuk batch payroll processing */
export interface PayrollBatchInput {
  company_id: string;
  period_month: number; // 1-12
  period_year: number;
  employees: EmployeePayrollData[];
}

/** Hasil perhitungan per karyawan */
export interface PayrollEmployeeResult {
  employee_id: string;
  nama: string;
  gaji_pokok: number;
  tunjangan_tetap: number;
  uang_lembur: number;
  gross_income: number;
  pph21: number;
  bpjs_employee_total: number;
  bpjs_employer_total: number;
  total_deductions: number;
  net_pay: number;
  status: 'success' | 'warning' | 'failed';
  warning_message?: string;
}

/** Error dalam batch processing */
export interface PayrollError {
  employee_id: string;
  nama: string;
  error_message: string;
}

/** Hasil keseluruhan batch payroll */
export interface PayrollBatchResult {
  success_count: number;
  failed_count: number;
  total_net_pay: number;
  results: PayrollEmployeeResult[];
  errors: PayrollError[];
}
