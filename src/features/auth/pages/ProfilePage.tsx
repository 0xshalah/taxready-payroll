/**
 * ProfilePage — Halaman profil untuk Regular Staff
 * Menampilkan: nama, email, jabatan (role), tanggal bergabung
 * Read-only untuk MVP
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';

/** Format role ke label Indonesia */
function formatRole(role: string): string {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'hr_staff':
      return 'HR Staff';
    case 'regular_staff':
      return 'Regular Staff';
    default:
      return role;
  }
}

export function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-ink-mute">Memuat profil...</p>
      </div>
    );
  }

  const joinDate = new Date(user.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink tracking-tight">Profil Saya</h1>
        <p className="text-sm text-ink-mute mt-1">Informasi akun Anda.</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Data Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-ink-mute">Nama</p>
            <p className="text-sm font-medium text-ink">{user.nama}</p>
          </div>
          <div>
            <p className="text-sm text-ink-mute">Email</p>
            <p className="text-sm font-medium text-ink">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-ink-mute">Jabatan</p>
            <p className="text-sm font-medium text-ink">{formatRole(user.role)}</p>
          </div>
          <div>
            <p className="text-sm text-ink-mute">Tanggal Bergabung</p>
            <p className="text-sm font-medium text-ink">{joinDate}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
