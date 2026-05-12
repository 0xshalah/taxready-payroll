/**
 * CRUD hooks untuk manajemen karyawan dengan enkripsi/dekripsi
 * Validates: Persyaratan 1.5, 8.1, 8.5, 8.7
 *
 * - Enkripsi NIK dan gaji_pokok saat simpan (via Supabase RPC encrypt_value)
 * - Dekripsi NIK dan gaji_pokok saat baca (via Supabase RPC decrypt_value)
 * - Masking NIK untuk role Regular Staff (hanya 4 digit terakhir)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { maskNIK } from '@/lib/encryption';
import type { Employee, EmployeeFormData } from '@/types/employee';
import type { UserRole } from '@/types/auth';

/** Kunci enkripsi dari environment variable */
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

/** Query key untuk cache TanStack Query */
const EMPLOYEES_QUERY_KEY = ['employees'] as const;

/**
 * Tipe data mentah dari database (sebelum dekripsi)
 */
interface EmployeeRawRow {
  id: string;
  company_id: string;
  nik_encrypted: string; // base64 encoded bytea
  nama_lengkap: string;
  ptkp_status: string;
  tanggal_bergabung: string;
  jabatan: string;
  gaji_pokok_encrypted: string; // base64 encoded bytea
  tunjangan_tetap: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Enkripsi sebuah nilai menggunakan Supabase RPC encrypt_value
 * @param plainText - Nilai plaintext yang akan dienkripsi
 * @returns Nilai terenkripsi (bytea)
 */
async function encryptValue(plainText: string): Promise<string> {
  if (!ENCRYPTION_KEY) {
    throw new Error('VITE_ENCRYPTION_KEY tidak dikonfigurasi. Periksa file .env');
  }

  const { data, error } = await supabase.rpc('encrypt_value', {
    plain_text: plainText,
    encryption_key: ENCRYPTION_KEY,
  });

  if (error) {
    throw new Error(`Enkripsi gagal: ${error.message}`);
  }

  return data;
}

/**
 * Dekripsi sebuah nilai menggunakan Supabase RPC decrypt_value
 * @param encryptedData - Nilai terenkripsi (bytea)
 * @returns Nilai plaintext
 */
async function decryptValue(encryptedData: string): Promise<string> {
  if (!ENCRYPTION_KEY) {
    throw new Error('VITE_ENCRYPTION_KEY tidak dikonfigurasi. Periksa file .env');
  }

  const { data, error } = await supabase.rpc('decrypt_value', {
    encrypted_data: encryptedData,
    encryption_key: ENCRYPTION_KEY,
  });

  if (error) {
    throw new Error(`Dekripsi gagal: ${error.message}`);
  }

  return data;
}

/**
 * Dekripsi satu baris data karyawan dari database
 * @param row - Data mentah dari database
 * @param userRole - Role pengguna saat ini (untuk masking)
 * @returns Data karyawan yang sudah didekripsi
 */
async function decryptEmployeeRow(
  row: EmployeeRawRow,
  userRole: UserRole
): Promise<Employee> {
  // Dekripsi NIK
  const nikPlain = await decryptValue(row.nik_encrypted);

  // Dekripsi gaji_pokok
  const gajiPokokPlain = await decryptValue(row.gaji_pokok_encrypted);

  // Masking NIK untuk Regular Staff (Persyaratan 8.7)
  const nikDisplay = userRole === 'regular_staff' ? maskNIK(nikPlain) : nikPlain;

  return {
    id: row.id,
    company_id: row.company_id,
    nik: nikDisplay,
    nama_lengkap: row.nama_lengkap,
    ptkp_status: row.ptkp_status as Employee['ptkp_status'],
    tanggal_bergabung: row.tanggal_bergabung,
    jabatan: row.jabatan,
    gaji_pokok: Number(gajiPokokPlain),
    tunjangan_tetap: row.tunjangan_tetap,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Fetch dan dekripsi seluruh karyawan aktif
 */
async function fetchEmployees(userRole: UserRole): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('nama_lengkap', { ascending: true });

  if (error) {
    throw new Error(`Gagal mengambil data karyawan: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Dekripsi semua baris secara paralel
  const decryptedEmployees = await Promise.all(
    data.map((row) => decryptEmployeeRow(row as EmployeeRawRow, userRole))
  );

  return decryptedEmployees;
}

/**
 * Buat karyawan baru dengan enkripsi NIK dan gaji_pokok
 */
async function createEmployee(formData: EmployeeFormData): Promise<Employee> {
  // Enkripsi NIK dan gaji_pokok sebelum simpan
  const [nikEncrypted, gajiPokokEncrypted] = await Promise.all([
    encryptValue(formData.nik),
    encryptValue(String(formData.gaji_pokok)),
  ]);

  const { data, error } = await supabase
    .from('employees')
    .insert({
      nik_encrypted: nikEncrypted,
      nama_lengkap: formData.nama_lengkap,
      ptkp_status: formData.ptkp_status,
      tanggal_bergabung: formData.tanggal_bergabung,
      jabatan: formData.jabatan,
      gaji_pokok_encrypted: gajiPokokEncrypted,
      tunjangan_tetap: formData.tunjangan_tetap,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Gagal menyimpan data karyawan: ${error.message}`);
  }

  // Dekripsi row yang baru dibuat untuk return
  const decrypted = await decryptEmployeeRow(data as EmployeeRawRow, 'owner');
  return decrypted;
}

/**
 * Update data karyawan dengan enkripsi NIK dan gaji_pokok
 */
async function updateEmployee(
  id: string,
  formData: EmployeeFormData
): Promise<Employee> {
  // Enkripsi NIK dan gaji_pokok sebelum update
  const [nikEncrypted, gajiPokokEncrypted] = await Promise.all([
    encryptValue(formData.nik),
    encryptValue(String(formData.gaji_pokok)),
  ]);

  const { data, error } = await supabase
    .from('employees')
    .update({
      nik_encrypted: nikEncrypted,
      nama_lengkap: formData.nama_lengkap,
      ptkp_status: formData.ptkp_status,
      tanggal_bergabung: formData.tanggal_bergabung,
      jabatan: formData.jabatan,
      gaji_pokok_encrypted: gajiPokokEncrypted,
      tunjangan_tetap: formData.tunjangan_tetap,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Gagal memperbarui data karyawan: ${error.message}`);
  }

  const decrypted = await decryptEmployeeRow(data as EmployeeRawRow, 'owner');
  return decrypted;
}

/**
 * Hapus karyawan (soft delete: set is_active = false)
 */
async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Gagal menghapus data karyawan: ${error.message}`);
  }
}

// ============================================================
// Exported Hooks
// ============================================================

/**
 * Hook untuk fetch daftar karyawan dengan dekripsi otomatis
 *
 * @param userRole - Role pengguna saat ini (untuk masking NIK)
 * @returns TanStack Query result dengan data Employee[]
 */
export function useEmployees(userRole: UserRole) {
  return useQuery<Employee[], Error>({
    queryKey: [...EMPLOYEES_QUERY_KEY, userRole],
    queryFn: () => fetchEmployees(userRole),
    staleTime: 5 * 60 * 1000, // 5 menit
  });
}

/**
 * Hook untuk membuat karyawan baru dengan enkripsi otomatis
 *
 * @returns TanStack Query mutation
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation<Employee, Error, EmployeeFormData>({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
    },
  });
}

/**
 * Hook untuk memperbarui data karyawan dengan enkripsi otomatis
 *
 * @returns TanStack Query mutation
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation<Employee, Error, { id: string; data: EmployeeFormData }>({
    mutationFn: ({ id, data }) => updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
    },
  });
}

/**
 * Hook untuk menghapus karyawan
 *
 * @returns TanStack Query mutation
 */
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
    },
  });
}
