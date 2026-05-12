/**
 * Unit tests untuk Batch Payroll Processor dan Net Pay Calculator
 * Validates: Persyaratan 4.1, 4.3, 4.4, 4.5, 4.6, 4.7, 11.3
 */

import { describe, it, expect } from 'vitest';
import {
  processBatchPayroll,
  validateEmployeeForBatch,
  validateAllEmployees,
  BatchValidationError,
} from './batchProcessor';
import { calculateNetPay } from './netPayCalculator';
import type {
  BPJSConfig,
  EmployeePayrollData,
  PayrollBatchInput,
  TERRate,
} from '@/types/payroll';

// === Test Fixtures ===

const defaultBPJSConfig: BPJSConfig = {
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

const defaultTERRates: TERRate[] = [
  { id: '1', category: 'A', lower_bound: 0, upper_bound: 5400000, rate_percent: 0 },
  { id: '2', category: 'A', lower_bound: 5400001, upper_bound: 5650000, rate_percent: 0.25 },
  { id: '3', category: 'A', lower_bound: 5650001, upper_bound: 5950000, rate_percent: 0.5 },
  { id: '4', category: 'A', lower_bound: 5950001, upper_bound: 6300000, rate_percent: 0.75 },
  { id: '5', category: 'A', lower_bound: 6300001, upper_bound: 6750000, rate_percent: 1 },
  { id: '6', category: 'A', lower_bound: 6750001, upper_bound: 7500000, rate_percent: 1.25 },
  { id: '7', category: 'A', lower_bound: 7500001, upper_bound: 8550000, rate_percent: 1.5 },
  { id: '8', category: 'A', lower_bound: 8550001, upper_bound: 9650000, rate_percent: 1.75 },
  { id: '9', category: 'A', lower_bound: 9650001, upper_bound: 10050000, rate_percent: 2 },
  { id: '10', category: 'A', lower_bound: 10050001, upper_bound: 10350000, rate_percent: 2.25 },
  { id: '11', category: 'A', lower_bound: 10350001, upper_bound: 10700000, rate_percent: 2.5 },
  { id: '12', category: 'A', lower_bound: 10700001, upper_bound: 11050000, rate_percent: 3 },
  { id: '13', category: 'A', lower_bound: 11050001, upper_bound: 11600000, rate_percent: 3.5 },
  { id: '14', category: 'A', lower_bound: 11600001, upper_bound: 12500000, rate_percent: 4 },
  { id: '15', category: 'A', lower_bound: 12500001, upper_bound: 13750000, rate_percent: 5 },
  { id: '16', category: 'A', lower_bound: 13750001, upper_bound: 15100000, rate_percent: 6 },
  { id: '17', category: 'A', lower_bound: 15100001, upper_bound: 16950000, rate_percent: 7 },
  { id: '18', category: 'A', lower_bound: 16950001, upper_bound: 19750000, rate_percent: 8 },
  { id: '19', category: 'A', lower_bound: 19750001, upper_bound: 24150000, rate_percent: 9 },
  { id: '20', category: 'A', lower_bound: 24150001, upper_bound: 999999999, rate_percent: 10 },
  { id: '21', category: 'B', lower_bound: 0, upper_bound: 6200000, rate_percent: 0 },
  { id: '22', category: 'B', lower_bound: 6200001, upper_bound: 6500000, rate_percent: 0.25 },
  { id: '23', category: 'B', lower_bound: 6500001, upper_bound: 6850000, rate_percent: 0.5 },
  { id: '24', category: 'B', lower_bound: 6850001, upper_bound: 7300000, rate_percent: 0.75 },
  { id: '25', category: 'B', lower_bound: 7300001, upper_bound: 9200000, rate_percent: 1 },
  { id: '26', category: 'B', lower_bound: 9200001, upper_bound: 10750000, rate_percent: 1.5 },
  { id: '27', category: 'B', lower_bound: 10750001, upper_bound: 11250000, rate_percent: 2 },
  { id: '28', category: 'B', lower_bound: 11250001, upper_bound: 11600000, rate_percent: 2.5 },
  { id: '29', category: 'B', lower_bound: 11600001, upper_bound: 12600000, rate_percent: 3 },
  { id: '30', category: 'B', lower_bound: 12600001, upper_bound: 999999999, rate_percent: 5 },
  { id: '31', category: 'C', lower_bound: 0, upper_bound: 6600000, rate_percent: 0 },
  { id: '32', category: 'C', lower_bound: 6600001, upper_bound: 6950000, rate_percent: 0.25 },
  { id: '33', category: 'C', lower_bound: 6950001, upper_bound: 7350000, rate_percent: 0.5 },
  { id: '34', category: 'C', lower_bound: 7350001, upper_bound: 7800000, rate_percent: 0.75 },
  { id: '35', category: 'C', lower_bound: 7800001, upper_bound: 8850000, rate_percent: 1 },
  { id: '36', category: 'C', lower_bound: 8850001, upper_bound: 9800000, rate_percent: 1.5 },
  { id: '37', category: 'C', lower_bound: 9800001, upper_bound: 10950000, rate_percent: 2 },
  { id: '38', category: 'C', lower_bound: 10950001, upper_bound: 999999999, rate_percent: 3 },
];

function createValidEmployee(overrides: Partial<EmployeePayrollData> = {}): EmployeePayrollData {
  return {
    employee_id: 'emp-001',
    nama: 'Budi Santoso',
    nik: '3201234567890001',
    ptkp_status: 'TK/0',
    gaji_pokok: 8000000,
    tunjangan_tetap: 1000000,
    uang_lembur: 500000,
    ...overrides,
  };
}

function createBatchInput(employees: EmployeePayrollData[]): PayrollBatchInput {
  return {
    company_id: 'company-001',
    period_month: 3,
    period_year: 2026,
    employees,
  };
}

// === Net Pay Calculator Tests ===

describe('calculateNetPay', () => {
  it('menghitung gaji bersih dengan formula yang benar', () => {
    const result = calculateNetPay({
      gross_income: 9500000,
      pph21Result: { ter_category: 'A', ter_rate_percent: 1.75, pph21_amount: 166250 },
      bpjsResult: {
        employer: { jht: 333000, jp: 180000, jkm: 27000, jkk: 10800, jkp: 32400, kesehatan: 360000, total: 943200 },
        employee: { jht: 180000, jp: 90000, kesehatan: 90000, total: 360000 },
      },
    });

    // net_pay = 9500000 - 166250 - 360000 = 8973750
    expect(result.net_pay).toBe(Math.round(9500000 - 166250 - 360000));
    expect(result.gross_income).toBe(9500000);
    expect(result.pph21).toBe(166250);
    expect(result.bpjs_employee_total).toBe(360000);
    expect(result.total_deductions).toBe(166250 + 360000);
  });

  it('mengembalikan komponen BPJS karyawan secara terpisah', () => {
    const result = calculateNetPay({
      gross_income: 5000000,
      pph21Result: { ter_category: 'A', ter_rate_percent: 0, pph21_amount: 0 },
      bpjsResult: {
        employer: { jht: 185000, jp: 100000, jkm: 15000, jkk: 6000, jkp: 18000, kesehatan: 200000, total: 524000 },
        employee: { jht: 100000, jp: 50000, kesehatan: 50000, total: 200000 },
      },
    });

    expect(result.bpjs_kes_employee).toBe(50000);
    expect(result.bpjs_jht_employee).toBe(100000);
    expect(result.bpjs_jp_employee).toBe(50000);
  });

  it('menghasilkan net_pay negatif jika potongan melebihi bruto', () => {
    const result = calculateNetPay({
      gross_income: 100000,
      pph21Result: { ter_category: 'A', ter_rate_percent: 0, pph21_amount: 0 },
      bpjsResult: {
        employer: { jht: 3700, jp: 2000, jkm: 300, jkk: 120, jkp: 360, kesehatan: 4000, total: 10480 },
        employee: { jht: 200000, jp: 100000, kesehatan: 100000, total: 400000 },
      },
    });

    expect(result.net_pay).toBeLessThan(0);
  });
});

// === Batch Validation Tests ===

describe('validateEmployeeForBatch', () => {
  it('mengembalikan array kosong untuk karyawan valid', () => {
    const employee = createValidEmployee();
    const errors = validateEmployeeForBatch(employee);
    expect(errors).toHaveLength(0);
  });

  it('mendeteksi NIK tidak valid (kurang dari 16 digit)', () => {
    const employee = createValidEmployee({ nik: '12345' });
    const errors = validateEmployeeForBatch(employee);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('16'))).toBe(true);
  });

  it('mendeteksi NIK mengandung karakter non-numerik', () => {
    const employee = createValidEmployee({ nik: '320123456789ABCD' });
    const errors = validateEmployeeForBatch(employee);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('angka'))).toBe(true);
  });

  it('mendeteksi PTKP tidak valid', () => {
    const employee = createValidEmployee({ ptkp_status: 'INVALID' as any });
    const errors = validateEmployeeForBatch(employee);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('PTKP'))).toBe(true);
  });

  it('mendeteksi gaji_pokok di bawah minimum', () => {
    const employee = createValidEmployee({ gaji_pokok: 50000 });
    const errors = validateEmployeeForBatch(employee);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('minimal'))).toBe(true);
  });

  it('mendeteksi gaji_pokok di atas maksimum', () => {
    const employee = createValidEmployee({ gaji_pokok: 1_000_000_000 });
    const errors = validateEmployeeForBatch(employee);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('maksimal'))).toBe(true);
  });
});

describe('validateAllEmployees', () => {
  it('mengembalikan array kosong jika semua karyawan valid', () => {
    const employees = [
      createValidEmployee({ employee_id: 'emp-001' }),
      createValidEmployee({ employee_id: 'emp-002', nik: '3201234567890002' }),
    ];
    const errors = validateAllEmployees(employees);
    expect(errors).toHaveLength(0);
  });

  it('mengembalikan error untuk setiap karyawan yang tidak valid', () => {
    const employees = [
      createValidEmployee({ employee_id: 'emp-001' }),
      createValidEmployee({ employee_id: 'emp-002', nik: '123' }), // invalid
      createValidEmployee({ employee_id: 'emp-003', ptkp_status: 'X' as any }), // invalid
    ];
    const errors = validateAllEmployees(employees);
    expect(errors).toHaveLength(2);
    expect(errors[0]!.employee_id).toBe('emp-002');
    expect(errors[1]!.employee_id).toBe('emp-003');
  });
});

// === Batch Processor Tests ===

describe('processBatchPayroll', () => {
  it('memproses batch berhasil untuk beberapa karyawan', () => {
    const employees = [
      createValidEmployee({ employee_id: 'emp-001', nama: 'Budi', nik: '3201234567890001' }),
      createValidEmployee({ employee_id: 'emp-002', nama: 'Ani', nik: '3201234567890002', gaji_pokok: 6000000, tunjangan_tetap: 500000, uang_lembur: 0 }),
      createValidEmployee({ employee_id: 'emp-003', nama: 'Citra', nik: '3201234567890003', gaji_pokok: 10000000, tunjangan_tetap: 2000000, uang_lembur: 1000000 }),
    ];

    const input = createBatchInput(employees);
    const result = processBatchPayroll(input, defaultTERRates, defaultBPJSConfig);

    expect(result.success_count).toBe(3);
    expect(result.failed_count).toBe(0);
    expect(result.results).toHaveLength(3);
    expect(result.errors).toHaveLength(0);
    expect(result.total_net_pay).toBeGreaterThan(0);
  });

  it('menghitung rincian per karyawan dengan benar', () => {
    const employee = createValidEmployee({
      gaji_pokok: 8000000,
      tunjangan_tetap: 1000000,
      uang_lembur: 500000,
    });

    const input = createBatchInput([employee]);
    const result = processBatchPayroll(input, defaultTERRates, defaultBPJSConfig);

    const empResult = result.results[0]!;
    expect(empResult.gaji_pokok).toBe(8000000);
    expect(empResult.tunjangan_tetap).toBe(1000000);
    expect(empResult.uang_lembur).toBe(500000);
    expect(empResult.gross_income).toBe(9500000);
    expect(empResult.pph21).toBeGreaterThanOrEqual(0);
    expect(empResult.bpjs_employee_total).toBeGreaterThan(0);
    expect(empResult.bpjs_employer_total).toBeGreaterThan(0);
    expect(empResult.total_deductions).toBe(empResult.pph21 + empResult.bpjs_employee_total);
    expect(empResult.net_pay).toBe(empResult.gross_income - empResult.total_deductions);
    expect(empResult.status).toBe('success');
  });

  it('menolak batch jika ada karyawan dengan data tidak valid (fail-fast)', () => {
    const employees = [
      createValidEmployee({ employee_id: 'emp-001' }),
      createValidEmployee({ employee_id: 'emp-002', nik: '123' }), // invalid NIK
    ];

    const input = createBatchInput(employees);

    expect(() => processBatchPayroll(input, defaultTERRates, defaultBPJSConfig))
      .toThrow(BatchValidationError);
  });

  it('menyertakan detail error validasi dalam BatchValidationError', () => {
    const employees = [
      createValidEmployee({ employee_id: 'emp-001', nik: 'abc', ptkp_status: 'INVALID' as any }),
    ];

    const input = createBatchInput(employees);

    try {
      processBatchPayroll(input, defaultTERRates, defaultBPJSConfig);
      expect.fail('Seharusnya throw BatchValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(BatchValidationError);
      const batchError = error as BatchValidationError;
      expect(batchError.validationErrors).toHaveLength(1);
      expect(batchError.validationErrors[0]!.employee_id).toBe('emp-001');
      expect(batchError.validationErrors[0]!.errors.length).toBeGreaterThanOrEqual(2);
    }
  });

  // Fault tolerance: kegagalan satu karyawan tidak menghentikan batch
  it('melanjutkan proses jika satu karyawan gagal dihitung (fault tolerance)', () => {
    // Karyawan dengan bruto yang tidak ada di tabel TER akan gagal
    // Kita gunakan TER rates yang terbatas untuk memicu error
    const limitedTERRates: TERRate[] = [
      { id: '1', category: 'A', lower_bound: 5000000, upper_bound: 10000000, rate_percent: 1.5 },
      { id: '2', category: 'B', lower_bound: 5000000, upper_bound: 10000000, rate_percent: 1.5 },
    ];

    const employees = [
      // Karyawan ini akan berhasil (bruto 9.5jt, kategori A, dalam range)
      createValidEmployee({
        employee_id: 'emp-001',
        nama: 'Budi',
        nik: '3201234567890001',
        ptkp_status: 'TK/0',
        gaji_pokok: 8000000,
        tunjangan_tetap: 1000000,
        uang_lembur: 500000,
      }),
      // Karyawan ini akan gagal (bruto 25jt, tidak ada di limitedTERRates)
      createValidEmployee({
        employee_id: 'emp-002',
        nama: 'Ani',
        nik: '3201234567890002',
        ptkp_status: 'TK/0',
        gaji_pokok: 20000000,
        tunjangan_tetap: 4000000,
        uang_lembur: 1000000,
      }),
      // Karyawan ini akan berhasil (bruto 6.5jt, kategori A, dalam range)
      createValidEmployee({
        employee_id: 'emp-003',
        nama: 'Citra',
        nik: '3201234567890003',
        ptkp_status: 'TK/0',
        gaji_pokok: 5000000,
        tunjangan_tetap: 1000000,
        uang_lembur: 500000,
      }),
    ];

    const input = createBatchInput(employees);
    const result = processBatchPayroll(input, limitedTERRates, defaultBPJSConfig);

    expect(result.success_count).toBe(2);
    expect(result.failed_count).toBe(1);
    expect(result.results).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.employee_id).toBe('emp-002');
    expect(result.errors[0]!.error_message).toContain('Tarif TER tidak ditemukan');
  });

  // Deteksi gaji negatif → status 'warning'
  it('menandai status warning jika gaji bersih negatif', () => {
    // Buat TER rate dengan persentase sangat tinggi untuk memicu net pay negatif
    // gross = 200000, PPh21 = floor(200000 * 95/100) = 190000
    // BPJS employee total = round(200000*2/100) + round(200000*1/100) + round(200000*1/100) = 4000+2000+2000 = 8000
    // total_deductions = 190000 + 8000 = 198000
    // net_pay = 200000 - 198000 = 2000 (still positive with 95%)
    // Need 100% TER to guarantee negative:
    // PPh21 = floor(200000 * 100/100) = 200000
    // net_pay = 200000 - 200000 - 8000 = -8000 (negative!)
    const highTERRates: TERRate[] = [
      { id: '1', category: 'A', lower_bound: 0, upper_bound: 999999999, rate_percent: 100 },
    ];

    const employee = createValidEmployee({
      gaji_pokok: 200000, // gaji minimum
      tunjangan_tetap: 0,
      uang_lembur: 0,
    });

    const input = createBatchInput([employee]);
    const result = processBatchPayroll(input, highTERRates, defaultBPJSConfig);

    expect(result.success_count).toBe(1);
    expect(result.results[0]!.status).toBe('warning');
    expect(result.results[0]!.warning_message).toContain('negatif');
    expect(result.results[0]!.net_pay).toBeLessThan(0);
  });

  // Ringkasan totals
  it('menghitung ringkasan total_net_pay dengan benar', () => {
    const employees = [
      createValidEmployee({ employee_id: 'emp-001', nik: '3201234567890001', gaji_pokok: 8000000, tunjangan_tetap: 1000000, uang_lembur: 500000 }),
      createValidEmployee({ employee_id: 'emp-002', nik: '3201234567890002', gaji_pokok: 6000000, tunjangan_tetap: 500000, uang_lembur: 0 }),
    ];

    const input = createBatchInput(employees);
    const result = processBatchPayroll(input, defaultTERRates, defaultBPJSConfig);

    const expectedTotal = result.results.reduce((sum, r) => sum + r.net_pay, 0);
    expect(result.total_net_pay).toBe(expectedTotal);
  });

  // Max 50 employee limit
  it('menolak batch jika jumlah karyawan melebihi 50', () => {
    const employees: EmployeePayrollData[] = [];
    for (let i = 0; i < 51; i++) {
      employees.push(
        createValidEmployee({
          employee_id: `emp-${String(i).padStart(3, '0')}`,
          nik: `320123456789${String(i).padStart(4, '0')}`,
        }),
      );
    }

    const input = createBatchInput(employees);

    expect(() => processBatchPayroll(input, defaultTERRates, defaultBPJSConfig))
      .toThrow('melebihi batas maksimal');
  });

  it('menerima batch dengan tepat 50 karyawan', () => {
    const employees: EmployeePayrollData[] = [];
    for (let i = 0; i < 50; i++) {
      employees.push(
        createValidEmployee({
          employee_id: `emp-${String(i).padStart(3, '0')}`,
          nik: `320123456789${String(i).padStart(4, '0')}`,
        }),
      );
    }

    const input = createBatchInput(employees);
    const result = processBatchPayroll(input, defaultTERRates, defaultBPJSConfig);

    expect(result.success_count).toBe(50);
    expect(result.failed_count).toBe(0);
  });

  // Validasi error: NIK tidak valid
  it('menolak batch jika ada karyawan dengan NIK tidak valid', () => {
    const employees = [
      createValidEmployee({ employee_id: 'emp-001', nik: '320123456789000' }), // 15 digit
    ];

    const input = createBatchInput(employees);

    expect(() => processBatchPayroll(input, defaultTERRates, defaultBPJSConfig))
      .toThrow(BatchValidationError);
  });

  // Validasi error: PTKP tidak valid
  it('menolak batch jika ada karyawan dengan PTKP tidak valid', () => {
    const employees = [
      createValidEmployee({ employee_id: 'emp-001', ptkp_status: '' as any }),
    ];

    const input = createBatchInput(employees);

    expect(() => processBatchPayroll(input, defaultTERRates, defaultBPJSConfig))
      .toThrow(BatchValidationError);
  });

  it('memproses batch kosong tanpa error', () => {
    const input = createBatchInput([]);
    const result = processBatchPayroll(input, defaultTERRates, defaultBPJSConfig);

    expect(result.success_count).toBe(0);
    expect(result.failed_count).toBe(0);
    expect(result.total_net_pay).toBe(0);
    expect(result.results).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('menghitung net_pay sesuai formula: bruto - PPh21 - BPJS karyawan', () => {
    const employee = createValidEmployee({
      gaji_pokok: 10000000,
      tunjangan_tetap: 2000000,
      uang_lembur: 0,
    });

    const input = createBatchInput([employee]);
    const result = processBatchPayroll(input, defaultTERRates, defaultBPJSConfig);

    const empResult = result.results[0]!;
    // Verify formula: net_pay = gross - pph21 - bpjs_employee_total
    expect(empResult.net_pay).toBe(
      Math.round(empResult.gross_income - empResult.pph21 - empResult.bpjs_employee_total),
    );
  });
});
