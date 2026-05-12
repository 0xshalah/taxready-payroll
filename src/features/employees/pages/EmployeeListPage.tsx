/**
 * Halaman daftar karyawan
 * Validates: Persyaratan 1.5, 8.7
 *
 * Fitur:
 * - Tabel karyawan dengan kolom NIK (masked untuk Regular Staff), nama, jabatan, status
 * - Tombol tambah karyawan
 * - Dialog konfirmasi hapus
 * - Pencatatan audit untuk operasi delete
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui';
import { EmployeeTable } from '@/features/employees/components/EmployeeTable';
import {
  useEmployees,
  useDeleteEmployee,
} from '@/features/employees/hooks/useEmployees';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { logEmployeeChange } from '@/lib/auditLogger';
import type { Employee } from '@/types/employee';

export function EmployeeListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role ?? 'regular_staff';

  const { data: employees, isLoading, error } = useEmployees(userRole);
  const deleteMutation = useDeleteEmployee();

  // Delete confirmation dialog state
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (employee: Employee) => {
    navigate(`/employees/${employee.id}`);
  };

  const handleDeleteRequest = (employee: Employee) => {
    setDeleteTarget(employee);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !user) return;

    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);

      // Audit: log employee delete
      await logEmployeeChange({
        userId: user.id,
        companyId: user.company_id,
        userRole: user.role,
        action: 'employee_delete',
        employeeId: deleteTarget.id,
        employeeName: deleteTarget.nama_lengkap,
      });

      setDeleteTarget(null);
    } catch {
      // Error handled by mutation state
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <p className="text-ink-mute">Memuat data karyawan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-error-bg border border-error/20 p-4">
          <p className="text-sm text-error-foreground">
            Gagal memuat data karyawan: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Daftar Karyawan</CardTitle>
          <Button onClick={() => navigate('/employees/new')}>
            + Tambah Karyawan
          </Button>
        </CardHeader>
        <CardContent>
          <EmployeeTable
            employees={employees ?? []}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            canDelete={userRole === 'owner'}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Karyawan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data karyawan{' '}
              <strong>{deleteTarget?.nama_lengkap}</strong>? Tindakan ini tidak
              dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
