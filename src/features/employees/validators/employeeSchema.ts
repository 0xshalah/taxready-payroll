/**
 * Validasi data karyawan menggunakan Zod schema
 * Validates: Persyaratan 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

import { z } from 'zod';
import {
  NIK_LENGTH,
  MAX_NAMA_LENGTH,
  MAX_JABATAN_LENGTH,
  MIN_GAJI_POKOK,
  MAX_GAJI_POKOK,
  PTKP_VALUES,
} from '@/lib/constants';
import type { PTKPStatus } from '@/types/employee';

/**
 * Zod schema untuk validasi form data karyawan
 * Memvalidasi seluruh field wajib sesuai persyaratan Coretax DJP
 */
export const employeeFormSchema = z.object({
  nik: z
    .string({ required_error: 'NIK wajib diisi' })
    .min(1, { message: 'NIK wajib diisi' })
    .regex(/^\d+$/, { message: 'NIK hanya boleh berisi angka' })
    .length(NIK_LENGTH, {
      message: `NIK harus terdiri dari ${NIK_LENGTH} digit angka`,
    }),

  nama_lengkap: z
    .string({ required_error: 'Nama lengkap wajib diisi' })
    .min(1, { message: 'Nama lengkap wajib diisi' })
    .max(MAX_NAMA_LENGTH, {
      message: `Nama lengkap maksimal ${MAX_NAMA_LENGTH} karakter`,
    }),

  ptkp_status: z.enum(PTKP_VALUES as [PTKPStatus, ...PTKPStatus[]], {
    required_error: 'Status PTKP wajib dipilih',
    invalid_type_error: 'Status PTKP tidak valid',
    message: 'Status PTKP tidak valid. Pilih salah satu: TK/0, TK/1, TK/2, TK/3, K/0, K/1, K/2, K/3',
  }),

  tanggal_bergabung: z
    .string({ required_error: 'Tanggal bergabung wajib diisi' })
    .min(1, { message: 'Tanggal bergabung wajib diisi' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'Format tanggal harus YYYY-MM-DD',
    })
    .refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: 'Tanggal bergabung tidak valid' }
    ),

  jabatan: z
    .string({ required_error: 'Jabatan wajib diisi' })
    .min(1, { message: 'Jabatan wajib diisi' })
    .max(MAX_JABATAN_LENGTH, {
      message: `Jabatan maksimal ${MAX_JABATAN_LENGTH} karakter`,
    }),

  gaji_pokok: z
    .number({
      required_error: 'Gaji pokok wajib diisi',
      invalid_type_error: 'Gaji pokok harus berupa angka',
    })
    .min(MIN_GAJI_POKOK, {
      message: `Gaji pokok minimal Rp${MIN_GAJI_POKOK.toLocaleString('id-ID')}`,
    })
    .max(MAX_GAJI_POKOK, {
      message: `Gaji pokok maksimal Rp${MAX_GAJI_POKOK.toLocaleString('id-ID')}`,
    }),

  tunjangan_tetap: z
    .number({
      invalid_type_error: 'Tunjangan tetap harus berupa angka',
    })
    .min(0, { message: 'Tunjangan tetap tidak boleh negatif' })
    .default(0),
});

/** Type yang dihasilkan dari schema validasi */
export type EmployeeFormSchemaType = z.infer<typeof employeeFormSchema>;

/**
 * Hasil validasi NIK
 */
export interface NIKValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validasi NIK secara standalone
 * Memeriksa bahwa NIK terdiri dari tepat 16 digit angka
 *
 * @param nik - String NIK yang akan divalidasi
 * @returns Objek dengan status valid dan pesan error jika tidak valid
 *
 * Validates: Persyaratan 1.1, 1.2, 1.3
 */
export function validateNIK(nik: string): NIKValidationResult {
  if (!nik || nik.trim().length === 0) {
    return { valid: false, error: 'NIK wajib diisi' };
  }

  const trimmedNIK = nik.trim();

  // Cek apakah mengandung karakter non-numerik
  if (!/^\d+$/.test(trimmedNIK)) {
    return { valid: false, error: 'NIK hanya boleh berisi angka' };
  }

  // Cek panjang tepat 16 digit
  if (trimmedNIK.length !== NIK_LENGTH) {
    return {
      valid: false,
      error: `NIK harus terdiri dari ${NIK_LENGTH} digit angka`,
    };
  }

  return { valid: true };
}

/**
 * Hasil validasi karyawan untuk payroll
 */
export interface PayrollValidationResult {
  valid: boolean;
  errors: PayrollValidationError[];
}

export interface PayrollValidationError {
  field: string;
  message: string;
}

/**
 * Validasi data karyawan untuk kelayakan proses penggajian
 * Memeriksa bahwa seluruh field wajib terisi dan valid sebelum payroll diproses
 *
 * @param employee - Objek data karyawan yang akan divalidasi
 * @returns Objek dengan status valid dan daftar error jika ada
 *
 * Validates: Persyaratan 1.7, 1.8
 */
export function validateEmployeeForPayroll(employee: {
  nik?: string;
  nama_lengkap?: string;
  ptkp_status?: string;
  tanggal_bergabung?: string;
  jabatan?: string;
  gaji_pokok?: number;
}): PayrollValidationResult {
  const errors: PayrollValidationError[] = [];

  // Validasi NIK
  if (!employee.nik || employee.nik.trim().length === 0) {
    errors.push({ field: 'nik', message: 'NIK wajib diisi' });
  } else {
    const nikResult = validateNIK(employee.nik);
    if (!nikResult.valid) {
      errors.push({ field: 'nik', message: nikResult.error! });
    }
  }

  // Validasi nama_lengkap
  if (!employee.nama_lengkap || employee.nama_lengkap.trim().length === 0) {
    errors.push({ field: 'nama_lengkap', message: 'Nama lengkap wajib diisi' });
  } else if (employee.nama_lengkap.length > MAX_NAMA_LENGTH) {
    errors.push({
      field: 'nama_lengkap',
      message: `Nama lengkap maksimal ${MAX_NAMA_LENGTH} karakter`,
    });
  }

  // Validasi ptkp_status
  if (!employee.ptkp_status || employee.ptkp_status.trim().length === 0) {
    errors.push({ field: 'ptkp_status', message: 'Status PTKP wajib dipilih' });
  } else if (!PTKP_VALUES.includes(employee.ptkp_status as PTKPStatus)) {
    errors.push({
      field: 'ptkp_status',
      message: 'Status PTKP tidak valid',
    });
  }

  // Validasi tanggal_bergabung
  if (!employee.tanggal_bergabung || employee.tanggal_bergabung.trim().length === 0) {
    errors.push({
      field: 'tanggal_bergabung',
      message: 'Tanggal bergabung wajib diisi',
    });
  } else {
    const date = new Date(employee.tanggal_bergabung);
    if (isNaN(date.getTime())) {
      errors.push({
        field: 'tanggal_bergabung',
        message: 'Tanggal bergabung tidak valid',
      });
    }
  }

  // Validasi jabatan
  if (!employee.jabatan || employee.jabatan.trim().length === 0) {
    errors.push({ field: 'jabatan', message: 'Jabatan wajib diisi' });
  } else if (employee.jabatan.length > MAX_JABATAN_LENGTH) {
    errors.push({
      field: 'jabatan',
      message: `Jabatan maksimal ${MAX_JABATAN_LENGTH} karakter`,
    });
  }

  // Validasi gaji_pokok
  if (employee.gaji_pokok === undefined || employee.gaji_pokok === null) {
    errors.push({ field: 'gaji_pokok', message: 'Gaji pokok wajib diisi' });
  } else if (typeof employee.gaji_pokok !== 'number' || isNaN(employee.gaji_pokok)) {
    errors.push({ field: 'gaji_pokok', message: 'Gaji pokok harus berupa angka' });
  } else if (employee.gaji_pokok < MIN_GAJI_POKOK) {
    errors.push({
      field: 'gaji_pokok',
      message: `Gaji pokok minimal Rp${MIN_GAJI_POKOK.toLocaleString('id-ID')}`,
    });
  } else if (employee.gaji_pokok > MAX_GAJI_POKOK) {
    errors.push({
      field: 'gaji_pokok',
      message: `Gaji pokok maksimal Rp${MAX_GAJI_POKOK.toLocaleString('id-ID')}`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
