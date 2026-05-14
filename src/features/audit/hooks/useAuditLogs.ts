/**
 * Hook untuk fetch dan filter audit logs menggunakan TanStack Query
 * Validates: Persyaratan 10.6
 *
 * Fitur filter:
 * - Filter berdasarkan rentang tanggal (start_date, end_date)
 * - Filter berdasarkan action_type
 * - Filter berdasarkan user_id
 * - Pagination (limit/offset)
 *
 * Akses: Hanya Owner yang dapat membaca audit logs (RLS enforced)
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AuditActionType } from '@/lib/auditLogger';

// ============================================================
// Types
// ============================================================

export interface AuditLogFilters {
  /** Tanggal awal filter (ISO 8601 string, inclusive) */
  start_date?: string;
  /** Tanggal akhir filter (ISO 8601 string, inclusive) */
  end_date?: string;
  /** Filter berdasarkan jenis aksi */
  action_type?: AuditActionType;
  /** Filter berdasarkan user_id */
  user_id?: string;
  /** Jumlah record per halaman (default: 20) */
  limit?: number;
  /** Offset untuk pagination (default: 0) */
  offset?: number;
}

export interface AuditLogRecord {
  id: string;
  company_id: string;
  user_id: string;
  user_role: string;
  action_type: AuditActionType;
  entity_type: string;
  entity_id: string | null;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogsResponse {
  data: AuditLogRecord[];
  count: number;
}

// ============================================================
// Query Key Builder
// ============================================================

const AUDIT_LOGS_QUERY_KEY = 'audit_logs' as const;

/**
 * Membangun query key untuk TanStack Query berdasarkan filter aktif.
 * Hanya menyertakan filter yang memiliki nilai (non-undefined).
 */
export function buildAuditLogsQueryKey(filters: AuditLogFilters) {
  return [AUDIT_LOGS_QUERY_KEY, filters] as const;
}

// ============================================================
// Fetch Function
// ============================================================

/**
 * Fetch audit logs dari Supabase dengan filter yang diberikan.
 * RLS memastikan hanya Owner yang dapat membaca.
 */
export async function fetchAuditLogs(
  filters: AuditLogFilters
): Promise<AuditLogsResponse> {
  const limit = filters.limit ?? 20;
  const offset = filters.offset ?? 0;

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  // Filter: rentang tanggal
  if (filters.start_date) {
    query = query.gte('created_at', filters.start_date);
  }
  if (filters.end_date) {
    query = query.lte('created_at', filters.end_date);
  }

  // Filter: action_type
  if (filters.action_type) {
    query = query.eq('action_type', filters.action_type);
  }

  // Filter: user_id
  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  // Pagination: range harus dipanggil terakhir
  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Gagal mengambil audit logs: ${error.message}`);
  }

  return {
    data: (data ?? []) as AuditLogRecord[],
    count: count ?? 0,
  };
}

// ============================================================
// Hook
// ============================================================

/**
 * TanStack Query hook untuk fetch audit logs dengan filter.
 *
 * @param filters - Objek filter (tanggal, aksi, user_id, pagination)
 * @param enabled - Apakah query diaktifkan (default: true)
 * @returns TanStack Query result dengan data AuditLogsResponse
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useAuditLogs({
 *   start_date: '2026-01-01T00:00:00+07:00',
 *   end_date: '2026-01-31T23:59:59+07:00',
 *   action_type: 'payroll_process',
 *   limit: 20,
 *   offset: 0,
 * });
 * ```
 */
export function useAuditLogs(filters: AuditLogFilters = {}, enabled = true) {
  return useQuery<AuditLogsResponse, Error>({
    queryKey: buildAuditLogsQueryKey(filters),
    queryFn: () => fetchAuditLogs(filters),
    enabled,
    staleTime: 30 * 1000, // 30 detik — audit logs jarang berubah saat dilihat
    placeholderData: keepPreviousData,
  });
}
