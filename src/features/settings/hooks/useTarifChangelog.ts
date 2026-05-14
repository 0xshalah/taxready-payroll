/**
 * Hook untuk mengambil changelog perubahan tarif (TER & BPJS)
 * dari tabel audit_logs. Dapat diakses oleh Owner DAN HR Staff.
 *
 * Validates: Fitur Transparansi #5
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/** Entry changelog tarif */
export interface TarifChangelogEntry {
  id: string;
  user_id: string;
  user_role: string;
  action_type: string;
  entity_type: string;
  changes: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Fetch changelog perubahan tarif dari audit_logs.
 * Filter: action_type = 'settings_change' AND entity_type IN ('ter_rates', 'bpjs_config')
 */
export function useTarifChangelog(companyId: string) {
  return useQuery({
    queryKey: ['tarif-changelog', companyId],
    queryFn: async (): Promise<TarifChangelogEntry[]> => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, user_id, user_role, action_type, entity_type, changes, created_at')
        .eq('company_id', companyId)
        .eq('action_type', 'settings_change')
        .in('entity_type', ['ter_rates', 'bpjs_config'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw new Error(`Gagal mengambil changelog tarif: ${error.message}`);
      }

      return (data ?? []) as TarifChangelogEntry[];
    },
    enabled: !!companyId,
  });
}
