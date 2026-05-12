/**
 * Kalkulator BPJS Kesehatan dan Ketenagakerjaan
 * Berdasarkan tarif 2026 dengan dukungan diskon JKK temporal
 *
 * Validates: Persyaratan 3.1, 3.2, 3.3, 3.4
 */

import type { BPJSConfig, BPJSInput, BPJSResult } from '@/types/payroll';
import { ValidationError } from './pph21Calculator';

/**
 * Menentukan apakah periode payroll berada dalam rentang diskon JKK 50%.
 *
 * Diskon JKK berlaku selama periode yang dikonfigurasi (default: Jan-Jun 2026).
 * Perbandingan dilakukan pada level bulan (hari diabaikan).
 *
 * @param period - Tanggal periode payroll
 * @param config - Konfigurasi BPJS yang berisi tanggal mulai dan akhir diskon
 * @returns true jika periode berada dalam rentang diskon
 *
 * Validates: Persyaratan 3.3
 */
export function isWithinDiscountPeriod(period: Date, config: BPJSConfig): boolean {
  if (!config.jkk_discount_start || !config.jkk_discount_end) {
    return false;
  }

  // Normalisasi ke awal bulan untuk perbandingan level bulan
  const periodDate = new Date(period.getFullYear(), period.getMonth(), 1);

  const startParts = config.jkk_discount_start.split('-');
  const startYear = parseInt(startParts[0] ?? '0', 10);
  const startMonth = parseInt(startParts[1] ?? '1', 10) - 1;
  const discountStart = new Date(startYear, startMonth, 1);

  const endParts = config.jkk_discount_end.split('-');
  const endYear = parseInt(endParts[0] ?? '0', 10);
  const endMonth = parseInt(endParts[1] ?? '1', 10) - 1;
  const discountEnd = new Date(endYear, endMonth, 1);

  return periodDate >= discountStart && periodDate <= discountEnd;
}

/**
 * Menghitung seluruh komponen iuran BPJS (Kesehatan + Ketenagakerjaan).
 *
 * Komponen yang dihitung:
 * - BPJS Kesehatan: dengan ceiling upah
 * - JHT (Jaminan Hari Tua): tanpa ceiling
 * - JP (Jaminan Pensiun): dengan ceiling upah
 * - JKM (Jaminan Kematian): tanpa ceiling, employer only
 * - JKK (Jaminan Kecelakaan Kerja): tanpa ceiling, employer only, dengan diskon temporal
 * - JKP (Jaminan Kehilangan Pekerjaan): tanpa ceiling, employer only
 *
 * Semua hasil dibulatkan dengan Math.round() ke Rupiah terdekat.
 *
 * @param input - Input berisi base_wage (Gaji Pokok + Tunjangan Tetap) dan payroll_period
 * @param config - Konfigurasi tarif BPJS perusahaan
 * @returns Hasil perhitungan BPJS terpisah employer dan employee
 * @throws ValidationError jika base_wage <= 0
 *
 * Validates: Persyaratan 3.1, 3.2, 3.3, 3.4
 */
export function calculateBPJS(input: BPJSInput, config: BPJSConfig): BPJSResult {
  const { base_wage, payroll_period } = input;

  // Validasi: upah dasar harus lebih dari 0
  if (base_wage <= 0) {
    throw new ValidationError('Upah dasar harus lebih dari 0');
  }

  // 1. BPJS Kesehatan (dengan ceiling)
  const kesWage = Math.min(base_wage, config.kesehatan_wage_ceiling);
  const kesEmployer = Math.round(kesWage * config.kesehatan_employer_rate / 100);
  const kesEmployee = Math.round(kesWage * config.kesehatan_employee_rate / 100);

  // 2. JHT - Jaminan Hari Tua (tanpa ceiling, full wage)
  const jhtEmployer = Math.round(base_wage * config.jht_employer_rate / 100);
  const jhtEmployee = Math.round(base_wage * config.jht_employee_rate / 100);

  // 3. JP - Jaminan Pensiun (dengan ceiling)
  const jpWage = Math.min(base_wage, config.jp_wage_ceiling);
  const jpEmployer = Math.round(jpWage * config.jp_employer_rate / 100);
  const jpEmployee = Math.round(jpWage * config.jp_employee_rate / 100);

  // 4. JKM - Jaminan Kematian (employer only, tanpa ceiling)
  const jkmEmployer = Math.round(base_wage * config.jkm_employer_rate / 100);

  // 5. JKK - Jaminan Kecelakaan Kerja (employer only, dengan diskon 50% temporal)
  let effectiveJKKRate = config.jkk_rate;
  if (isWithinDiscountPeriod(payroll_period, config)) {
    effectiveJKKRate = config.jkk_rate * 0.5;
  }
  const jkkEmployer = Math.round(base_wage * effectiveJKKRate / 100);

  // 6. JKP - Jaminan Kehilangan Pekerjaan (employer only, tanpa ceiling)
  const jkpEmployer = Math.round(base_wage * config.jkp_employer_rate / 100);

  // Hitung total
  const employerTotal = jhtEmployer + jpEmployer + jkmEmployer + jkkEmployer + jkpEmployer + kesEmployer;
  const employeeTotal = jhtEmployee + jpEmployee + kesEmployee;

  return {
    employer: {
      jht: jhtEmployer,
      jp: jpEmployer,
      jkm: jkmEmployer,
      jkk: jkkEmployer,
      jkp: jkpEmployer,
      kesehatan: kesEmployer,
      total: employerTotal,
    },
    employee: {
      jht: jhtEmployee,
      jp: jpEmployee,
      kesehatan: kesEmployee,
      total: employeeTotal,
    },
  };
}
