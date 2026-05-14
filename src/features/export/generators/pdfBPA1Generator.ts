/**
 * Generator PDF BPA1 (Bukti Potong A1) untuk setiap karyawan
 * Menggunakan @react-pdf/renderer untuk generate PDF di client-side (browser)
 * Validates: Persyaratan 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';

// === Types ===

/** Data input untuk generate BPA1 */
export interface BPA1EmployeeInput {
  nama: string;
  nik: string;
  ptkp_status: string;
  gross_income: number;
  pph21: number;
}

/** Data perusahaan pemotong pajak */
export interface BPA1CompanyInput {
  nama_perusahaan: string;
  npwp_badan: string;
}

/** Periode pajak */
export interface BPA1Period {
  month: number; // 1-12
  year: number;
}

/** Data lengkap BPA1 yang siap di-render ke PDF */
export interface BPA1Data {
  nama_karyawan: string;
  nik: string;
  ptkp_status: string;
  masa_pajak_bulan: number;
  masa_pajak_tahun: number;
  penghasilan_bruto: number;
  pph21: number;
  nama_pemotong: string;
  npwp_pemotong: string;
}

/** Hasil generate PDF */
export interface BPA1GeneratedFile {
  filename: string;
  blob: Blob;
}

/** Error saat generate BPA1 */
export interface BPA1GenerateError {
  nama: string;
  message: string;
}

// === Helper Functions ===

/**
 * Sanitasi nama karyawan untuk digunakan sebagai nama file.
 * Menghapus karakter spesial, hanya menyisakan alfanumerik dan spasi.
 * Spasi diganti dengan underscore.
 */
export function sanitizeEmployeeName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Generate nama file BPA1 sesuai konvensi: [NamaKaryawan]_BPA1_[YYYY]_[MM].pdf
 */
export function generateBPA1Filename(employeeName: string, period: BPA1Period): string {
  const sanitizedName = sanitizeEmployeeName(employeeName);
  const monthStr = String(period.month).padStart(2, '0');
  return `${sanitizedName}_BPA1_${period.year}_${monthStr}.pdf`;
}

/**
 * Menyiapkan data BPA1 dari input karyawan dan perusahaan.
 * Memvalidasi kelengkapan data sebelum generate.
 */
export function generateBPA1Data(
  employee: BPA1EmployeeInput,
  company: BPA1CompanyInput,
  period: BPA1Period
): BPA1Data {
  // Validasi field wajib karyawan
  if (!employee.nama || employee.nama.trim() === '') {
    throw new BPA1ValidationError('Nama karyawan tidak boleh kosong');
  }
  if (!employee.nik || !/^\d{16}$/.test(employee.nik)) {
    throw new BPA1ValidationError(`NIK karyawan "${employee.nama}" harus terdiri dari tepat 16 digit angka`);
  }
  if (!employee.ptkp_status || employee.ptkp_status.trim() === '') {
    throw new BPA1ValidationError(`Status PTKP karyawan "${employee.nama}" tidak boleh kosong`);
  }
  if (employee.gross_income === undefined || employee.gross_income === null || !Number.isFinite(employee.gross_income) || employee.gross_income < 0) {
    throw new BPA1ValidationError(`Penghasilan bruto karyawan "${employee.nama}" harus berupa angka positif atau nol`);
  }
  if (employee.pph21 === undefined || employee.pph21 === null || !Number.isFinite(employee.pph21) || employee.pph21 < 0) {
    throw new BPA1ValidationError(`PPh 21 karyawan "${employee.nama}" harus berupa angka positif atau nol`);
  }

  // Validasi field wajib perusahaan
  if (!company.nama_perusahaan || company.nama_perusahaan.trim() === '') {
    throw new BPA1ValidationError('Nama perusahaan pemotong tidak boleh kosong');
  }
  if (!company.npwp_badan || company.npwp_badan.trim() === '') {
    throw new BPA1ValidationError('NPWP pemotong tidak boleh kosong');
  }

  // Validasi periode
  if (period.month < 1 || period.month > 12) {
    throw new BPA1ValidationError('Bulan masa pajak harus antara 1-12');
  }
  if (period.year < 2024) {
    throw new BPA1ValidationError('Tahun masa pajak tidak valid');
  }

  return {
    nama_karyawan: employee.nama.trim(),
    nik: employee.nik,
    ptkp_status: employee.ptkp_status.trim(),
    masa_pajak_bulan: period.month,
    masa_pajak_tahun: period.year,
    penghasilan_bruto: Math.round(employee.gross_income),
    pph21: Math.round(employee.pph21),
    nama_pemotong: company.nama_perusahaan.trim(),
    npwp_pemotong: company.npwp_badan.trim(),
  };
}

/**
 * Format angka ke format Rupiah (Rp 10.000.000)
 */
export function formatRupiah(amount: number): string {
  const rounded = Math.round(amount);
  return `Rp ${rounded.toLocaleString('id-ID')}`;
}

/**
 * Format bulan ke nama bulan Indonesia
 */
export function formatBulan(month: number): string {
  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return namaBulan[month - 1] ?? '';
}

// === PDF Styles ===

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#171717',
  },
  header: {
    marginBottom: 24,
    borderBottom: '2px solid #3ecf8e',
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    color: '#171717',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#707070',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: '#171717',
    backgroundColor: '#fafafa',
    padding: '4 8',
    borderLeft: '3px solid #3ecf8e',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  label: {
    width: '40%',
    fontSize: 10,
    color: '#707070',
  },
  value: {
    width: '60%',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#171717',
  },
  footer: {
    marginTop: 32,
    paddingTop: 12,
    borderTop: '1px solid #dfdfdf',
  },
  footerText: {
    fontSize: 8,
    color: '#9a9a9a',
    textAlign: 'center',
  },
  amountValue: {
    width: '60%',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#171717',
  },
});

// === PDF Document Component ===

/**
 * React component untuk render dokumen BPA1 sebagai PDF.
 * Menggunakan @react-pdf/renderer primitives.
 */
export function BPA1Document({ data }: { data: BPA1Data }) {
  const masaPajak = `${formatBulan(data.masa_pajak_bulan)} ${data.masa_pajak_tahun}`;

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.headerTitle }, 'BUKTI PEMOTONGAN PAJAK PENGHASILAN'),
        React.createElement(Text, { style: styles.headerSubtitle }, 'Pasal 21 (BPA1) — Formulir 1721-A1 Coretax')
      ),
      // Section: Data Karyawan
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'DATA PENERIMA PENGHASILAN'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Nama Karyawan'),
          React.createElement(Text, { style: styles.value }, data.nama_karyawan)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'NIK'),
          React.createElement(Text, { style: styles.value }, data.nik)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Status PTKP'),
          React.createElement(Text, { style: styles.value }, data.ptkp_status)
        )
      ),
      // Section: Masa Pajak
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'MASA PAJAK'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Masa Pajak'),
          React.createElement(Text, { style: styles.value }, masaPajak)
        )
      ),
      // Section: Penghasilan dan Pajak
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'PENGHASILAN DAN PAJAK'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Penghasilan Bruto'),
          React.createElement(Text, { style: styles.amountValue }, formatRupiah(data.penghasilan_bruto))
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'PPh Pasal 21 Dipotong'),
          React.createElement(Text, { style: styles.amountValue }, formatRupiah(data.pph21))
        )
      ),
      // Section: Pemotong Pajak
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'PEMOTONG PAJAK'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Nama Pemotong'),
          React.createElement(Text, { style: styles.value }, data.nama_pemotong)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'NPWP Pemotong'),
          React.createElement(Text, { style: styles.value }, data.npwp_pemotong)
        )
      ),
      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(
          Text,
          { style: styles.footerText },
          'Dasar Hukum: PP 58/2023 jo. PMK 168/2023 tentang Tarif Efektif Rata-rata (TER) PPh Pasal 21.'
        ),
        React.createElement(
          Text,
          { style: { ...styles.footerText, marginTop: 4 } },
          `Dokumen ini digenerate oleh Tax-Ready Payroll v0.1.0 pada ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
        ),
        React.createElement(
          Text,
          { style: { ...styles.footerText, marginTop: 4 } },
          'Disclaimer: Hasil perhitungan bersifat estimasi. Bukan nasihat pajak profesional. Pengguna bertanggung jawab atas kepatuhan pelaporan pajak.'
        )
      )
    )
  );
}

/**
 * Render BPA1 PDF menjadi Blob.
 * Menggunakan @react-pdf/renderer pdf() function untuk client-side generation.
 */
export async function renderBPA1PDF(data: BPA1Data): Promise<Blob> {
  const document = React.createElement(BPA1Document, { data });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(document as any).toBlob();
  return blob;
}

/**
 * Generate dan download satu file PDF BPA1 untuk satu karyawan.
 */
export async function downloadBPA1(
  employee: BPA1EmployeeInput,
  company: BPA1CompanyInput,
  period: BPA1Period
): Promise<BPA1GeneratedFile> {
  const data = generateBPA1Data(employee, company, period);
  const filename = generateBPA1Filename(employee.nama, period);
  const blob = await renderBPA1PDF(data);

  return { filename, blob };
}

/**
 * Generate BPA1 PDF untuk banyak karyawan.
 * Mengembalikan array hasil (berhasil) dan array error (gagal).
 * Kegagalan satu karyawan tidak menghentikan proses lainnya.
 */
export async function generateBulkBPA1(
  employees: BPA1EmployeeInput[],
  company: BPA1CompanyInput,
  period: BPA1Period
): Promise<{ files: BPA1GeneratedFile[]; errors: BPA1GenerateError[] }> {
  const files: BPA1GeneratedFile[] = [];
  const errors: BPA1GenerateError[] = [];

  for (const employee of employees) {
    try {
      const result = await downloadBPA1(employee, company, period);
      files.push(result);
    } catch (error) {
      errors.push({
        nama: employee.nama || 'Unknown',
        message: error instanceof Error ? error.message : 'Gagal generate PDF',
      });
    }
  }

  return { files, errors };
}

// === Custom Error ===

/**
 * Custom error class untuk validasi BPA1
 */
export class BPA1ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BPA1ValidationError';
  }
}
