/**
 * DashboardPage — Halaman utama setelah login
 * Menampilkan ringkasan: total karyawan aktif, penggajian terakhir, total gaji bersih
 * + daftar aktivitas terakhir (placeholder)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function DashboardPage() {
  const { user } = useAuth();

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
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-ink-mute">Total Karyawan Aktif</p>
            <p className="text-3xl font-medium text-ink mt-1">—</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-ink-mute">Penggajian Terakhir</p>
            <p className="text-3xl font-medium text-ink mt-1">—</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-ink-mute">Total Gaji Bersih Terakhir</p>
            <p className="text-3xl font-medium text-ink mt-1">—</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-mute">
            5 aktivitas terakhir akan ditampilkan di sini.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
