/**
 * Validasi untuk pengaturan tarif TER dan BPJS
 * Validates: Persyaratan 2.8, 3.5, 3.7
 *
 * Memastikan:
 * - Semua tarif berada dalam rentang 0-100%
 * - Batas atas upah > 0
 * - JKK rate antara 0.24% dan 1.74%
 * - TER rates: upper_bound > lower_bound
 */

import { JKK_RATE_MIN, JKK_RATE_MAX } from '@/lib/constants';
import type { TERRate, BPJSConfig } from '@/types/payroll';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validasi satu entri tarif TER.
 * - rate_percent harus 0 <= value <= 100
 * - lower_bound harus >= 0
 * - upper_bound harus > 0
 * - upper_bound harus > lower_bound
 */
export function validateTERRate(rate: Pick<TERRate, 'category' | 'lower_bound' | 'upper_bound' | 'rate_percent'>): ValidationResult {
  const errors: ValidationError[] = [];

  if (rate.rate_percent < 0 || rate.rate_percent > 100) {
    errors.push({
      field: 'rate_percent',
      message: `Tarif TER harus antara 0% dan 100%, diterima: ${rate.rate_percent}%`,
    });
  }

  if (rate.lower_bound < 0) {
    errors.push({
      field: 'lower_bound',
      message: `Batas bawah tidak boleh negatif, diterima: ${rate.lower_bound}`,
    });
  }

  if (rate.upper_bound <= 0) {
    errors.push({
      field: 'upper_bound',
      message: `Batas atas harus lebih dari 0, diterima: ${rate.upper_bound}`,
    });
  }

  if (rate.upper_bound <= rate.lower_bound) {
    errors.push({
      field: 'upper_bound',
      message: `Batas atas (${rate.upper_bound}) harus lebih besar dari batas bawah (${rate.lower_bound})`,
    });
  }

  if (!['A', 'B', 'C'].includes(rate.category)) {
    errors.push({
      field: 'category',
      message: `Kategori TER harus A, B, atau C, diterima: ${rate.category}`,
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validasi array tarif TER (seluruh tabel).
 */
export function validateTERRates(rates: Pick<TERRate, 'category' | 'lower_bound' | 'upper_bound' | 'rate_percent'>[]): ValidationResult {
  const allErrors: ValidationError[] = [];

  for (let i = 0; i < rates.length; i++) {
    const result = validateTERRate(rates[i]!);
    if (!result.valid) {
      for (const err of result.errors) {
        allErrors.push({
          field: `rates[${i}].${err.field}`,
          message: err.message,
        });
      }
    }
  }

  return { valid: allErrors.length === 0, errors: allErrors };
}

/**
 * Validasi konfigurasi BPJS.
 * - Semua tarif (rate) harus 0 <= value <= 100
 * - jkk_rate harus antara 0.24% dan 1.74%
 * - jp_wage_ceiling harus > 0
 * - kesehatan_wage_ceiling harus > 0
 */
export function validateBPJSConfig(config: BPJSConfig): ValidationResult {
  const errors: ValidationError[] = [];

  // Validasi semua tarif dalam rentang 0-100%
  const rateFields: { field: keyof BPJSConfig; label: string }[] = [
    { field: 'jht_employer_rate', label: 'JHT Pemberi Kerja' },
    { field: 'jht_employee_rate', label: 'JHT Karyawan' },
    { field: 'jp_employer_rate', label: 'JP Pemberi Kerja' },
    { field: 'jp_employee_rate', label: 'JP Karyawan' },
    { field: 'jkm_employer_rate', label: 'JKM Pemberi Kerja' },
    { field: 'jkk_rate', label: 'JKK' },
    { field: 'jkp_employer_rate', label: 'JKP Pemberi Kerja' },
    { field: 'kesehatan_employer_rate', label: 'Kesehatan Pemberi Kerja' },
    { field: 'kesehatan_employee_rate', label: 'Kesehatan Karyawan' },
  ];

  for (const { field, label } of rateFields) {
    const value = config[field] as number;
    if (value < 0 || value > 100) {
      errors.push({
        field,
        message: `Tarif ${label} harus antara 0% dan 100%, diterima: ${value}%`,
      });
    }
  }

  // Validasi khusus JKK rate: 0.24% - 1.74%
  if (config.jkk_rate < JKK_RATE_MIN || config.jkk_rate > JKK_RATE_MAX) {
    errors.push({
      field: 'jkk_rate',
      message: `Tarif JKK harus antara ${JKK_RATE_MIN}% dan ${JKK_RATE_MAX}%, diterima: ${config.jkk_rate}%`,
    });
  }

  // Validasi batas atas upah JP > 0
  if (config.jp_wage_ceiling <= 0) {
    errors.push({
      field: 'jp_wage_ceiling',
      message: `Batas atas upah JP harus lebih dari 0, diterima: ${config.jp_wage_ceiling}`,
    });
  }

  // Validasi batas atas upah Kesehatan > 0
  if (config.kesehatan_wage_ceiling <= 0) {
    errors.push({
      field: 'kesehatan_wage_ceiling',
      message: `Batas atas upah Kesehatan harus lebih dari 0, diterima: ${config.kesehatan_wage_ceiling}`,
    });
  }

  return { valid: errors.length === 0, errors };
}
