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
 * Daftar kode provinsi yang valid di Indonesia (01-94)
 * Berdasarkan data Kemendagri/BPS
 */
const VALID_PROVINCE_CODES = new Set([
  '11','12','13','14','15','16','17','18','19',
  '21',
  '31','32','33','34','35','36',
  '51','52','53',
  '61','62','63','64','65',
  '71','72','73','74','75','76',
  '81','82',
  '91','92','93','94',
]);

/**
 * Validasi NIK secara standalone dengan pengecekan struktur
 * Format NIK: [PP][KK][CC][DDMMYY][XXXX]
 * - PP: kode provinsi (2 digit)
 * - KK: kode kabupaten/kota (2 digit)
 * - CC: kode kecamatan (2 digit)
 * - DDMMYY: tanggal lahir (DD+40 untuk perempuan)
 * - XXXX: nomor urut registrasi (4 digit)
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

  // Validasi kode provinsi (2 digit pertama)
  const provinceCode = trimmedNIK.substring(0, 2);
  if (!VALID_PROVINCE_CODES.has(provinceCode)) {
    return {
      valid: false,
      error: `Kode provinsi "${provinceCode}" tidak valid. Periksa 2 digit pertama NIK.`,
    };
  }

  // Validasi tanggal lahir (digit ke-7 sampai 12: DDMMYY)
  const dd = parseInt(trimmedNIK.substring(6, 8), 10);
  const mm = parseInt(trimmedNIK.substring(8, 10), 10);
  const yy = parseInt(trimmedNIK.substring(10, 12), 10);

  // DD: 01-31 untuk laki-laki, 41-71 untuk perempuan
  const isValidDD = (dd >= 1 && dd <= 31) || (dd >= 41 && dd <= 71);
  if (!isValidDD) {
    return {
      valid: false,
      error: `Tanggal lahir dalam NIK tidak valid (digit 7-8: "${trimmedNIK.substring(6, 8)}"). Harus 01-31 (L) atau 41-71 (P).`,
    };
  }

  // MM: 01-12
  if (mm < 1 || mm > 12) {
    return {
      valid: false,
      error: `Bulan lahir dalam NIK tidak valid (digit 9-10: "${trimmedNIK.substring(8, 10)}"). Harus 01-12.`,
    };
  }

  // YY: 00-99 (valid, karena bisa tahun 1900-an atau 2000-an)
  // Tapi kita bisa cek apakah masuk akal (usia 15-70 tahun untuk karyawan)
  const currentYear = new Date().getFullYear() % 100;
  const birthYear = yy <= currentYear ? 2000 + yy : 1900 + yy;
  const age = new Date().getFullYear() - birthYear;
  if (age < 15 || age > 80) {
    return {
      valid: false,
      error: `Tahun lahir dalam NIK menghasilkan usia ${age} tahun — tidak wajar untuk karyawan aktif.`,
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
