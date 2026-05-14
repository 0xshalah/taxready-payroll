/**
 * PayrollHistoryPage — Riwayat proses penggajian
 * Menampilkan daftar periode yang sudah diproses dari audit_logs.
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Users, Banknote, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, Badge } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface PayrollHistoryEntry {
  id: string;
  changes: Record<string, unknown> | null;
  created_at: string;
  user_role: string;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPeriod(periodStr: string): string {
  const parts = periodStr.split('-');
  if (parts.length === 2) {
    const monthIdx = parseInt(parts[1]!, 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${MONTH_NAMES[monthIdx]} ${parts[0]}`;
    }
  }
  return periodStr;
}

export function PayrollHistoryPage() {
  const { user } = useAuth();
  const companyId = user?.company_id ?? '';

  const { data: history, isLoading } = useQuery({
    queryKey: ['payroll-history', companyId],
    queryFn: async (): Promise<PayrollHistoryEntry[]> => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, changes, created_at, user_role')
        .eq('company_id', companyId)
        .eq('action_type', 'payroll_process')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []) as PayrollHistoryEntry[];
    },
    enabled: !!companyId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink tracking-tight">Riwayat Penggajian</h1>
        <p className="text-sm text-ink-mute mt-1">
          Daftar periode penggajian yang sudah diproses.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="h-12 w-24 bg-canvas-soft rounded animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 bg-canvas-soft rounded animate-pulse" />
                    <div className="h-3 w-60 bg-canvas-soft rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (!history || history.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-ink-faint mx-auto mb-3" />
            <p className="text-sm text-ink-mute">
              Belum ada riwayat penggajian.
            </p>
            <p className="text-xs text-ink-faint mt-1">
              Proses penggajian pertama Anda di halaman Proses Penggajian.
            </p>
          </CardContent>
        </Card>
      )}

      {history && history.length > 0 && (
        <div className="space-y-4">
          {history.map((entry, index) => {
            const changes = entry.changes ?? {};
            const period = changes.period ? String(changes.period) : '—';
            const employeeCount = changes.employee_count ? Number(changes.employee_count) : 0;
            const totalNetPay = changes.total_net_pay ? Number(changes.total_net_pay) : 0;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Card className="hover:bg-canvas-soft/50 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      {/* Period badge */}
                      <div className="bg-primary/10 rounded-lg p-3 shrink-0">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-medium text-ink">
                            {formatPeriod(period)}
                          </h3>
                          <Badge variant="success">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Berhasil
                          </Badge>
                        </div>
                        <p className="text-xs text-ink-mute mt-1">
                          Diproses pada {formatDate(entry.created_at)}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="hidden md:flex items-center gap-6">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-ink-mute">
                            <Users className="h-3.5 w-3.5" />
                            <span className="text-xs">Karyawan</span>
                          </div>
                          <p className="text-sm font-medium text-ink font-mono">{employeeCount}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-ink-mute">
                            <Banknote className="h-3.5 w-3.5" />
                            <span className="text-xs">Total Gaji Bersih</span>
                          </div>
                          <p className="text-sm font-medium text-ink font-mono">
                            {formatCurrency(totalNetPay)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Mobile stats */}
                    <div className="flex md:hidden items-center gap-4 mt-3 pt-3 border-t border-hairline-cool">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-ink-mute" />
                        <span className="text-xs text-ink-mute">{employeeCount} karyawan</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Banknote className="h-3.5 w-3.5 text-ink-mute" />
                        <span className="text-xs text-ink font-mono">{formatCurrency(totalNetPay)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
