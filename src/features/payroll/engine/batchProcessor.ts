/**
 * Batch Payroll Processor
 * Orchestrator yang memproses perhitungan gaji untuk max 50 karyawan.
 *
 * Alur:
 * 1. Validasi seluruh karyawan (fail-fast jika ada yang invalid)
 * 2. Untuk setiap karyawan: hitung gross → PPh21 → BPJS → net pay
 * 3. Jika net_pay < 0: tandai status 'warning' (batch tetap lanjut)
 * 4. Jika perhitungan error untuk satu karyawan: catat error, lanjut ke berikutnya
 * 5. Return ringkasan: success_count, failed_count, total_net_pay, results[], errors[]
 *
 * Validates: Persyaratan 4.1, 4.3, 4.4, 4.5, 4.6, 4.7, 11.3
 */

import type {
  BPJSConfig,
  EmployeePayrollData,
  PayrollBatchInput,
  PayrollBatchResult,
  PayrollEmployeeResult,
  PayrollError,
  TERRate,
} from '@/types/payroll';
import { calculateGrossIncome, calculatePPh21, ValidationError } from './pph21Calculator';
import { calculateBPJS } from './bpjsCalculator';
import { calculateNetPay } from './netPayCalculator';
import { validateNIK } from '@/features/employees/validators/employeeSchema';
import { PTKP_VALUES, MIN_GAJI_POKOK, MAX_GAJI_POKOK, MAX_EMPLOYEES_PER_COMPANY } from '@/lib/constants';
import type { PTKPStatus } from '@/types/employee';

/**
 * Error khusus untuk kegagalan validasi batch
 */
export class BatchValidationError extends Error {
  public readonly validationErrors: BatchEmployeeValidationError[];

  constructor(errors: BatchEmployeeValidationError[]) {
    const message = `Validasi batch gagal: ${errors.length} karyawan memiliki data tidak valid`;
    super(message);
    this.name = 'BatchValidationError';
    this.validationErrors = errors;
  }
}

/**
 * Detail error validasi per karyawan
 */
export interface BatchEmployeeValidationError {
  employee_id: string;
  nama: string;
  errors: string[];
}

/**
 * Validasi data satu karyawan sebelum proses batch.
 * Memeriksa: NIK valid (16 digit angka), PTKP valid, gaji_pokok dalam rentang.
 *
 * @param employee - Data karyawan yang akan divalidasi
 * @returns Array pesan error (kosong jika valid)
 *
 * Validates: Persyaratan 11.3
 */
export function validateEmployeeForBatch(employee: EmployeePayrollData): string[] {
  const errors: string[] = [];

  // Validasi NIK
  const nikResult = validateNIK(employee.nik);
  if (!nikResult.valid) {
    errors.push(nikResult.error!);
  }

  // Validasi PTKP
  if (!employee.ptkp_status || !PTKP_VALUES.includes(employee.ptkp_status as PTKPStatus)) {
    errors.push('Status PTKP tidak valid atau tidak terisi');
  }

  // Validasi gaji_pokok
  if (employee.gaji_pokok === undefined || employee.gaji_pokok === null) {
    errors.push('Gaji pokok wajib diisi');
  } else if (employee.gaji_pokok < MIN_GAJI_POKOK) {
    errors.push(`Gaji pokok minimal Rp${MIN_GAJI_POKOK.toLocaleString('id-ID')}`);
  } else if (employee.gaji_pokok > MAX_GAJI_POKOK) {
    errors.push(`Gaji pokok maksimal Rp${MAX_GAJI_POKOK.toLocaleString('id-ID')}`);
  }

  return errors;
}

/**
 * Validasi seluruh karyawan dalam batch sebelum proses dimulai.
 * Jika ada karyawan yang tidak valid, seluruh batch ditolak (fail-fast).
 *
 * @param employees - Array data karyawan
 * @returns Array error validasi (kosong jika semua valid)
 *
 * Validates: Persyaratan 11.3
 */
export function validateAllEmployees(employees: EmployeePayrollData[]): BatchEmployeeValidationError[] {
  const validationErrors: BatchEmployeeValidationError[] = [];

  for (const employee of employees) {
    const errors = validateEmployeeForBatch(employee);
    if (errors.length > 0) {
      validationErrors.push({
        employee_id: employee.employee_id,
        nama: employee.nama,
        errors,
      });
    }
  }

  return validationErrors;
}

/**
 * Memproses batch penggajian untuk seluruh karyawan aktif.
 *
 * Alur:
 * 1. Validasi jumlah karyawan (max 50)
 * 2. Validasi data seluruh karyawan (fail-fast)
 * 3. Proses perhitungan per karyawan dengan fault tolerance
 * 4. Return ringkasan hasil
 *
 * @param input - Input batch berisi company_id, periode, dan data karyawan
 * @param terRates - Array tarif TER dari konfigurasi
 * @param bpjsConfig - Konfigurasi tarif BPJS perusahaan
 * @returns Hasil batch: ringkasan + detail per karyawan + error list
 * @throws BatchValidationError jika ada karyawan dengan data tidak valid
 *
 * Validates: Persyaratan 4.1, 4.3, 4.4, 4.5, 4.6, 4.7, 11.3
 */
export function processBatchPayroll(
  input: PayrollBatchInput,
  terRates: TERRate[],
  bpjsConfig: BPJSConfig,
): PayrollBatchResult {
  const results: PayrollEmployeeResult[] = [];
  const errors: PayrollError[] = [];

  // Validasi jumlah karyawan tidak melebihi batas
  if (input.employees.length > MAX_EMPLOYEES_PER_COMPANY) {
    throw new ValidationError(
      `Jumlah karyawan melebihi batas maksimal ${MAX_EMPLOYEES_PER_COMPANY} per batch`,
    );
  }

  // Fase 1: Validasi seluruh karyawan sebelum proses (fail-fast)
  const validationErrors = validateAllEmployees(input.employees);
  if (validationErrors.length > 0) {
    throw new BatchValidationError(validationErrors);
  }

  // Fase 2: Proses perhitungan per karyawan dengan fault tolerance
  for (const employee of input.employees) {
    try {
      // 2a. Hitung penghasilan bruto
      const grossIncome = calculateGrossIncome(
        employee.gaji_pokok,
        employee.tunjangan_tetap,
        employee.uang_lembur,
      );

      // 2b. Hitung PPh 21
      const pph21Result = calculatePPh21(
        { gross_income: grossIncome, ptkp_status: employee.ptkp_status },
        terRates,
      );

      // 2c. Hitung BPJS (base_wage = gaji_pokok + tunjangan_tetap)
      const baseWage = employee.gaji_pokok + employee.tunjangan_tetap;
      const payrollDate = new Date(input.period_year, input.period_month - 1, 1);
      const bpjsResult = calculateBPJS(
        { base_wage: baseWage, payroll_period: payrollDate },
        bpjsConfig,
      );

      // 2d. Hitung gaji bersih
      const netPayResult = calculateNetPay({
        gross_income: grossIncome,
        pph21Result,
        bpjsResult,
      });

      // 2e. Cek gaji negatif → status 'warning'
      let status: 'success' | 'warning' = 'success';
      let warningMessage: string | undefined;
      if (netPayResult.net_pay < 0) {
        status = 'warning';
        warningMessage = `Gaji bersih negatif (Rp ${netPayResult.net_pay.toLocaleString('id-ID')}). Perlu ditinjau.`;
      }

      const result: PayrollEmployeeResult = {
        employee_id: employee.employee_id,
        nama: employee.nama,
        gaji_pokok: employee.gaji_pokok,
        tunjangan_tetap: employee.tunjangan_tetap,
        uang_lembur: employee.uang_lembur,
        gross_income: grossIncome,
        pph21: pph21Result.pph21_amount,
        bpjs_employee_total: netPayResult.bpjs_employee_total,
        bpjs_employer_total: bpjsResult.employer.total,
        total_deductions: netPayResult.total_deductions,
        net_pay: netPayResult.net_pay,
        status,
        warning_message: warningMessage,
      };

      results.push(result);
    } catch (error) {
      // Fault tolerance: catat error, lanjut ke karyawan berikutnya
      const errorMessage = error instanceof Error ? error.message : 'Kesalahan tidak diketahui';
      errors.push({
        employee_id: employee.employee_id,
        nama: employee.nama,
        error_message: errorMessage,
      });
    }
  }

  // Fase 3: Hitung ringkasan
  const successCount = results.length;
  const failedCount = errors.length;
  const totalNetPay = results.reduce((sum, r) => sum + r.net_pay, 0);

  return {
    success_count: successCount,
    failed_count: failedCount,
    total_net_pay: totalNetPay,
    results,
    errors,
  };
}
