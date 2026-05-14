/**
 * DashboardPage — Halaman utama setelah login
 * Menampilkan ringkasan realtime:
 * - Total karyawan aktif (dari tabel employees)
 * - Penggajian terakhir (dari audit_logs action_type = 'payroll_process')
 * - Total gaji bersih terakhir
 * - 5 aktivitas terakhir (dari audit_logs)
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Calculator, Banknote, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalActiveEmployees: number;
  lastPayrollPeriod: string | null;
  lastPayrollNetPay: number | null;
}

interface RecentActivity {
  id: string;
  action_type: string;
  entity_type: string;
  user_role: string;
  changes: Record<string, unknown> | null;
  created_at: string;
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function fetchDashboardStats(companyId: string): Promise<DashboardStats> {
  // Fetch active employee count
  const { count, error: countError } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (countError) {
    console.error('Gagal mengambil jumlah karyawan:', countError.message);
  }

  // Fetch last payroll process from audit_logs
  const { data: lastPayroll, error: payrollError } = await supabase
    .from('audit_logs')
    .select('changes, created_at')
    .eq('company_id', companyId)
    .eq('action_type', 'payroll_process')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (payrollError) {
    console.error('Gagal mengambil data penggajian terakhir:', payrollError.message);
  }

  let lastPayrollPeriod: string | null = null;
  let lastPayrollNetPay: number | null = null;

  if (lastPayroll?.changes) {
    const changes = lastPayroll.changes as Record<string, unknown>;
    if (changes.period) {
      lastPayrollPeriod = String(changes.period);
    }
    if (changes.total_net_pay !== undefined) {
      lastPayrollNetPay = Number(changes.total_net_pay);
    }
  }

  return {
    totalActiveEmployees: count ?? 0,
    lastPayrollPeriod,
    lastPayrollNetPay,
  };
}

async function fetchRecentActivity(companyId: string): Promise<RecentActivity[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, action_type, entity_type, user_role, changes, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Gagal mengambil aktivitas terakhir:', error.message);
    return [];
  }

  return (data ?? []) as RecentActivity[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function formatPeriod(period: string): string {
  // period format: "2026-05" → "Mei 2026"
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const parts = period.split('-');
  if (parts.length === 2) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1]!, 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${months[monthIdx]} ${year}`;
    }
  }
  return period;
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getActionLabel(actionType: string): string {
  switch (actionType) {
    case 'payroll_process': return 'Proses Penggajian';
    case 'employee_create': return 'Tambah Karyawan';
    case 'employee_update': return 'Update Karyawan';
    case 'employee_delete': return 'Hapus Karyawan';
    case 'salary_change': return 'Ubah Gaji';
    case 'export_document': return 'Ekspor Dokumen';
    case 'settings_change': return 'Ubah Pengaturan';
    case 'role_change': return 'Ubah Role';
    default: return actionType;
  }
}

function getActionBadgeVariant(actionType: string): 'success' | 'warning' | 'default' | 'error' {
  switch (actionType) {
    case 'payroll_process': return 'success';
    case 'employee_delete': return 'error';
    case 'salary_change': return 'warning';
    case 'settings_change': return 'warning';
    default: return 'default';
  }
}

// ─── Components ───────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  loading?: boolean;
  delay?: number;
}

function StatCard({ icon: Icon, label, value, loading, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-canvas-soft">
              <Icon className="h-5 w-5 text-ink-mute" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-ink-mute">{label}</p>
              {loading ? (
                <div className="h-8 w-24 bg-canvas-soft rounded animate-pulse mt-1" />
              ) : (
                <p className="text-2xl font-medium text-ink mt-0.5 font-mono truncate">
                  {value}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user } = useAuth();
  const companyId = user?.company_id ?? '';

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard-stats', companyId],
    queryFn: () => fetchDashboardStats(companyId),
    enabled: !!companyId,
    refetchInterval: 15_000, // Refresh setiap 15 detik
    refetchOnWindowFocus: true,
    staleTime: 5_000, // Data dianggap stale setelah 5 detik
  });

  const { data: activities, isLoading: loadingActivities } = useQuery({
    queryKey: ['dashboard-activities', companyId],
    queryFn: () => fetchRecentActivity(companyId),
    enabled: !!companyId,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    staleTime: 5_000,
  });

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-medium text-ink tracking-tight">
          Selamat datang, {user?.nama ?? 'Pengguna'}
        </h1>
        <p className="text-sm text-ink-mute mt-1">
          Berikut ringkasan data perusahaan Anda.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Total Karyawan Aktif"
          value={String(stats?.totalActiveEmployees ?? 0)}
          loading={loadingStats}
          delay={0}
        />
        <StatCard
          icon={Calculator}
          label="Penggajian Terakhir"
          value={stats?.lastPayrollPeriod ? formatPeriod(stats.lastPayrollPeriod) : 'Belum ada'}
          loading={loadingStats}
          delay={0.1}
        />
        <StatCard
          icon={Banknote}
          label="Total Gaji Bersih Terakhir"
          value={stats?.lastPayrollNetPay != null ? formatCurrency(stats.lastPayrollNetPay) : 'Belum ada'}
          loading={loadingStats}
          delay={0.2}
        />
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Aktivitas Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingActivities ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-4 w-24 bg-canvas-soft rounded animate-pulse" />
                    <div className="h-4 w-40 bg-canvas-soft rounded animate-pulse" />
                    <div className="h-4 w-16 bg-canvas-soft rounded animate-pulse ml-auto" />
                  </div>
                ))}
              </div>
            ) : !activities || activities.length === 0 ? (
              <p className="text-sm text-ink-mute py-4 text-center">
                Belum ada aktivitas. Mulai dengan menambahkan karyawan atau memproses penggajian.
              </p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 py-2 border-b border-hairline-cool last:border-0"
                  >
                    <Badge variant={getActionBadgeVariant(activity.action_type)}>
                      {getActionLabel(activity.action_type)}
                    </Badge>
                    <span className="text-sm text-ink truncate flex-1">
                      {activity.entity_type}
                      {activity.changes?.employee_name ? (
                        <> — {String(activity.changes.employee_name)}</>
                      ) : null}
                      {activity.changes?.period ? (
                        <> — {formatPeriod(String(activity.changes.period))}</>
                      ) : null}
                    </span>
                    <span className="text-xs text-ink-mute whitespace-nowrap">
                      {formatRelativeTime(activity.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
