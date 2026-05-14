/**
 * TarifChangelogPage — Halaman riwayat perubahan tarif TER & BPJS
 * Dapat diakses oleh Owner DAN HR Staff (bukan hanya Owner).
 *
 * Menampilkan timeline perubahan tarif dengan detail:
 * - Tanggal & waktu perubahan
 * - Siapa yang mengubah (role)
 * - Jenis tarif yang diubah (TER / BPJS)
 * - Detail perubahan
 *
 * Validates: Fitur Transparansi #5
 */

import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@/components/ui';
import { Clock, FileText, Shield } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTarifChangelog } from '@/features/settings/hooks/useTarifChangelog';
import type { TarifChangelogEntry } from '@/features/settings/hooks/useTarifChangelog';

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
  return `${Math.floor(diffDays / 30)} bulan lalu`;
}

function getEntityLabel(entityType: string): string {
  switch (entityType) {
    case 'ter_rates':
      return 'Tarif TER';
    case 'bpjs_config':
      return 'Konfigurasi BPJS';
    default:
      return entityType;
  }
}

function getRoleBadge(role: string) {
  const label = role === 'owner' ? 'Owner' : role === 'hr_staff' ? 'HR Staff' : role;
  return <Badge variant="role">{label}</Badge>;
}

function ChangelogItem({ entry, index }: { entry: TarifChangelogEntry; index: number }) {
  const changes = entry.changes;
  const changeDetails: string[] = [];

  if (changes) {
    if (changes.action === 'update_ter_rates' && changes.rates_count) {
      changeDetails.push(`${changes.rates_count} baris tarif diperbarui`);
    }
    if (changes.action === 'update_bpjs_config') {
      if (changes.jkk_rate !== undefined) changeDetails.push(`JKK Rate: ${changes.jkk_rate}%`);
      if (changes.jp_wage_ceiling !== undefined) changeDetails.push(`JP Ceiling: Rp ${Number(changes.jp_wage_ceiling).toLocaleString('id-ID')}`);
      if (changes.kesehatan_wage_ceiling !== undefined) changeDetails.push(`Kes Ceiling: Rp ${Number(changes.kesehatan_wage_ceiling).toLocaleString('id-ID')}`);
    }
    if (changes.field_changes && typeof changes.field_changes === 'object') {
      const fieldChanges = changes.field_changes as Record<string, { old: unknown; new: unknown }>;
      for (const [field, change] of Object.entries(fieldChanges)) {
        if (change && typeof change === 'object' && 'old' in change && 'new' in change) {
          changeDetails.push(`${field}: ${change.old} → ${change.new}`);
        }
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="flex gap-4 pb-6 last:pb-0"
    >
      {/* Timeline dot & line */}
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-primary shrink-0 mt-1.5" />
        <div className="w-px flex-1 bg-hairline mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={entry.entity_type === 'ter_rates' ? 'success' : 'default'}>
            {getEntityLabel(entry.entity_type)}
          </Badge>
          {getRoleBadge(entry.user_role)}
          <span className="text-xs text-ink-mute">
            {formatRelativeTime(entry.created_at)}
          </span>
        </div>

        <p className="text-sm text-ink mt-1">
          Perubahan {getEntityLabel(entry.entity_type).toLowerCase()} oleh{' '}
          <span className="font-medium">{entry.user_role === 'owner' ? 'Owner' : 'HR Staff'}</span>
        </p>

        {changeDetails.length > 0 && (
          <div className="mt-1.5 bg-canvas-soft rounded-md p-2 border border-hairline-cool">
            <ul className="space-y-0.5">
              {changeDetails.map((detail, i) => (
                <li key={i} className="text-xs text-ink-mute font-mono">
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-ink-faint mt-1">
          <Clock className="inline h-3 w-3 mr-1" />
          {formatDate(entry.created_at)}
        </p>
      </div>
    </motion.div>
  );
}

export function TarifChangelogPage() {
  const { user } = useAuth();
  const companyId = user?.company_id ?? '';
  const { data: changelog, isLoading, error } = useTarifChangelog(companyId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium text-ink tracking-tight">Changelog Tarif</h1>
        <p className="text-sm text-ink-mute mt-1">
          Riwayat perubahan tarif TER dan konfigurasi BPJS perusahaan.
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-l-4 border-l-[#3b82f6]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-[#3b82f6] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-ink">Transparansi Tarif</p>
              <p className="text-xs text-ink-mute mt-0.5">
                Semua perubahan tarif TER (PP 58/2023) dan konfigurasi BPJS dicatat secara otomatis.
                Halaman ini dapat diakses oleh Owner dan HR Staff untuk memastikan transparansi perhitungan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Changelog Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Riwayat Perubahan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-sm text-ink-mute">Memuat riwayat perubahan...</p>
          )}

          {error && (
            <p className="text-sm text-[#991b1b]">
              Gagal memuat data: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          )}

          {!isLoading && !error && (!changelog || changelog.length === 0) && (
            <div className="text-center py-8">
              <Clock className="h-10 w-10 text-ink-faint mx-auto mb-3" />
              <p className="text-sm text-ink-mute">
                Belum ada riwayat perubahan tarif.
              </p>
              <p className="text-xs text-ink-faint mt-1">
                Perubahan akan tercatat otomatis saat Owner mengubah tarif TER atau konfigurasi BPJS.
              </p>
            </div>
          )}

          {changelog && changelog.length > 0 && (
            <div className="space-y-0">
              {changelog.map((entry, index) => (
                <ChangelogItem key={entry.id} entry={entry} index={index} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dasar Hukum */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-ink-mute">
            <strong>Referensi Regulasi:</strong> Tarif TER berdasarkan PP 58/2023 jo. PMK 168/2023.
            Tarif BPJS berdasarkan PP 35/2021 (Ketenagakerjaan) dan Perpres 64/2020 (Kesehatan).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
