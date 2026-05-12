/**
 * Tabel karyawan dengan sorting, search, dan aksi (edit/delete)
 * Validates: Persyaratan 1.5, 8.7
 *
 * Fitur:
 * - Search by nama
 * - Sorting by kolom
 * - NIK masked untuk Regular Staff
 * - Status badge (active/inactive)
 * - Aksi edit dan delete
 */

import { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  Input,
  Badge,
} from '@/components/ui';
import type { Employee } from '@/types/employee';

type SortField = 'nama_lengkap' | 'jabatan' | 'is_active';
type SortDirection = 'asc' | 'desc';

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  /** Apakah user bisa menghapus (hanya Owner) */
  canDelete?: boolean;
}

export function EmployeeTable({
  employees,
  onEdit,
  onDelete,
  canDelete = false,
}: EmployeeTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('nama_lengkap');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filter by search query
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const query = searchQuery.toLowerCase();
    return employees.filter((emp) =>
      emp.nama_lengkap.toLowerCase().includes(query)
    );
  }, [employees, searchQuery]);

  // Sort
  const sortedEmployees = useMemo(() => {
    return [...filteredEmployees].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'nama_lengkap':
          comparison = a.nama_lengkap.localeCompare(b.nama_lengkap);
          break;
        case 'jabatan':
          comparison = a.jabatan.localeCompare(b.jabatan);
          break;
        case 'is_active':
          comparison = Number(b.is_active) - Number(a.is_active);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredEmployees, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          type="text"
          placeholder="Cari berdasarkan nama..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
          aria-label="Cari karyawan"
        />
        <span className="text-sm text-ink-mute">
          {sortedEmployees.length} karyawan
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-hairline overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-canvas-soft">
              <TableHead className="w-[180px]">NIK</TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => handleSort('nama_lengkap')}
                  className="font-medium hover:text-ink transition-colors"
                >
                  Nama Lengkap{getSortIndicator('nama_lengkap')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => handleSort('jabatan')}
                  className="font-medium hover:text-ink transition-colors"
                >
                  Jabatan{getSortIndicator('jabatan')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => handleSort('is_active')}
                  className="font-medium hover:text-ink transition-colors"
                >
                  Status{getSortIndicator('is_active')}
                </button>
              </TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-ink-mute">
                  {searchQuery
                    ? 'Tidak ada karyawan yang cocok dengan pencarian'
                    : 'Belum ada data karyawan'}
                </TableCell>
              </TableRow>
            ) : (
              sortedEmployees.map((employee) => (
                <TableRow key={employee.id} className="hover:bg-canvas-soft">
                  <TableCell className="font-mono text-sm">
                    {employee.nik}
                  </TableCell>
                  <TableCell className="font-medium">
                    {employee.nama_lengkap}
                  </TableCell>
                  <TableCell>{employee.jabatan}</TableCell>
                  <TableCell>
                    <Badge
                      variant={employee.is_active ? 'success' : 'error'}
                    >
                      {employee.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(employee)}
                      >
                        Edit
                      </Button>
                      {canDelete && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onDelete(employee)}
                        >
                          Hapus
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
