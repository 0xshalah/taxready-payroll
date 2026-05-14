/**
 * Unit tests untuk PDF BPA1 Generator
 * Tests fokus pada data preparation dan filename generation (bukan PDF rendering)
 * Validates: Persyaratan 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeEmployeeName,
  generateBPA1Filename,
  generateBPA1Data,
  formatRupiah,
  formatBulan,
  BPA1ValidationError,
  type BPA1EmployeeInput,
  type BPA1CompanyInput,
  type BPA1Period,
} from './pdfBPA1Generator';

// === Test Data ===

const validEmployee: BPA1EmployeeInput = {
  nama: 'Budi Santoso',
  nik: '3201234567890001',
  ptkp_status: 'TK/0',
  gross_income: 10000000,
  pph21: 250000,
};

const validCompany: BPA1CompanyInput = {
  nama_perusahaan: 'PT Maju Jaya',
  npwp_badan: '01.234.567.8-901.000',
};

const validPeriod: BPA1Period = { month: 3, year: 2026 };

// === sanitizeEmployeeName Tests ===

describe('sanitizeEmployeeName', () => {
  it('should replace spaces with underscores', () => {
    expect(sanitizeEmployeeName('Budi Santoso')).toBe('Budi_Santoso');
  });

  it('should remove special characters', () => {
    expect(sanitizeEmployeeName('Budi S. (Jr.)')).toBe('Budi_S_Jr');
  });

  it('should handle multiple spaces', () => {
    expect(sanitizeEmployeeName('Budi   Santoso')).toBe('Budi_Santoso');
  });

  it('should keep alphanumeric characters', () => {
    expect(sanitizeEmployeeName('Budi123')).toBe('Budi123');
  });

  it('should remove leading/trailing underscores', () => {
    expect(sanitizeEmployeeName(' Budi Santoso ')).toBe('Budi_Santoso');
  });

  it('should handle empty string', () => {
    expect(sanitizeEmployeeName('')).toBe('');
  });

  it('should handle name with only special characters', () => {
    expect(sanitizeEmployeeName('...')).toBe('');
  });

  it('should handle Indonesian names with apostrophes', () => {
    expect(sanitizeEmployeeName("M. Syafi'i")).toBe('M_Syafii');
  });

  it('should handle names with commas', () => {
    expect(sanitizeEmployeeName('Budi, S.Kom')).toBe('Budi_SKom');
  });
});

// === generateBPA1Filename Tests ===

describe('generateBPA1Filename', () => {
  it('should generate correct filename format: [Name]_BPA1_[YYYY]_[MM].pdf', () => {
    const result = generateBPA1Filename('Budi Santoso', { month: 3, year: 2026 });
    expect(result).toBe('Budi_Santoso_BPA1_2026_03.pdf');
  });

  it('should pad single-digit month with zero', () => {
    const result = generateBPA1Filename('Siti Rahayu', { month: 1, year: 2026 });
    expect(result).toBe('Siti_Rahayu_BPA1_2026_01.pdf');
  });

  it('should not pad double-digit month', () => {
    const result = generateBPA1Filename('Budi', { month: 12, year: 2026 });
    expect(result).toBe('Budi_BPA1_2026_12.pdf');
  });

  it('should sanitize employee name in filename', () => {
    const result = generateBPA1Filename('Budi S. (Jr.)', { month: 6, year: 2026 });
    expect(result).toBe('Budi_S_Jr_BPA1_2026_06.pdf');
  });

  it('should handle name with special characters', () => {
    const result = generateBPA1Filename("M. Syafi'i", { month: 7, year: 2026 });
    expect(result).toBe('M_Syafii_BPA1_2026_07.pdf');
  });

  it('should always end with .pdf extension', () => {
    const result = generateBPA1Filename('Test', { month: 5, year: 2026 });
    expect(result).toMatch(/\.pdf$/);
  });

  it('should always contain _BPA1_ in filename', () => {
    const result = generateBPA1Filename('Any Name', { month: 9, year: 2026 });
    expect(result).toContain('_BPA1_');
  });
});

// === generateBPA1Data Tests ===

describe('generateBPA1Data', () => {
  it('should return correct BPA1Data for valid inputs', () => {
    const result = generateBPA1Data(validEmployee, validCompany, validPeriod);

    expect(result).toEqual({
      nama_karyawan: 'Budi Santoso',
      nik: '3201234567890001',
      ptkp_status: 'TK/0',
      masa_pajak_bulan: 3,
      masa_pajak_tahun: 2026,
      penghasilan_bruto: 10000000,
      pph21: 250000,
      nama_pemotong: 'PT Maju Jaya',
      npwp_pemotong: '01.234.567.8-901.000',
    });
  });

  it('should round gross_income to integer', () => {
    const employee = { ...validEmployee, gross_income: 10000000.7 };
    const result = generateBPA1Data(employee, validCompany, validPeriod);
    expect(result.penghasilan_bruto).toBe(10000001);
  });

  it('should round pph21 to integer', () => {
    const employee = { ...validEmployee, pph21: 250000.4 };
    const result = generateBPA1Data(employee, validCompany, validPeriod);
    expect(result.pph21).toBe(250000);
  });

  it('should trim whitespace from nama_karyawan', () => {
    const employee = { ...validEmployee, nama: '  Budi Santoso  ' };
    const result = generateBPA1Data(employee, validCompany, validPeriod);
    expect(result.nama_karyawan).toBe('Budi Santoso');
  });

  it('should trim whitespace from nama_pemotong', () => {
    const company = { ...validCompany, nama_perusahaan: '  PT Maju Jaya  ' };
    const result = generateBPA1Data(validEmployee, company, validPeriod);
    expect(result.nama_pemotong).toBe('PT Maju Jaya');
  });

  it('should allow zero gross_income', () => {
    const employee = { ...validEmployee, gross_income: 0 };
    const result = generateBPA1Data(employee, validCompany, validPeriod);
    expect(result.penghasilan_bruto).toBe(0);
  });

  it('should allow zero pph21', () => {
    const employee = { ...validEmployee, pph21: 0 };
    const result = generateBPA1Data(employee, validCompany, validPeriod);
    expect(result.pph21).toBe(0);
  });

  // === Validation Error Cases ===

  it('should throw BPA1ValidationError for empty employee name', () => {
    const employee = { ...validEmployee, nama: '' };
    expect(() => generateBPA1Data(employee, validCompany, validPeriod))
      .toThrow(BPA1ValidationError);
  });

  it('should throw BPA1ValidationError for whitespace-only employee name', () => {
    const employee = { ...validEmployee, nama: '   ' };
    expect(() => generateBPA1Data(employee, validCompany, validPeriod))
      .toThrow(BPA1ValidationError);
  });

  it('should throw BPA1ValidationError for invalid NIK (not 16 digits)', () => {
    const employee = { ...validEmployee, nik: '12345' };
    expect(() => generateBPA1Data(employee, validCompany, validPeriod))
      .toThrow(BPA1ValidationError);
  });

  it('should throw BPA1ValidationError for NIK with non-numeric characters', () => {
    const employee = { ...validEmployee, nik: '320123456789ABCD' };
    expect(() => generateBPA1Data(employee, validCompany, validPeriod))
      .toThrow(BPA1ValidationError);
  });

  it('should throw BPA1ValidationError for empty NIK', () => {
    const employee = { ...validEmployee, nik: '' };
    expect(() => generateBPA1Data(employee, validCompany, validPeriod))
      .toThrow(BPA1ValidationError);
  });

  it('should throw BPA1ValidationError for empty ptkp_status', () => {
    const employee = { ...validEmployee, ptkp_status: '' };
    expect(() => generateBPA1Data(employee, validCompany, validPeriod))
      .toThrow(BPA1ValidationError);
  });

  it('should throw BPA1ValidationError for negative gross_income', () => {
    const employee = { ...validEmployee, gross_income: -1000 };
    expect(() => generateBPA1Data(employee, validCompany, validPeriod))
      .toThrow(BPA1ValidationError);
  });

  it('should throw BPA1ValidationError for negative pph21', () => {
    const employee = { ...validEmployee, pph21: -500 };
    expect(() => generateBPA1Data(employee, validCompany, validPeriod))
      .toThrow(BPA1ValidationError);
  });

  it('should throw BPA1ValidationError for empty company name', () => {
    const company = { ...validCompany, nama_perusahaan: '' };
    expect(() => generateBPA1Data(validEmployee, company, validPeriod))
      .toThrow(BPA1ValidationError);
  });

  it('should throw BPA1ValidationError for empty NPWP', () => {
    const company = { ...validCompany, npwp_badan: '' };
    expect(() => generateBPA1Data(validEmployee, company, validPeriod))
      .toThrow(BPA1ValidationError);
  });

  it('should throw BPA1ValidationError for invalid month (0)', () => {
    const period = { month: 0, year: 2026 };
    expect(() => generateBPA1Data(validEmployee, validCompany, period))
      .toThrow(BPA1ValidationError);
  });

  it('should throw BPA1ValidationError for invalid month (13)', () => {
    const period = { month: 13, year: 2026 };
    expect(() => generateBPA1Data(validEmployee, validCompany, period))
      .toThrow(BPA1ValidationError);
  });

  it('should throw BPA1ValidationError for invalid year (< 2024)', () => {
    const period = { month: 1, year: 2023 };
    expect(() => generateBPA1Data(validEmployee, validCompany, period))
      .toThrow(BPA1ValidationError);
  });

  it('should throw BPA1ValidationError for Infinity gross_income', () => {
    const employee = { ...validEmployee, gross_income: Infinity };
    expect(() => generateBPA1Data(employee, validCompany, validPeriod))
      .toThrow(BPA1ValidationError);
  });

  it('should throw BPA1ValidationError for NaN pph21', () => {
    const employee = { ...validEmployee, pph21: NaN };
    expect(() => generateBPA1Data(employee, validCompany, validPeriod))
      .toThrow(BPA1ValidationError);
  });
});

// === formatRupiah Tests ===

describe('formatRupiah', () => {
  it('should format zero correctly', () => {
    expect(formatRupiah(0)).toBe('Rp 0');
  });

  it('should format millions with thousand separators', () => {
    const result = formatRupiah(10000000);
    // Indonesian locale uses dot as thousand separator
    expect(result).toBe('Rp 10.000.000');
  });

  it('should round decimal values', () => {
    const result = formatRupiah(250000.7);
    expect(result).toBe('Rp 250.001');
  });

  it('should handle small amounts', () => {
    const result = formatRupiah(500);
    expect(result).toBe('Rp 500');
  });
});

// === formatBulan Tests ===

describe('formatBulan', () => {
  it('should return Januari for month 1', () => {
    expect(formatBulan(1)).toBe('Januari');
  });

  it('should return Desember for month 12', () => {
    expect(formatBulan(12)).toBe('Desember');
  });

  it('should return Juni for month 6', () => {
    expect(formatBulan(6)).toBe('Juni');
  });

  it('should return empty string for invalid month 0', () => {
    expect(formatBulan(0)).toBe('');
  });

  it('should return empty string for invalid month 13', () => {
    expect(formatBulan(13)).toBe('');
  });

  it('should return all 12 months correctly', () => {
    const expected = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    for (let i = 1; i <= 12; i++) {
      expect(formatBulan(i)).toBe(expected[i - 1]);
    }
  });
});

// === BPA1Data field completeness test ===

describe('BPA1Data field completeness (Persyaratan 6.2)', () => {
  it('should contain all 8 mandatory BPA1 fields', () => {
    const result = generateBPA1Data(validEmployee, validCompany, validPeriod);

    // Field 1: Nama Karyawan
    expect(result.nama_karyawan).toBeDefined();
    expect(result.nama_karyawan).not.toBe('');

    // Field 2: NIK 16 digit
    expect(result.nik).toBeDefined();
    expect(result.nik).toMatch(/^\d{16}$/);

    // Field 3: Status PTKP
    expect(result.ptkp_status).toBeDefined();
    expect(result.ptkp_status).not.toBe('');

    // Field 4: Masa Pajak (bulan dan tahun)
    expect(result.masa_pajak_bulan).toBeGreaterThanOrEqual(1);
    expect(result.masa_pajak_bulan).toBeLessThanOrEqual(12);
    expect(result.masa_pajak_tahun).toBeGreaterThanOrEqual(2024);

    // Field 5: Penghasilan Bruto
    expect(result.penghasilan_bruto).toBeDefined();
    expect(Number.isInteger(result.penghasilan_bruto)).toBe(true);

    // Field 6: Potongan PPh 21
    expect(result.pph21).toBeDefined();
    expect(Number.isInteger(result.pph21)).toBe(true);

    // Field 7: Nama Pemotong Pajak
    expect(result.nama_pemotong).toBeDefined();
    expect(result.nama_pemotong).not.toBe('');

    // Field 8: NPWP Pemotong Pajak
    expect(result.npwp_pemotong).toBeDefined();
    expect(result.npwp_pemotong).not.toBe('');
  });
});
