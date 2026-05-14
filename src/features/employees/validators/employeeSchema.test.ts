/**
 * Unit tests untuk validasi data karyawan
 * Validates: Persyaratan 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

import { describe, it, expect } from 'vitest';
import {
  employeeFormSchema,
  validateNIK,
  validateEmployeeForPayroll,
} from './employeeSchema';

describe('employeeFormSchema', () => {
  const validData = {
    nik: '3201231505950001',
    nama_lengkap: 'Budi Santoso',
    ptkp_status: 'TK/0' as const,
    tanggal_bergabung: '2024-01-15',
    jabatan: 'Software Engineer',
    gaji_pokok: 5_000_000,
    tunjangan_tetap: 500_000,
  };

  it('should accept valid employee data', () => {
    const result = employeeFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject NIK with less than 16 digits', () => {
    const result = employeeFormSchema.safeParse({
      ...validData,
      nik: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('should reject NIK with more than 16 digits', () => {
    const result = employeeFormSchema.safeParse({
      ...validData,
      nik: '12345678901234567',
    });
    expect(result.success).toBe(false);
  });

  it('should reject NIK with non-numeric characters', () => {
    const result = employeeFormSchema.safeParse({
      ...validData,
      nik: '320123456789ABCD',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty NIK', () => {
    const result = employeeFormSchema.safeParse({
      ...validData,
      nik: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject nama_lengkap exceeding 150 characters', () => {
    const result = employeeFormSchema.safeParse({
      ...validData,
      nama_lengkap: 'A'.repeat(151),
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty nama_lengkap', () => {
    const result = employeeFormSchema.safeParse({
      ...validData,
      nama_lengkap: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid ptkp_status', () => {
    const result = employeeFormSchema.safeParse({
      ...validData,
      ptkp_status: 'INVALID',
    });
    expect(result.success).toBe(false);
  });

  it('should accept all valid PTKP statuses', () => {
    const validStatuses = ['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3'];
    for (const status of validStatuses) {
      const result = employeeFormSchema.safeParse({
        ...validData,
        ptkp_status: status,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid date format', () => {
    const result = employeeFormSchema.safeParse({
      ...validData,
      tanggal_bergabung: '15-01-2024',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty tanggal_bergabung', () => {
    const result = employeeFormSchema.safeParse({
      ...validData,
      tanggal_bergabung: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject jabatan exceeding 100 characters', () => {
    const result = employeeFormSchema.safeParse({
      ...validData,
      jabatan: 'A'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('should reject gaji_pokok below minimum (Rp100.000)', () => {
    const result = employeeFormSchema.safeParse({
      ...validData,
      gaji_pokok: 99_999,
    });
    expect(result.success).toBe(false);
  });

  it('should reject gaji_pokok above maximum (Rp999.999.999)', () => {
    const result = employeeFormSchema.safeParse({
      ...validData,
      gaji_pokok: 1_000_000_000,
    });
    expect(result.success).toBe(false);
  });

  it('should accept gaji_pokok at minimum boundary', () => {
    const result = employeeFormSchema.safeParse({
      ...validData,
      gaji_pokok: 100_000,
    });
    expect(result.success).toBe(true);
  });

  it('should accept gaji_pokok at maximum boundary', () => {
    const result = employeeFormSchema.safeParse({
      ...validData,
      gaji_pokok: 999_999_999,
    });
    expect(result.success).toBe(true);
  });

  it('should default tunjangan_tetap to 0 when not provided', () => {
    const { tunjangan_tetap, ...dataWithoutTunjangan } = validData;
    void tunjangan_tetap;
    const result = employeeFormSchema.safeParse(dataWithoutTunjangan);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tunjangan_tetap).toBe(0);
    }
  });

  it('should reject negative tunjangan_tetap', () => {
    const result = employeeFormSchema.safeParse({
      ...validData,
      tunjangan_tetap: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe('validateNIK', () => {
  it('should return valid for correct 16-digit NIK', () => {
    const result = validateNIK('3201231505950001');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return error for empty NIK', () => {
    const result = validateNIK('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('NIK wajib diisi');
  });

  it('should return error for whitespace-only NIK', () => {
    const result = validateNIK('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('NIK wajib diisi');
  });

  it('should return error for NIK with non-numeric characters', () => {
    const result = validateNIK('3201ABCD56789012');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('NIK hanya boleh berisi angka');
  });

  it('should return error for NIK with special characters', () => {
    const result = validateNIK('3201-2345-6789-01');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('NIK hanya boleh berisi angka');
  });

  it('should return error for NIK shorter than 16 digits', () => {
    const result = validateNIK('320123456789');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('NIK harus terdiri dari 16 digit angka');
  });

  it('should return error for NIK longer than 16 digits', () => {
    const result = validateNIK('32012315059500014');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('NIK harus terdiri dari 16 digit angka');
  });

  it('should trim whitespace before validation', () => {
    const result = validateNIK(' 3201231505950001 ');
    expect(result.valid).toBe(true);
  });
});

describe('validateEmployeeForPayroll', () => {
  const validEmployee = {
    nik: '3201231505950001',
    nama_lengkap: 'Budi Santoso',
    ptkp_status: 'TK/0',
    tanggal_bergabung: '2024-01-15',
    jabatan: 'Software Engineer',
    gaji_pokok: 5_000_000,
  };

  it('should return valid for complete employee data', () => {
    const result = validateEmployeeForPayroll(validEmployee);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing NIK', () => {
    const result = validateEmployeeForPayroll({
      ...validEmployee,
      nik: undefined,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'nik',
      message: 'NIK wajib diisi',
    });
  });

  it('should detect invalid NIK', () => {
    const result = validateEmployeeForPayroll({
      ...validEmployee,
      nik: '12345',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'nik')).toBe(true);
  });

  it('should detect missing nama_lengkap', () => {
    const result = validateEmployeeForPayroll({
      ...validEmployee,
      nama_lengkap: undefined,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'nama_lengkap',
      message: 'Nama lengkap wajib diisi',
    });
  });

  it('should detect missing ptkp_status', () => {
    const result = validateEmployeeForPayroll({
      ...validEmployee,
      ptkp_status: undefined,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'ptkp_status',
      message: 'Status PTKP wajib dipilih',
    });
  });

  it('should detect invalid ptkp_status', () => {
    const result = validateEmployeeForPayroll({
      ...validEmployee,
      ptkp_status: 'INVALID',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'ptkp_status',
      message: 'Status PTKP tidak valid',
    });
  });

  it('should detect missing tanggal_bergabung', () => {
    const result = validateEmployeeForPayroll({
      ...validEmployee,
      tanggal_bergabung: undefined,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'tanggal_bergabung',
      message: 'Tanggal bergabung wajib diisi',
    });
  });

  it('should detect missing jabatan', () => {
    const result = validateEmployeeForPayroll({
      ...validEmployee,
      jabatan: undefined,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'jabatan',
      message: 'Jabatan wajib diisi',
    });
  });

  it('should detect missing gaji_pokok', () => {
    const result = validateEmployeeForPayroll({
      ...validEmployee,
      gaji_pokok: undefined,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'gaji_pokok',
      message: 'Gaji pokok wajib diisi',
    });
  });

  it('should detect gaji_pokok below minimum', () => {
    const result = validateEmployeeForPayroll({
      ...validEmployee,
      gaji_pokok: 50_000,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'gaji_pokok')).toBe(true);
  });

  it('should detect gaji_pokok above maximum', () => {
    const result = validateEmployeeForPayroll({
      ...validEmployee,
      gaji_pokok: 1_000_000_000,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'gaji_pokok')).toBe(true);
  });

  it('should detect multiple missing fields', () => {
    const result = validateEmployeeForPayroll({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(6);
  });

  it('should detect nama_lengkap exceeding max length', () => {
    const result = validateEmployeeForPayroll({
      ...validEmployee,
      nama_lengkap: 'A'.repeat(151),
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'nama_lengkap')).toBe(true);
  });

  it('should detect jabatan exceeding max length', () => {
    const result = validateEmployeeForPayroll({
      ...validEmployee,
      jabatan: 'A'.repeat(101),
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'jabatan')).toBe(true);
  });
});
