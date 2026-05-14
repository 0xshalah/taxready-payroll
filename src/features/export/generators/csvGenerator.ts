/**
 * Generator CSV untuk ekspor laporan bulanan format Coretax
 * Validates: Persyaratan 5.1, 5.2, 5.3, 5.4
 * Validates: Fitur Transparansi #2 (disclaimer), #4 (metadata versi tarif + timestamp)
 *
 * File ekspor Coretax HANYA mengandung 4 field:
 * 1. NIK (16 digit)
 * 2. Nama Lengkap
 * 3. Penghasilan Bruto (angka bulat)
 * 4. Potongan PPh 21 (angka bulat)
 *
 * Ditambahkan metadata header berisi versi tarif, timestamp, dan disclaimer.
 */

import { createExportMetadata, formatMetadataAsCSVComments } from './exportMetadata';

/** Record data untuk ekspor Coretax */
export interface ExportRecord {
  nik: string;
  nama_lengkap: string;
  gross_income: number;
  pph21: number;
}

/** Periode ekspor */
export interface ExportPeriod {
  month: number; // 1-12
  year: number;
}

/** Hasil validasi pra-ekspor */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/** Detail error validasi */
export interface ValidationError {
  index: number;
  nama: string;
  field: string;
  message: string;
}

/** Hasil generate file */
export interface GeneratedFile {
  filename: string;
  content: string;
}

/**
 * Sanitasi nama perusahaan untuk digunakan sebagai nama file.
 * Menghapus karakter spesial, hanya menyisakan alfanumerik, spasi, dan dash.
 * Spasi diganti dengan underscore.
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s\-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Validasi records sebelum ekspor.
 * Memastikan NIK 16 digit dan semua field terisi.
 */
export function validateExportRecords(records: ExportRecord[]): ValidationResult {
  const errors: ValidationError[] = [];

  if (records.length === 0) {
    return { valid: false, errors: [{ index: -1, nama: '', field: 'records', message: 'Tidak ada data karyawan untuk diekspor' }] };
  }

  records.forEach((record, index) => {
    // Validasi NIK: harus tepat 16 digit angka
    if (!record.nik) {
      errors.push({ index, nama: record.nama_lengkap || `Karyawan #${index + 1}`, field: 'nik', message: 'NIK tidak boleh kosong' });
    } else if (!/^\d{16}$/.test(record.nik)) {
      errors.push({ index, nama: record.nama_lengkap || `Karyawan #${index + 1}`, field: 'nik', message: 'NIK harus terdiri dari tepat 16 digit angka' });
    }

    // Validasi Nama Lengkap
    if (!record.nama_lengkap || record.nama_lengkap.trim() === '') {
      errors.push({ index, nama: `Karyawan #${index + 1}`, field: 'nama_lengkap', message: 'Nama lengkap tidak boleh kosong' });
    }

    // Validasi Penghasilan Bruto
    if (record.gross_income === undefined || record.gross_income === null) {
      errors.push({ index, nama: record.nama_lengkap || `Karyawan #${index + 1}`, field: 'gross_income', message: 'Penghasilan bruto tidak boleh kosong' });
    } else if (!Number.isFinite(record.gross_income) || record.gross_income < 0) {
      errors.push({ index, nama: record.nama_lengkap || `Karyawan #${index + 1}`, field: 'gross_income', message: 'Penghasilan bruto harus berupa angka positif' });
    }

    // Validasi PPh 21
    if (record.pph21 === undefined || record.pph21 === null) {
      errors.push({ index, nama: record.nama_lengkap || `Karyawan #${index + 1}`, field: 'pph21', message: 'Potongan PPh 21 tidak boleh kosong' });
    } else if (!Number.isFinite(record.pph21) || record.pph21 < 0) {
      errors.push({ index, nama: record.nama_lengkap || `Karyawan #${index + 1}`, field: 'pph21', message: 'Potongan PPh 21 harus berupa angka positif atau nol' });
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Generate file CSV format Coretax.
 * Format: comma-separated, dengan header row.
 * Field: NIK, Nama Lengkap, Penghasilan Bruto, Potongan PPh 21
 * Includes: metadata comments (versi tarif, timestamp, disclaimer)
 */
export function generateCoretaxCSV(
  companyName: string,
  period: ExportPeriod,
  records: ExportRecord[]
): GeneratedFile {
  // Validasi pra-ekspor
  const validation = validateExportRecords(records);
  if (!validation.valid) {
    throw new ExportValidationError('Data tidak valid untuk ekspor', validation.errors);
  }

  // Generate filename: [NamaPerusahaan]_[YYYY]_[MM].csv
  const sanitizedName = sanitizeFilename(companyName);
  const monthStr = String(period.month).padStart(2, '0');
  const filename = `${sanitizedName}_${period.year}_${monthStr}.csv`;

  // Generate metadata header
  const metadata = createExportMetadata(period.month, period.year, companyName);
  const metadataComments = formatMetadataAsCSVComments(metadata);

  // Generate CSV content
  const header = 'NIK,Nama Lengkap,Penghasilan Bruto,Potongan PPh 21';
  const rows = records.map(record => {
    const nik = record.nik;
    const nama = escapeCSVField(record.nama_lengkap);
    const bruto = Math.round(record.gross_income);
    const pph21 = Math.round(record.pph21);
    return `${nik},${nama},${bruto},${pph21}`;
  });

  const content = [metadataComments, header, ...rows].join('\n');

  return { filename, content };
}

/**
 * Escape field CSV jika mengandung koma, kutip, atau newline.
 */
function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Custom error class untuk validasi ekspor
 */
export class ExportValidationError extends Error {
  public readonly errors: ValidationError[];

  constructor(message: string, errors: ValidationError[]) {
    super(message);
    this.name = 'ExportValidationError';
    this.errors = errors;
  }
}
