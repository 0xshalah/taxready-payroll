/**
 * SettingsPage — Halaman pengaturan dengan tabs
 * Tab 1: TER Rates (display only)
 * Tab 2: BPJS Config (display current values)
 * Tab 3: User Management (list users with role badges)
 */

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTERRates, useBPJSConfig } from '@/features/settings/hooks/useSettings';

type SettingsTab = 'ter' | 'bpjs' | 'users';

function formatPercent(value: number): string {
  return `${value}%`;
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function SettingsPage() {
  const { user } = useAuth();
  const companyId = user?.company_id ?? '';
  const [activeTab, setActiveTab] = useState<SettingsTab>('ter');

  const { data: terRates, isLoading: loadingTER } = useTERRates(companyId);
  const { data: bpjsConfig, isLoading: loadingBPJS } = useBPJSConfig(companyId);

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: 'ter', label: 'Tarif TER' },
    { key: 'bpjs', label: 'Konfigurasi BPJS' },
    { key: 'users', label: 'Manajemen User' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink tracking-tight">Pengaturan</h1>
        <p className="text-sm text-ink-mute mt-1">
          Konfigurasi tarif pajak, BPJS, dan manajemen pengguna.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-hairline">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-primary text-ink'
                : 'border-transparent text-ink-mute hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'ter' && (
        <Card>
          <CardHeader>
            <CardTitle>Tarif Efektif Rata-rata (TER)</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTER ? (
              <p className="text-sm text-ink-mute">Memuat data tarif TER...</p>
            ) : !terRates || terRates.length === 0 ? (
              <p className="text-sm text-ink-mute">
                Belum ada data tarif TER. Tarif akan digunakan saat proses penggajian.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-right">Batas Bawah</TableHead>
                      <TableHead className="text-right">Batas Atas</TableHead>
                      <TableHead className="text-right">Tarif</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {terRates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell>
                          <Badge variant="default">Kategori {rate.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatRupiah(rate.lower_bound)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatRupiah(rate.upper_bound)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatPercent(rate.rate_percent)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'bpjs' && (
        <Card>
          <CardHeader>
            <CardTitle>Konfigurasi BPJS</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBPJS ? (
              <p className="text-sm text-ink-mute">Memuat konfigurasi BPJS...</p>
            ) : !bpjsConfig ? (
              <p className="text-sm text-ink-mute">
                Konfigurasi BPJS belum tersedia.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employer Rates */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-ink">Tarif Pemberi Kerja</h3>
                  <div className="space-y-2">
                    <ConfigRow label="JHT" value={formatPercent(bpjsConfig.jht_employer_rate)} />
                    <ConfigRow label="JP" value={formatPercent(bpjsConfig.jp_employer_rate)} />
                    <ConfigRow label="JKM" value={formatPercent(bpjsConfig.jkm_employer_rate)} />
                    <ConfigRow label="JKK" value={formatPercent(bpjsConfig.jkk_rate)} />
                    <ConfigRow label="JKP" value={formatPercent(bpjsConfig.jkp_employer_rate)} />
                    <ConfigRow label="Kesehatan" value={formatPercent(bpjsConfig.kesehatan_employer_rate)} />
                  </div>
                </div>

                {/* Employee Rates */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-ink">Tarif Pekerja</h3>
                  <div className="space-y-2">
                    <ConfigRow label="JHT" value={formatPercent(bpjsConfig.jht_employee_rate)} />
                    <ConfigRow label="JP" value={formatPercent(bpjsConfig.jp_employee_rate)} />
                    <ConfigRow label="Kesehatan" value={formatPercent(bpjsConfig.kesehatan_employee_rate)} />
                  </div>
                </div>

                {/* Ceilings */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-ink">Batas Upah</h3>
                  <div className="space-y-2">
                    <ConfigRow label="JP Ceiling" value={formatRupiah(bpjsConfig.jp_wage_ceiling)} />
                    <ConfigRow label="Kesehatan Ceiling" value={formatRupiah(bpjsConfig.kesehatan_wage_ceiling)} />
                  </div>
                </div>

                {/* JKK Discount */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-ink">Diskon JKK</h3>
                  <div className="space-y-2">
                    <ConfigRow
                      label="Mulai"
                      value={bpjsConfig.jkk_discount_start ?? '—'}
                    />
                    <ConfigRow
                      label="Berakhir"
                      value={bpjsConfig.jkk_discount_end ?? '—'}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>Manajemen Pengguna</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-mute mb-4">
              Daftar pengguna yang terdaftar di perusahaan Anda.
            </p>
            {/* Placeholder — in production this would fetch from users table */}
            {user && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-sm">{user.nama}</TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell>
                        <RoleBadge role={user.role} />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-hairline-cool last:border-0">
      <span className="text-sm text-ink-mute">{label}</span>
      <span className="text-sm font-medium text-ink font-mono">{value}</span>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const label = role === 'owner' ? 'Owner' : role === 'hr_staff' ? 'HR Staff' : 'Regular Staff';
  return <Badge variant="role">{label}</Badge>;
}
