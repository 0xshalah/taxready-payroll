/**
 * Constants dan konfigurasi default untuk Tax-Ready Payroll
 * Validates: Persyaratan 2.2, 2.3, 3.1, 3.2, 9.1
 */

import type { PTKPStatus } from '@/types/employee';
import type { BPJSConfig, TERCategory } from '@/types/payroll';

/**
 * Pemetaan status PTKP ke kategori TER
 * Berdasarkan PP 58/2023 Lampiran (berlaku sejak 1 Januari 2024):
 * - Kategori A: TK/0, TK/1, K/0
 * - Kategori B: TK/2, TK/3, K/1, K/2
 * - Kategori C: K/3
 *
 * Referensi: https://help.staffany.com/en/articles/10717593-pph21-calculation
 */
export const PTKP_TO_TER_CATEGORY: Record<PTKPStatus, TERCategory> = {
  'TK/0': 'A',
  'TK/1': 'A',
  'K/0': 'A',
  'TK/2': 'B',
  'TK/3': 'B',
  'K/1': 'B',
  'K/2': 'B',
  'K/3': 'C',
};

/** Daftar seluruh status PTKP yang valid */
export const PTKP_VALUES: PTKPStatus[] = [
  'TK/0',
  'TK/1',
  'TK/2',
  'TK/3',
  'K/0',
  'K/1',
  'K/2',
  'K/3',
];

/**
 * Konfigurasi default tarif BPJS
 * Digunakan saat inisialisasi perusahaan baru
 */
export const DEFAULT_BPJS_CONFIG: BPJSConfig = {
  jht_employer_rate: 3.7,
  jht_employee_rate: 2,
  jp_employer_rate: 2,
  jp_employee_rate: 1,
  jkm_employer_rate: 0.3,
  jkk_rate: 0.24,
  jkp_employer_rate: 0.36,
  kesehatan_employer_rate: 4,
  kesehatan_employee_rate: 1,
  jp_wage_ceiling: 10042300,
  kesehatan_wage_ceiling: 12000000,
  jkk_discount_start: '2026-01-01',
  jkk_discount_end: '2026-06-30',
};

/** Batas minimum gaji pokok (Rp) */
export const MIN_GAJI_POKOK = 100_000;

/** Batas maksimum gaji pokok (Rp) */
export const MAX_GAJI_POKOK = 999_999_999;

/** Maksimum karyawan aktif per perusahaan */
export const MAX_EMPLOYEES_PER_COMPANY = 50;

/** Panjang NIK yang valid */
export const NIK_LENGTH = 16;

/** Maksimum panjang nama lengkap */
export const MAX_NAMA_LENGTH = 150;

/** Maksimum panjang jabatan */
export const MAX_JABATAN_LENGTH = 100;

/** Rentang tarif JKK yang valid (%) */
export const JKK_RATE_MIN = 0.24;
export const JKK_RATE_MAX = 1.74;
