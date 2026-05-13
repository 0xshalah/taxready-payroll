/**
 * Form create/edit karyawan dengan validasi real-time
 * Validates: Persyaratan 1.1, 1.2, 1.3, 1.5, 1.6
 *
 * Fitur:
 * - Form fields: NIK, Nama Lengkap, Status PTKP, Tanggal Bergabung, Jabatan, Gaji Pokok, Tunjangan Tetap
 * - Validasi real-time menggunakan employeeFormSchema
 * - Mode create dan edit (berdasarkan URL param :id)
 * - Pencatatan audit untuk setiap operasi
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Label,
  Select,
  SelectOption,
} from '@/components/ui';
import { NIKValidationInput } from '@/features/employees/components/NIKValidationInput';
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
} from '@/features/employees/hooks/useEmployees';
import { employeeFormSchema } from '@/features/employees/validators/employeeSchema';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { logEmployeeChange, logSalaryChange } from '@/lib/auditLogger';
import { PTKP_VALUES } from '@/lib/constants';
import type { EmployeeFormData } from '@/types/employee';

interface FormErrors {
  nik?: string;
  nama_lengkap?: string;
  ptkp_status?: string;
  tanggal_bergabung?: string;
  jabatan?: string;
  gaji_pokok?: string;
  tunjangan_tetap?: string;
}

export function EmployeeFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = !!id;

  // Fetch employees to find the one being edited
  const { data: employees } = useEmployees(user?.role ?? 'regular_staff');
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();

  // Form state
  const [nik, setNik] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [ptkpStatus, setPtkpStatus] = useState('');
  const [tanggalBergabung, setTanggalBergabung] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [gajiPokok, setGajiPokok] = useState('');
  const [tunjanganTetap, setTunjanganTetap] = useState('0');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load existing data in edit mode
  useEffect(() => {
    if (isEditMode && employees) {
      const employee = employees.find((e) => e.id === id);
      if (employee) {
        setNik(employee.nik);
        setNamaLengkap(employee.nama_lengkap);
        setPtkpStatus(employee.ptkp_status);
        setTanggalBergabung(employee.tanggal_bergabung);
        setJabatan(employee.jabatan);
        setGajiPokok(String(employee.gaji_pokok));
        setTunjanganTetap(String(employee.tunjangan_tetap));
      }
    }
  }, [isEditMode, employees, id]);

  const validateForm = useCallback((): boolean => {
    const formData = {
      nik,
      nama_lengkap: namaLengkap,
      ptkp_status: ptkpStatus,
      tanggal_bergabung: tanggalBergabung,
      jabatan,
      gaji_pokok: gajiPokok ? Number(gajiPokok) : undefined,
      tunjangan_tetap: tunjanganTetap ? Number(tunjanganTetap) : 0,
    };

    const result = employeeFormSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  }, [nik, namaLengkap, ptkpStatus, tanggalBergabung, jabatan, gajiPokok, tunjanganTetap]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;
    if (!user) return;

    const formData: EmployeeFormData = {
      nik,
      nama_lengkap: namaLengkap,
      ptkp_status: ptkpStatus as EmployeeFormData['ptkp_status'],
      tanggal_bergabung: tanggalBergabung,
      jabatan,
      gaji_pokok: Number(gajiPokok),
      tunjangan_tetap: Number(tunjanganTetap) || 0,
    };

    try {
      if (isEditMode && id) {
        const existingEmployee = employees?.find((e) => e.id === id);
        const result = await updateMutation.mutateAsync({ id, data: formData });

        // Audit: log employee update
        await logEmployeeChange({
          userId: user.id,
          companyId: user.company_id,
          userRole: user.role,
          action: 'employee_update',
          employeeId: result.id,
          employeeName: result.nama_lengkap,
          changes: {
            nama_lengkap: { old: existingEmployee?.nama_lengkap, new: formData.nama_lengkap },
            jabatan: { old: existingEmployee?.jabatan, new: formData.jabatan },
            ptkp_status: { old: existingEmployee?.ptkp_status, new: formData.ptkp_status },
          },
        });

        // Audit: log salary change if gaji_pokok changed
        if (existingEmployee && existingEmployee.gaji_pokok !== formData.gaji_pokok) {
          await logSalaryChange({
            userId: user.id,
            companyId: user.company_id,
            userRole: user.role,
            employeeId: result.id,
            employeeName: result.nama_lengkap,
            oldSalary: existingEmployee.gaji_pokok,
            newSalary: formData.gaji_pokok,
          });
        }
      } else {
        const result = await createMutation.mutateAsync({ ...formData, company_id: user.company_id });

        // Audit: log employee create
        await logEmployeeChange({
          userId: user.id,
          companyId: user.company_id,
          userRole: user.role,
          action: 'employee_create',
          employeeId: result.id,
          employeeName: result.nama_lengkap,
        });
      }

      navigate('/employees');
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan data'
      );
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* NIK */}
            <NIKValidationInput
              value={nik}
              onChange={setNik}
              disabled={isSubmitting}
              externalError={errors.nik}
            />

            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <Label htmlFor="nama_lengkap">Nama Lengkap</Label>
              <Input
                id="nama_lengkap"
                type="text"
                placeholder="Nama sesuai KTP"
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                disabled={isSubmitting}
                maxLength={150}
                aria-invalid={!!errors.nama_lengkap}
                className={errors.nama_lengkap ? 'border-error' : ''}
              />
              {errors.nama_lengkap && (
                <p className="text-xs text-error">{errors.nama_lengkap}</p>
              )}
            </div>

            {/* Status PTKP */}
            <div className="space-y-1.5">
              <Label htmlFor="ptkp_status">Status PTKP</Label>
              <Select
                id="ptkp_status"
                value={ptkpStatus}
                onChange={(e) => setPtkpStatus(e.target.value)}
                disabled={isSubmitting}
                aria-invalid={!!errors.ptkp_status}
                className={errors.ptkp_status ? 'border-error' : ''}
              >
                <SelectOption value="">Pilih Status PTKP</SelectOption>
                {PTKP_VALUES.map((val) => (
                  <SelectOption key={val} value={val}>
                    {val}
                  </SelectOption>
                ))}
              </Select>
              {errors.ptkp_status && (
                <p className="text-xs text-error">{errors.ptkp_status}</p>
              )}
            </div>

            {/* Tanggal Bergabung */}
            <div className="space-y-1.5">
              <Label htmlFor="tanggal_bergabung">Tanggal Bergabung</Label>
              <Input
                id="tanggal_bergabung"
                type="date"
                value={tanggalBergabung}
                onChange={(e) => setTanggalBergabung(e.target.value)}
                disabled={isSubmitting}
                aria-invalid={!!errors.tanggal_bergabung}
                className={errors.tanggal_bergabung ? 'border-error' : ''}
              />
              {errors.tanggal_bergabung && (
                <p className="text-xs text-error">{errors.tanggal_bergabung}</p>
              )}
            </div>

            {/* Jabatan */}
            <div className="space-y-1.5">
              <Label htmlFor="jabatan">Jabatan</Label>
              <Input
                id="jabatan"
                type="text"
                placeholder="Jabatan karyawan"
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                disabled={isSubmitting}
                maxLength={100}
                aria-invalid={!!errors.jabatan}
                className={errors.jabatan ? 'border-error' : ''}
              />
              {errors.jabatan && (
                <p className="text-xs text-error">{errors.jabatan}</p>
              )}
            </div>

            {/* Gaji Pokok */}
            <div className="space-y-1.5">
              <Label htmlFor="gaji_pokok">Gaji Pokok (Rp)</Label>
              <Input
                id="gaji_pokok"
                type="number"
                placeholder="Contoh: 5000000"
                value={gajiPokok}
                onChange={(e) => setGajiPokok(e.target.value)}
                disabled={isSubmitting}
                min={100000}
                max={999999999}
                aria-invalid={!!errors.gaji_pokok}
                className={errors.gaji_pokok ? 'border-error' : ''}
              />
              {errors.gaji_pokok && (
                <p className="text-xs text-error">{errors.gaji_pokok}</p>
              )}
            </div>

            {/* Tunjangan Tetap */}
            <div className="space-y-1.5">
              <Label htmlFor="tunjangan_tetap">Tunjangan Tetap (Rp)</Label>
              <Input
                id="tunjangan_tetap"
                type="number"
                placeholder="0"
                value={tunjanganTetap}
                onChange={(e) => setTunjanganTetap(e.target.value)}
                disabled={isSubmitting}
                min={0}
                aria-invalid={!!errors.tunjangan_tetap}
                className={errors.tunjangan_tetap ? 'border-error' : ''}
              />
              {errors.tunjangan_tetap && (
                <p className="text-xs text-error">{errors.tunjangan_tetap}</p>
              )}
            </div>

            {/* Submit Error */}
            {submitError && (
              <div className="rounded-md bg-error-bg border border-error/20 p-3">
                <p className="text-sm text-error-foreground">{submitError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Menyimpan...'
                  : isEditMode
                    ? 'Simpan Perubahan'
                    : 'Tambah Karyawan'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/employees')}
                disabled={isSubmitting}
              >
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
