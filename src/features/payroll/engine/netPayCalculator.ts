/**
 * Kalkulator Gaji Bersih (Net Pay / Take-Home Pay)
 * Formula: net_pay = gross_income - PPh21 - BPJS Kesehatan karyawan - BPJS JHT karyawan - BPJS JP karyawan
 *
 * Validates: Persyaratan 4.1, 4.5
 */

import type { BPJSResult, PPh21Result } from '@/types/payroll';

/**
 * Input untuk perhitungan gaji bersih
 */
export interface NetPayInput {
  gross_income: number;
  pph21Result: PPh21Result;
  bpjsResult: BPJSResult;
}

/**
 * Hasil perhitungan gaji bersih
 */
export interface NetPayResult {
  gross_income: number;
  pph21: number;
  bpjs_kes_employee: number;
  bpjs_jht_employee: number;
  bpjs_jp_employee: number;
  bpjs_employee_total: number;
  total_deductions: number;
  net_pay: number;
}

/**
 * Menghitung gaji bersih (take-home pay) karyawan.
 *
 * Formula:
 * net_pay = gross_income - PPh21 - BPJS_Kes_Employee - BPJS_JHT_Employee - BPJS_JP_Employee
 *
 * Total potongan karyawan = PPh21 + seluruh BPJS bagian karyawan (kesehatan + JHT + JP)
 * Hasil net_pay dibulatkan dengan Math.round() ke Rupiah terdekat.
 *
 * @param input - Input berisi gross_income, hasil PPh21, dan hasil BPJS
 * @returns Hasil perhitungan gaji bersih dengan rincian potongan
 *
 * Validates: Persyaratan 4.1, 4.5
 */
export function calculateNetPay(input: NetPayInput): NetPayResult {
  const { gross_income, pph21Result, bpjsResult } = input;

  const pph21 = pph21Result.pph21_amount;
  const bpjs_kes_employee = bpjsResult.employee.kesehatan;
  const bpjs_jht_employee = bpjsResult.employee.jht;
  const bpjs_jp_employee = bpjsResult.employee.jp;
  const bpjs_employee_total = bpjsResult.employee.total;

  const total_deductions = pph21 + bpjs_employee_total;
  const net_pay = Math.round(gross_income - total_deductions);

  return {
    gross_income,
    pph21,
    bpjs_kes_employee,
    bpjs_jht_employee,
    bpjs_jp_employee,
    bpjs_employee_total,
    total_deductions,
    net_pay,
  };
}
