/**
 * AuditTrailPage — Halaman audit trail
 * Filter: rentang tanggal, action type, user
 * Tabel: timestamp, user, action, entity, details
 */

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectOption,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Button,
} from '@/components/ui';
import { useAuditLogs } from '@/features/audit/hooks/useAuditLogs';
import type { AuditLogFilters } from '@/features/audit/hooks/useAuditLogs';
import type { AuditActionType } from '@/lib/auditLogger';

const ACTION_TYPE_OPTIONS: { value: AuditActionType | ''; label: string }[] = [
  { value: '', label: 'Semua Aksi' },
  { value: 'payroll_process', label: 'Proses Penggajian' },
  { value: 'employee_create', label: 'Tambah Karyawan' },
  { value: 'employee_update', label: 'Update Karyawan' },
  { value: 'employee_delete', label: 'Hapus Karyawan' },
  { value: 'salary_change', label: 'Perubahan Gaji' },
  { value: 'export_document', label: 'Ekspor Dokumen' },
  { value: 'settings_change', label: 'Perubahan Pengaturan' },
  { value: 'role_change', label: 'Perubahan Role' },
  { value: 'unauthorized_access', label: 'Akses Tidak Sah' },
];

function formatTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AuditTrailPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 20,
    offset: 0,
  });

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionType, setActionType] = useState<AuditActionType | ''>('');
  const [userId, setUserId] = useState('');

  const { data, isLoading } = useAuditLogs(filters);

  function applyFilters() {
    const newFilters: AuditLogFilters = {
      limit: 20,
      offset: 0,
    };
    if (startDate) newFilters.start_date = startDate;
    if (endDate) newFilters.end_date = endDate;
    if (actionType) newFilters.action_type = actionType;
    if (userId) newFilters.user_id = userId;
    setFilters(newFilters);
  }

  function handleNextPage() {
    setFilters((prev) => ({
      ...prev,
      offset: (prev.offset ?? 0) + (prev.limit ?? 20),
    }));
  }

  function handlePrevPage() {
    setFilters((prev) => ({
      ...prev,
      offset: Math.max(0, (prev.offset ?? 0) - (prev.limit ?? 20)),
    }));
  }

  const currentOffset = filters.offset ?? 0;
  const currentLimit = filters.limit ?? 20;
  const totalCount = data?.count ?? 0;
  const hasNext = currentOffset + currentLimit < totalCount;
  const hasPrev = currentOffset > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink tracking-tight">Audit Trail</h1>
        <p className="text-sm text-ink-mute mt-1">
          Riwayat aktivitas sistem untuk kepatuhan dan keamanan.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label htmlFor="audit-start-date" className="text-sm font-medium text-ink">
                Dari Tanggal
              </label>
              <Input
                id="audit-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="audit-end-date" className="text-sm font-medium text-ink">
                Sampai Tanggal
              </label>
              <Input
                id="audit-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="audit-action-type" className="text-sm font-medium text-ink">
                Jenis Aksi
              </label>
              <Select
                id="audit-action-type"
                value={actionType}
                onChange={(e) => setActionType(e.target.value as AuditActionType | '')}
              >
                {ACTION_TYPE_OPTIONS.map((opt) => (
                  <SelectOption key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectOption>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="audit-user-id" className="text-sm font-medium text-ink">
                User ID
              </label>
              <Input
                id="audit-user-id"
                type="text"
                placeholder="Filter by user ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <Button onClick={applyFilters}>Terapkan Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center">
              <p className="text-sm text-ink-mute">Memuat data audit...</p>
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-ink-mute">Tidak ada data audit log.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Aksi</TableHead>
                    <TableHead>Entitas</TableHead>
                    <TableHead>Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {formatTimestamp(log.created_at)}
                      </TableCell>
                      <TableCell className="text-xs">{log.user_id.slice(0, 8)}...</TableCell>
                      <TableCell className="text-xs">{log.action_type}</TableCell>
                      <TableCell className="text-xs">{log.entity_type}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">
                        {log.changes ? JSON.stringify(log.changes) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-mute">
            Menampilkan {currentOffset + 1}–{Math.min(currentOffset + currentLimit, totalCount)} dari {totalCount}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrevPage} disabled={!hasPrev}>
              Sebelumnya
            </Button>
            <Button variant="outline" onClick={handleNextPage} disabled={!hasNext}>
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
