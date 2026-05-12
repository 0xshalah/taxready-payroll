/**
 * Kalkulator PPh 21 menggunakan skema TER (Tarif Efektif Rata-rata)
 * Berdasarkan PP 58/2023 (berlaku sejak 1 Januari 2024)
 *
 * Validates: Persyaratan 2.1, 2.2, 2.4, 2.5, 2.6, 2.7
 */

import type { PTKPStatus } from '@/types/employee';
import type { PPh21Input, PPh21Result, TERRate } from '@/types/payroll';
import { PTKP_TO_TER_CATEGORY } from '@/lib/constants';

/**
 * Custom error untuk validasi perhitungan payroll
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Menghitung penghasilan bruto (gross income) dari komponen gaji.
 *
 * Formula: Bruto = Gaji Pokok + Tunjangan Tetap + Uang Lembur
 *
 * @param gajiPokok - Gaji pokok karyawan (≥ 0)
 * @param tunjanganTetap - Tunjangan tetap bulanan (≥ 0)
 * @param uangLembur - Uang lembur bulanan (≥ 0)
 * @returns Total penghasilan bruto
 * @throws ValidationError jika ada komponen bernilai negatif
 *
 * Validates: Persyaratan 2.4
 */
export function calculateGrossIncome(
  gajiPokok: number,
  tunjanganTetap: number,
  uangLembur: number,
): number {
  if (gajiPokok < 0 || tunjanganTetap < 0 || uangLembur < 0) {
    throw new ValidationError('Komponen gaji tidak boleh negatif');
  }
  return gajiPokok + tunjanganTetap + uangLembur;
}

/**
 * Menghitung PPh 21 menggunakan skema TER.
 *
 * Alur:
 * 1. Validasi status PTKP
 * 2. Jika bruto = 0, return PPh21 = 0 tanpa lookup TER
 * 3. Tentukan kategori TER dari status PTKP (A/B/C)
 * 4. Cari tarif TER berdasarkan kategori dan rentang bruto
 * 5. Hitung PPh 21 = Math.floor(bruto × rate / 100)
 *
 * @param input - Input perhitungan (gross_income dan ptkp_status)
 * @param terRates - Array tarif TER dari database/konfigurasi
 * @returns Hasil perhitungan PPh 21
 * @throws ValidationError jika PTKP tidak valid atau tarif tidak ditemukan
 *
 * Validates: Persyaratan 2.1, 2.2, 2.5, 2.6, 2.7
 */
export function calculatePPh21(
  input: PPh21Input,
  terRates: TERRate[],
): PPh21Result {
  // 1. Validasi status PTKP
  const category = PTKP_TO_TER_CATEGORY[input.ptkp_status as PTKPStatus];
  if (!category) {
    throw new ValidationError(
      `Status PTKP tidak valid: ${input.ptkp_status}`,
    );
  }

  // 2. Jika bruto = 0, langsung return 0 tanpa lookup TER
  if (input.gross_income === 0) {
    return {
      ter_category: category,
      ter_rate_percent: 0,
      pph21_amount: 0,
    };
  }

  // 3. Cari tarif TER berdasarkan kategori dan rentang bruto
  const applicableRate = terRates.find(
    (rate) =>
      rate.category === category &&
      input.gross_income >= rate.lower_bound &&
      input.gross_income <= rate.upper_bound,
  );

  if (!applicableRate) {
    throw new ValidationError(
      `Tarif TER tidak ditemukan untuk kategori ${category} dengan bruto Rp ${input.gross_income}`,
    );
  }

  // 4. Hitung PPh 21 = floor(bruto × persentase TER / 100)
  const pph21Raw = input.gross_income * (applicableRate.rate_percent / 100);
  const pph21Amount = Math.floor(pph21Raw);

  return {
    ter_category: category,
    ter_rate_percent: applicableRate.rate_percent,
    pph21_amount: pph21Amount,
  };
}
