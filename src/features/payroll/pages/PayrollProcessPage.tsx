/**
 * PayrollProcessPage — Halaman proses penggajian
 * Alur: Pilih periode → Validasi data → Proses → Tampilkan hasil
 *
 * Fitur:
 * - Pilih bulan dan tahun
 * - Deteksi periode duplikat dengan konfirmasi overwrite
 * - Progress indicator saat proses berjalan
 * - Lock (disable) tombol saat proses berjalan
 * - Tampilkan ringkasan dan tabel hasil
 *
 * Validates: Persyaratan 4.1, 4.2, 4.3, 4.6, 4.7, 11.1, 11.2, 11.5, 11.6
 */

import { useState, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Select,
  SelectOption,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEmployees } from '@/features/employees/hooks/useEmployees';
import { useTERRates, useBPJSConfig } from '@/features/settings/hooks/useSettings';
import { processBatchPayroll, BatchValidationError } from '@/features/payroll/engine/batchProcessor';
import { PayrollBatchRunner } from '@/features/payroll/components/PayrollBatchRunner';
import { PayrollResultTable } from '@/features/payroll/components/PayrollResultTable';
import { PayrollSummary } from '@/features/payroll/components/PayrollSummary';
import type { PayrollBatchResult, EmployeePayrollData } from '@/types/payroll';
import type { Employee } from '@/types/employee';

/** Nama bulan dalam Bahasa Indonesia */
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/**
 * Konversi data Employee ke EmployeePayrollData untuk batch processor
 */
function toPayrollData(employee: Employee): EmployeePayrollData {
  return {
    employee_id: employee.id,
    nama: employee.nama_lengkap,
    nik: employee.nik,
    ptkp_status: employee.ptkp_status,
    gaji_pokok: employee.gaji_pokok,
    tunjangan_tetap: employee.tunjangan_tetap,
    uang_lembur: 0, // Default 0, bisa diinput manual per periode
  };
}

export function PayrollProcessPage() {
  const { user } = useAuth();
  const companyId = user?.company_id ?? '';

  // Data hooks
  const { data: employees, isLoading: loadingEmployees } = useEmployees(user?.role ?? 'owner');
  const { data: terRates, isLoading: loadingTER } = useTERRates(companyId);
  const { data: bpjsConfig, isLoading: loadingBPJS } = useBPJSConfig(companyId);

  // Period selection
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Results
  const [result, setResult] = useState<PayrollBatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{ nama: string; errors: string[] }>>([]);

  // Duplicate period dialog
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [processedPeriods, setProcessedPeriods] = useState<Set<string>>(new Set());

  const isDataLoading = loadingEmployees || loadingTER || loadingBPJS;
  const activeEmployees = employees?.filter((e) => e.is_active) ?? [];

  /**
   * Memulai proses penggajian
   */
  const startProcessing = useCallback(async () => {
    if (!terRates || !bpjsConfig || activeEmployees.length === 0) {
      setError('Data konfigurasi belum lengkap. Pastikan tarif TER dan BPJS sudah dikonfigurasi.');
      return;
    }

    setError(null);
    setValidationErrors([]);
    setResult(null);
    setIsProcessing(true);
    setTotalCount(activeEmployees.length);
    setProcessedCount(0);

    try {
      const payrollData: EmployeePayrollData[] = activeEmployees.map(toPayrollData);

      // Simulate progress with a small delay for UX
      const progressInterval = setInterval(() => {
        setProcessedCount((prev) => {
          if (prev < activeEmployees.length) {
            return prev + 1;
          }
          return prev;
        });
      }, 100);

      const batchResult = processBatchPayroll(
        {
          company_id: companyId,
          period_month: selectedMonth,
          period_year: selectedYear,
          employees: payrollData,
        },
        terRates,
        bpjsConfig,
      );

      clearInterval(progressInterval);
      setProcessedCount(activeEmployees.length);

      // Mark period as processed
      const periodKey = `${selectedYear}-${selectedMonth}`;
      setProcessedPeriods((prev) => new Set(prev).add(periodKey));

      setResult(batchResult);
    } catch (err) {
      if (err instanceof BatchValidationError) {
        setValidationErrors(
          err.validationErrors.map((ve) => ({
            nama: ve.nama,
            errors: ve.errors,
          }))
        );
        setError('Validasi data gagal. Perbaiki data karyawan berikut sebelum memproses penggajian.');
      } else {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses penggajian.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [terRates, bpjsConfig, activeEmployees, companyId, selectedMonth, selectedYear]);

  /**
   * Handler tombol proses — cek duplikat periode dulu
   */
  const handleProcess = useCallback(() => {
    const periodKey = `${selectedYear}-${selectedMonth}`;
    if (processedPeriods.has(periodKey)) {
      setShowDuplicateDialog(true);
    } else {
      startProcessing();
    }
  }, [selectedYear, selectedMonth, processedPeriods, startProcessing]);

  /**
   * Konfirmasi overwrite periode duplikat
   */
  const handleConfirmOverwrite = useCallback(() => {
    setShowDuplicateDialog(false);
    startProcessing();
  }, [startProcessing]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium text-ink tracking-tight">Proses Penggajian</h1>
        <p className="text-sm text-ink-mute mt-1">
          Pilih periode dan proses penggajian untuk seluruh karyawan aktif.
        </p>
      </div>

      {/* Period Selection & Process Button */}
      <Card>
        <CardHeader>
          <CardTitle>Periode Penggajian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            {/* Month Select */}
            <div className="space-y-1.5">
              <label htmlFor="month-select" className="text-sm font-medium text-ink">
                Bulan
              </label>
              <Select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                disabled={isProcessing}
              >
                {MONTH_NAMES.map((name, index) => (
                  <SelectOption key={index + 1} value={index + 1}>
                    {name}
                  </SelectOption>
                ))}
              </Select>
            </div>

            {/* Year Select */}
            <div className="space-y-1.5">
              <label htmlFor="year-select" className="text-sm font-medium text-ink">
                Tahun
              </label>
              <Select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                disabled={isProcessing}
              >
                {[2025, 2026, 2027].map((year) => (
                  <SelectOption key={year} value={year}>
                    {year}
                  </SelectOption>
                ))}
              </Select>
            </div>

            {/* Process Button */}
            <PayrollBatchRunner
              isProcessing={isProcessing}
              processedCount={processedCount}
              totalCount={totalCount}
              onProcess={handleProcess}
              disabled={isDataLoading || activeEmployees.length === 0}
            />
          </div>

          {/* Info: jumlah karyawan aktif */}
          {!isDataLoading && (
            <p className="text-xs text-ink-mute mt-3">
              {activeEmployees.length} karyawan aktif akan diproses.
            </p>
          )}

          {isDataLoading && (
            <p className="text-xs text-ink-mute mt-3">Memuat data...</p>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-l-4 border-l-[#ef4444] bg-[#fef2f2]">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-[#991b1b]">{error}</p>
            {validationErrors.length > 0 && (
              <ul className="mt-2 space-y-1">
                {validationErrors.map((ve, idx) => (
                  <li key={idx} className="text-xs text-[#991b1b]">
                    <span className="font-medium">{ve.nama}:</span>{' '}
                    {ve.errors.join(', ')}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Summary */}
          <PayrollSummary result={result} />

          {/* Result Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detail Hasil Penggajian</CardTitle>
            </CardHeader>
            <CardContent>
              <PayrollResultTable result={result} />
            </CardContent>
          </Card>

          {/* Failed employees info */}
          {result.errors.length > 0 && (
            <Card className="border-l-4 border-l-[#f59e0b] bg-[#fffbeb]">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-[#92400e]">
                  {result.failed_count} karyawan gagal diproses:
                </p>
                <ul className="mt-2 space-y-1">
                  {result.errors.map((err) => (
                    <li key={err.employee_id} className="text-xs text-[#92400e]">
                      <span className="font-medium">{err.nama}:</span>{' '}
                      {err.error_message}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Duplicate Period Confirmation Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Periode Sudah Diproses</DialogTitle>
            <DialogDescription>
              Periode {MONTH_NAMES[selectedMonth - 1]} {selectedYear} sudah pernah diproses.
              Timpa hasil sebelumnya?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDuplicateDialog(false)}
            >
              Batal
            </Button>
            <Button onClick={handleConfirmOverwrite}>
              Timpa Hasil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
