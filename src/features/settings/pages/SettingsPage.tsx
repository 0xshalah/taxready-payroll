/**
 * SettingsPage — Pengaturan dengan tabs
 * Tab 1: Tarif TER (edit untuk Owner)
 * Tab 2: Konfigurasi BPJS (edit untuk Owner)
 * Tab 3: Manajemen User (list + invite + ubah role)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, CardContent, CardHeader, CardTitle,
  Badge, Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
  Button, Input, Label, Select, SelectOption, Dialog, DialogContent,
  DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTERRates, useBPJSConfig, useUpdateBPJSConfig } from '@/features/settings/hooks/useSettings';
import { supabase } from '@/lib/supabase';
import { sendWelcomeEmail } from '@/lib/emailService';
import type { BPJSConfig } from '@/types/payroll';
import type { User, UserRole } from '@/types/auth';

type SettingsTab = 'ter' | 'bpjs' | 'users';

function formatPercent(value: number): string { return `${value}%`; }
function formatRupiah(amount: number): string { return `Rp ${amount.toLocaleString('id-ID')}`; }

// ─── User Management ─────────────────────────────────────────────────────────

function useCompanyUsers(companyId: string) {
  return useQuery({
    queryKey: ['company-users', companyId],
    queryFn: async (): Promise<User[]> => {
      const { data, error } = await supabase
        .from('users')
        .select('id, company_id, email, nama, role, created_at')
        .eq('company_id', companyId)
        .order('created_at');
      if (error) throw new Error(error.message);
      return (data ?? []) as User[];
    },
    enabled: !!companyId,
  });
}

function useUpdateUserRole(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: UserRole }) => {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)
        .eq('company_id', companyId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-users', companyId] }),
  });
}

function useInviteUser(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, nama, role, password }: { email: string; nama: string; role: UserRole; password: string }) => {
      // Sign up new user
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Gagal membuat akun');

      // Insert into users table
      const { error: userError } = await supabase.from('users').insert({
        id: authData.user.id,
        company_id: companyId,
        email,
        nama,
        role,
      });
      if (userError) throw new Error(userError.message);

      // Send welcome email (fire-and-forget)
      sendWelcomeEmail({
        userEmail: email,
        userNama: nama,
        companyName: companyId, // ideally fetch company name
        role,
        temporaryPassword: password,
        appUrl: window.location.origin,
      }).catch(() => {});
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-users', companyId] }),
  });
}

// ─── BPJS Edit Form ───────────────────────────────────────────────────────────

interface BPJSEditFormProps {
  config: BPJSConfig;
  onSave: (config: BPJSConfig) => void;
  isSaving: boolean;
}

function BPJSEditForm({ config, onSave, isSaving }: BPJSEditFormProps) {
  const [form, setForm] = useState<BPJSConfig>({ ...config });

  const field = (key: keyof BPJSConfig, label: string, isRupiah = false) => (
    <div className="space-y-1">
      <Label htmlFor={key} className="text-xs">{label}</Label>
      <Input
        id={key}
        type="number"
        step={isRupiah ? '1000' : '0.01'}
        value={form[key] as number ?? ''}
        onChange={e => setForm(prev => ({ ...prev, [key]: Number(e.target.value) }))}
        disabled={isSaving}
        className="h-8 text-sm"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="col-span-2 md:col-span-3">
          <p className="text-xs font-medium text-ink-mute uppercase tracking-wide mb-3">Tarif Pemberi Kerja (%)</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {field('jht_employer_rate', 'JHT')}
            {field('jp_employer_rate', 'JP')}
            {field('jkm_employer_rate', 'JKM')}
            {field('jkk_rate', 'JKK')}
            {field('jkp_employer_rate', 'JKP')}
            {field('kesehatan_employer_rate', 'Kesehatan')}
          </div>
        </div>
        <div className="col-span-2 md:col-span-3">
          <p className="text-xs font-medium text-ink-mute uppercase tracking-wide mb-3">Tarif Pekerja (%)</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {field('jht_employee_rate', 'JHT')}
            {field('jp_employee_rate', 'JP')}
            {field('kesehatan_employee_rate', 'Kesehatan')}
          </div>
        </div>
        <div className="col-span-2 md:col-span-3">
          <p className="text-xs font-medium text-ink-mute uppercase tracking-wide mb-3">Batas Upah (Rp)</p>
          <div className="grid grid-cols-2 gap-3">
            {field('jp_wage_ceiling', 'JP Ceiling', true)}
            {field('kesehatan_wage_ceiling', 'Kesehatan Ceiling', true)}
          </div>
        </div>
        <div className="col-span-2 md:col-span-3">
          <p className="text-xs font-medium text-ink-mute uppercase tracking-wide mb-3">Diskon JKK</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="jkk_start" className="text-xs">Mulai (YYYY-MM-DD)</Label>
              <Input id="jkk_start" type="text" placeholder="2026-01-01" value={form.jkk_discount_start ?? ''} onChange={e => setForm(prev => ({ ...prev, jkk_discount_start: e.target.value }))} disabled={isSaving} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="jkk_end" className="text-xs">Berakhir (YYYY-MM-DD)</Label>
              <Input id="jkk_end" type="text" placeholder="2026-06-30" value={form.jkk_discount_end ?? ''} onChange={e => setForm(prev => ({ ...prev, jkk_discount_end: e.target.value }))} disabled={isSaving} className="h-8 text-sm" />
            </div>
          </div>
        </div>
      </div>
      <Button onClick={() => onSave(form)} disabled={isSaving}>
        {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi BPJS'}
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { user } = useAuth();
  const companyId = user?.company_id ?? '';
  const isOwner = user?.role === 'owner';
  const [activeTab, setActiveTab] = useState<SettingsTab>('ter');

  const { data: terRates, isLoading: loadingTER } = useTERRates(companyId);
  const { data: bpjsConfig, isLoading: loadingBPJS } = useBPJSConfig(companyId);
  const { data: companyUsers, isLoading: loadingUsers } = useCompanyUsers(companyId);
  const updateBPJS = useUpdateBPJSConfig(user!);
  const updateRole = useUpdateUserRole(companyId);
  const inviteUser = useInviteUser(companyId);

  // Invite dialog state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteNama, setInviteNama] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('hr_staff');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);

  const handleInvite = async () => {
    setInviteError(null);
    if (!inviteEmail || !inviteNama || !invitePassword) {
      setInviteError('Semua field wajib diisi');
      return;
    }
    if (invitePassword.length < 8) {
      setInviteError('Password minimal 8 karakter');
      return;
    }
    try {
      await inviteUser.mutateAsync({ email: inviteEmail, nama: inviteNama, role: inviteRole, password: invitePassword });
      setShowInvite(false);
      setInviteEmail(''); setInviteNama(''); setInvitePassword('');
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Gagal menambahkan user');
    }
  };

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: 'ter', label: 'Tarif TER' },
    { key: 'bpjs', label: 'Konfigurasi BPJS' },
    { key: 'users', label: 'Manajemen User' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink tracking-tight">Pengaturan</h1>
        <p className="text-sm text-ink-mute mt-1">Konfigurasi tarif pajak, BPJS, dan manajemen pengguna.</p>
      </div>

      <div className="flex gap-1 border-b border-hairline">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.key ? 'border-primary text-ink' : 'border-transparent text-ink-mute hover:text-ink'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── TER Rates Tab ─── */}
      {activeTab === 'ter' && (
        <Card>
          <CardHeader>
            <CardTitle>Tarif Efektif Rata-rata (TER) — PP 58/2023</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTER ? (
              <p className="text-sm text-ink-mute">Memuat data tarif TER...</p>
            ) : !terRates || terRates.length === 0 ? (
              <p className="text-sm text-ink-mute">Belum ada data tarif TER.</p>
            ) : (
              <>
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
                          <TableCell><Badge variant="default">Kategori {rate.category}</Badge></TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatRupiah(rate.lower_bound)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatRupiah(rate.upper_bound)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatPercent(rate.rate_percent)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-ink-mute mt-3">
                  Tarif TER berdasarkan PP 58/2023 jo. PMK 168/2023. Untuk mengubah tarif, hubungi administrator sistem.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── BPJS Config Tab ─── */}
      {activeTab === 'bpjs' && (
        <Card>
          <CardHeader>
            <CardTitle>Konfigurasi BPJS</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBPJS ? (
              <p className="text-sm text-ink-mute">Memuat konfigurasi BPJS...</p>
            ) : !bpjsConfig ? (
              <p className="text-sm text-ink-mute">Konfigurasi BPJS belum tersedia.</p>
            ) : isOwner ? (
              <BPJSEditForm
                config={bpjsConfig}
                onSave={(config) => updateBPJS.mutate(config)}
                isSaving={updateBPJS.isPending}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-ink">Tarif Pemberi Kerja</h3>
                  <div className="space-y-2">
                    {[['JHT', bpjsConfig.jht_employer_rate], ['JP', bpjsConfig.jp_employer_rate], ['JKM', bpjsConfig.jkm_employer_rate], ['JKK', bpjsConfig.jkk_rate], ['JKP', bpjsConfig.jkp_employer_rate], ['Kesehatan', bpjsConfig.kesehatan_employer_rate]].map(([label, val]) => (
                      <ConfigRow key={String(label)} label={String(label)} value={formatPercent(Number(val))} />
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-ink">Tarif Pekerja</h3>
                  <div className="space-y-2">
                    {[['JHT', bpjsConfig.jht_employee_rate], ['JP', bpjsConfig.jp_employee_rate], ['Kesehatan', bpjsConfig.kesehatan_employee_rate]].map(([label, val]) => (
                      <ConfigRow key={String(label)} label={String(label)} value={formatPercent(Number(val))} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── User Management Tab ─── */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Manajemen Pengguna</CardTitle>
            {isOwner && (
              <Button onClick={() => setShowInvite(true)}>+ Tambah User</Button>
            )}
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <p className="text-sm text-ink-mute">Memuat data pengguna...</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      {isOwner && <TableHead className="text-center">Ubah Role</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(companyUsers ?? []).map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="text-sm font-medium">{u.nama}</TableCell>
                        <TableCell className="text-sm text-ink-mute">{u.email}</TableCell>
                        <TableCell><RoleBadge role={u.role} /></TableCell>
                        {isOwner && (
                          <TableCell className="text-center">
                            {u.id !== user?.id ? (
                              <Select
                                value={u.role}
                                onChange={(e) => updateRole.mutate({ userId: u.id, newRole: e.target.value as UserRole })}
                                className="h-7 text-xs w-32"
                              >
                                <SelectOption value="owner">Owner</SelectOption>
                                <SelectOption value="hr_staff">HR Staff</SelectOption>
                                <SelectOption value="regular_staff">Regular Staff</SelectOption>
                              </Select>
                            ) : (
                              <span className="text-xs text-ink-mute">Anda</span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Invite User Dialog ─── */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>Buat akun baru untuk anggota tim Anda.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="inv-nama">Nama Lengkap</Label>
              <Input id="inv-nama" value={inviteNama} onChange={e => setInviteNama(e.target.value)} placeholder="Nama lengkap" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-email">Email</Label>
              <Input id="inv-email" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@perusahaan.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-password">Password Sementara</Label>
              <Input id="inv-password" type="password" value={invitePassword} onChange={e => setInvitePassword(e.target.value)} placeholder="Minimal 8 karakter" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-role">Role</Label>
              <Select id="inv-role" value={inviteRole} onChange={e => setInviteRole(e.target.value as UserRole)}>
                <SelectOption value="hr_staff">HR Staff</SelectOption>
                <SelectOption value="regular_staff">Regular Staff</SelectOption>
                <SelectOption value="owner">Owner</SelectOption>
              </Select>
            </div>
            {inviteError && <p className="text-sm text-error">{inviteError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Batal</Button>
            <Button onClick={handleInvite} disabled={inviteUser.isPending}>
              {inviteUser.isPending ? 'Menambahkan...' : 'Tambah User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
