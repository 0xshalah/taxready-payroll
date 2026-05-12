/**
 * MyPayslipsPage — Halaman slip gaji untuk Regular Staff
 * Placeholder untuk MVP
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

export function MyPayslipsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink tracking-tight">Slip Gaji Saya</h1>
        <p className="text-sm text-ink-mute mt-1">Riwayat slip gaji Anda.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Slip Gaji</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-mute">
            Slip gaji Anda akan ditampilkan di sini setelah penggajian diproses.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
