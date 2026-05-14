/**
 * Hooks untuk pengaturan tarif TER dan BPJS
 * Validates: Persyaratan 2.8, 3.5, 3.7
 *
 * Menggunakan TanStack Query untuk data fetching dan mutation.
 * Hanya Owner yang dapat mengubah pengaturan (enforced via RLS di database).
 * Setiap perubahan dicatat ke audit_logs dengan action_type 'settings_change'.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logAuditEntry } from '@/lib/auditLogger';
import { validateTERRates, validateBPJSConfig } from '@/features/settings/validators/settingsValidators';
import type { TERRate, BPJSConfig } from '@/types/payroll';
import type { User } from '@/types/auth';

// ─── Query Keys ────────────────────────────────────────────────��──────────────

export const settingsKeys = {
  all: ['settings'] as const,
  terRates: (companyId: string) => [...settingsKeys.all, 'ter-rates', companyId] as const,
  bpjsConfig: (companyId: string) => [...settingsKeys.all, 'bpjs-config', companyId] as const,
};

// ─── TER Rates Hooks ──────────────────────────────────────────────────────────

/**
 * Fetch tarif TER untuk perusahaan saat ini.
 */
export function useTERRates(companyId: string) {
  return useQuery({
    queryKey: settingsKeys.terRates(companyId),
    queryFn: async (): Promise<TERRate[]> => {
      const { data, error } = await supabase
        .from('ter_rates')
        .select('id, category, lower_bound, upper_bound, rate_percent')
        .order('category')
        .order('lower_bound');

      if (error) {
        throw new Error(`Gagal mengambil data tarif TER: ${error.message}`);
      }

      return (data ?? []) as TERRate[];
    },
    enabled: !!companyId,
  });
}

/**
 * Update tarif TER (owner only).
 * Melakukan validasi sebelum simpan dan mencatat audit log.
 */
export function useUpdateTERRates(user: User) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rates: TERRate[]): Promise<TERRate[]> => {
      // Validasi sebelum simpan
      const validation = validateTERRates(rates);
      if (!validation.valid) {
        throw new Error(
          `Validasi gagal: ${validation.errors.map((e) => e.message).join('; ')}`
        );
      }

      // Hapus tarif lama dan insert yang baru (replace all)
      const { error: deleteError } = await supabase
        .from('ter_rates')
        .delete()
        .eq('company_id', user.company_id);

      if (deleteError) {
        throw new Error(`Gagal menghapus tarif TER lama: ${deleteError.message}`);
      }

      const rowsToInsert = rates.map((rate) => ({
        company_id: user.company_id,
        category: rate.category,
        lower_bound: rate.lower_bound,
        upper_bound: rate.upper_bound,
        rate_percent: rate.rate_percent,
      }));

      const { data, error: insertError } = await supabase
        .from('ter_rates')
        .insert(rowsToInsert)
        .select('id, category, lower_bound, upper_bound, rate_percent');

      if (insertError) {
        throw new Error(`Gagal menyimpan tarif TER baru: ${insertError.message}`);
      }

      return (data ?? []) as TERRate[];
    },
    onSuccess: async (newRates) => {
      // Invalidate cache
      queryClient.invalidateQueries({
        queryKey: settingsKeys.terRates(user.company_id),
      });

      // Catat audit log
      await logAuditEntry({
        company_id: user.company_id,
        user_id: user.id,
        user_role: user.role,
        action_type: 'settings_change',
        entity_type: 'ter_rates',
        changes: {
          action: 'update_ter_rates',
          rates_count: newRates.length,
          timestamp: new Date().toISOString(),
        },
      });
    },
  });
}

// ─── BPJS Config Hooks ────────────────────────────────────────────────────────

/**
 * Fetch konfigurasi BPJS untuk perusahaan saat ini.
 */
export function useBPJSConfig(companyId: string) {
  return useQuery({
    queryKey: settingsKeys.bpjsConfig(companyId),
    queryFn: async (): Promise<BPJSConfig | null> => {
      const { data, error } = await supabase
        .from('bpjs_config')
        .select(
          `jht_employer_rate, jht_employee_rate, jp_employer_rate, jp_employee_rate,
           jkm_employer_rate, jkk_rate, jkp_employer_rate,
           kes_employer_rate, kes_employee_rate,
           jp_wage_ceiling, kes_wage_ceiling,
           jkk_discount_start, jkk_discount_end`
        )
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null;
        }
        throw new Error(`Gagal mengambil konfigurasi BPJS: ${error.message}`);
      }

      if (!data) return null;

      // Map database column names to BPJSConfig interface
      return {
        jht_employer_rate: data.jht_employer_rate,
        jht_employee_rate: data.jht_employee_rate,
        jp_employer_rate: data.jp_employer_rate,
        jp_employee_rate: data.jp_employee_rate,
        jkm_employer_rate: data.jkm_employer_rate,
        jkk_rate: data.jkk_rate,
        jkp_employer_rate: data.jkp_employer_rate,
        kesehatan_employer_rate: data.kes_employer_rate,
        kesehatan_employee_rate: data.kes_employee_rate,
        jp_wage_ceiling: data.jp_wage_ceiling,
        kesehatan_wage_ceiling: data.kes_wage_ceiling,
        jkk_discount_start: data.jkk_discount_start ?? undefined,
        jkk_discount_end: data.jkk_discount_end ?? undefined,
      } as BPJSConfig;
    },
    enabled: !!companyId,
  });
}

/**
 * Update konfigurasi BPJS (owner only).
 * Melakukan validasi sebelum simpan dan mencatat audit log.
 */
export function useUpdateBPJSConfig(user: User) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: BPJSConfig): Promise<BPJSConfig> => {
      // Validasi sebelum simpan
      const validation = validateBPJSConfig(config);
      if (!validation.valid) {
        throw new Error(
          `Validasi gagal: ${validation.errors.map((e) => e.message).join('; ')}`
        );
      }

      // Map BPJSConfig interface to database column names
      const updateData = {
        jht_employer_rate: config.jht_employer_rate,
        jht_employee_rate: config.jht_employee_rate,
        jp_employer_rate: config.jp_employer_rate,
        jp_employee_rate: config.jp_employee_rate,
        jkm_employer_rate: config.jkm_employer_rate,
        jkk_rate: config.jkk_rate,
        jkp_employer_rate: config.jkp_employer_rate,
        kes_employer_rate: config.kesehatan_employer_rate,
        kes_employee_rate: config.kesehatan_employee_rate,
        jp_wage_ceiling: config.jp_wage_ceiling,
        kes_wage_ceiling: config.kesehatan_wage_ceiling,
        jkk_discount_start: config.jkk_discount_start ?? null,
        jkk_discount_end: config.jkk_discount_end ?? null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('bpjs_config')
        .update(updateData)
        .eq('company_id', user.company_id);

      if (error) {
        throw new Error(`Gagal menyimpan konfigurasi BPJS: ${error.message}`);
      }

      return config;
    },
    onSuccess: async (updatedConfig) => {
      // Invalidate cache
      queryClient.invalidateQueries({
        queryKey: settingsKeys.bpjsConfig(user.company_id),
      });

      // Catat audit log
      await logAuditEntry({
        company_id: user.company_id,
        user_id: user.id,
        user_role: user.role,
        action_type: 'settings_change',
        entity_type: 'bpjs_config',
        changes: {
          action: 'update_bpjs_config',
          jkk_rate: updatedConfig.jkk_rate,
          jp_wage_ceiling: updatedConfig.jp_wage_ceiling,
          kesehatan_wage_ceiling: updatedConfig.kesehatan_wage_ceiling,
          timestamp: new Date().toISOString(),
        },
      });
    },
  });
}
