/**
 * Client-side masking helpers untuk data sensitif
 * Validates: Persyaratan 8.7
 *
 * Catatan: Enkripsi sesungguhnya dilakukan di database (pgcrypto).
 * File ini hanya berisi helper untuk masking tampilan di client-side.
 */

import { NIK_LENGTH } from '@/lib/constants';

/**
 * Mask NIK sehingga hanya menampilkan 4 digit terakhir.
 * Contoh: "1234567890123456" → "************3456"
 *
 * @param nik - NIK 16 digit dalam bentuk plaintext
 * @returns NIK yang sudah di-mask, atau string kosong jika input tidak valid
 */
export function maskNIK(nik: string): string {
  if (!nik || nik.length < 4) {
    return '';
  }

  const visibleDigits = 4;
  const maskedLength = nik.length - visibleDigits;
  const masked = '*'.repeat(maskedLength) + nik.slice(-visibleDigits);

  return masked;
}

/**
 * Cek apakah NIK sudah dalam bentuk masked (mengandung asterisk).
 *
 * @param value - String yang akan dicek
 * @returns true jika value sudah di-mask
 */
export function isNIKMasked(value: string): boolean {
  return value.includes('*');
}

/**
 * Validasi format NIK (16 digit angka).
 *
 * @param nik - String yang akan divalidasi
 * @returns true jika NIK valid (tepat 16 digit angka)
 */
export function isValidNIKFormat(nik: string): boolean {
  const nikRegex = new RegExp(`^\\d{${NIK_LENGTH}}$`);
  return nikRegex.test(nik);
}
