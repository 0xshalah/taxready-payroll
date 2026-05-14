/**
 * PayrollProcessPage — Halaman proses penggajian
 * Alur: Pilih periode → Validasi data → Proses → Simpan ke DB → Tampilkan hasil
 *
 * Semua data disimpan ke database (audit_logs + payroll_results).
 * Deteksi duplikat periode dari database, bukan state lokal.
 * Setelah proses, invalidate cache agar Dashboard & Riwayat langsung update.
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
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
import { supabase } from '@/lib/supabase';
import { logPayrollProcess } from '@/lib/auditLogger';
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
    uang_lembur: 0,
  };
}

/**
 * Cek apakah periode sudah pernah diproses (dari audit_logs di database)
 */
async function checkPeriodExists(companyId: string, month: number, year: number): Promise<boolean> {
  try {
    const periodStr = `${year}-${String(month).padStart(2, '0')}`;
    const { count } = await supabase
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('action_type', 'payroll_process')
      .contains('changes', { period: periodStr });

    return (count ?? 0) > 0;
  } catch {
    return false; // If check fails, allow processing
  }
}

/**
 * Simpan detail hasil penggajian per karyawan ke database
 */
async function savePayrollResults(
  companyId: string,
  month: number,
  year: number,
  results: PayrollBatchResult,
  ptkpMap: Record<string, string>
): Promise<void> {
  const periodStr = `${year}-${String(month).padStart(2, '0')}`;

  // Simpan ke tabel payroll_results (jika ada)
  const rows = results.results.map((r) => ({
    company_id: companyId,
    period: periodStr,
    employee_id: r.employee_id,
    nama: r.nama,
    gaji_pokok: r.gaji_pokok,
    tunjangan_tetap: r.tunjangan_tetap,
    uang_lembur: r.uang_lembur,
    gross_income: r.gross_income,
    pph21: r.pph21,
    bpjs_employee_total: r.bpjs_employee_total,
    bpjs_employer_total: r.bpjs_employer_total,
    total_deductions: r.total_deductions,
    net_pay: r.net_pay,
    status: r.status,
    ptkp_status: ptkpMap[r.employee_id] ?? 'TK/0',
    processed_at: new Date().toISOString(),
  }));

  if (rows.length > 0) {
    // Delete existing results for this period first (overwrite)
    await supabase
      .from('payroll_results')
      .delete()
      .eq('company_id', companyId)
      .eq('period', periodStr);

    // Insert new results
    await supabase.from('payroll_results').insert(rows);
  }
}

export function PayrollProcessPage() {
  const { user } = useAuth();
  const companyId = user?.company_id ?? '';
  const queryClient = useQueryClient();

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Duplicate period dialog
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  const isDataLoading = loadingEmployees || loadingTER || loadingBPJS;
  const activeEmployees = employees?.filter((e) => e.is_active) ?? [];

  /**
   * Memulai proses penggajian dan simpan ke database
   */
  const startProcessing = useCallback(async () => {
    if (!terRates || !bpjsConfig || activeEmployees.length === 0) {
      setError('Data konfigurasi belum lengkap. Pastikan tarif TER dan BPJS sudah dikonfigurasi.');
      return;
    }

    setError(null);
    setValidationErrors([]);
    setResult(null);
    setSuccessMessage(null);
    setIsProcessing(true);
    setTotalCount(activeEmployees.length);
    setProcessedCount(0);

    try {
      const payrollData: EmployeePayrollData[] = activeEmployees.map(toPayrollData);
      // Build ptkp map for saving to payroll_results
      const ptkpMap: Record<string, string> = {};
      activeEmployees.forEach(e => { ptkpMap[e.id] = e.ptkp_status; });

      // Progress indicator
      const progressInterval = setInterval(() => {
        setProcessedCount((prev) => {
          if (prev < activeEmployees.length) return prev + 1;
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
      setResult(batchResult);

      // ─── Simpan ke Database ───────────────────────────────────────────
      const periodId = `${companyId}_${selectedYear}_${String(selectedMonth).padStart(2, '0')}`;

      // 1. Simpan detail per karyawan FIRST (so results aren't lost if audit fails)
      savePayrollResults(companyId, selectedMonth, selectedYear, batchResult, ptkpMap).catch(() => {});

      // 2. Log ke audit trail — STRICT: jika gagal, tampilkan warning (tapi hasil tetap tersimpan)
      if (user) {
        try {
          await logPayrollProcess({
            userId: user.id,
            companyId: companyId,
            userRole: user.role,
            periodId,
            periodMonth: selectedMonth,
            periodYear: selectedYear,
            employeeCount: batchResult.success_count,
            totalNetPay: batchResult.total_net_pay,
          });
        } catch (auditErr) {
          // Hasil sudah tersimpan, tapi audit gagal — warn user
          console.error('[Payroll] Audit log gagal:', auditErr);
          setError('Penggajian berhasil diproses, tetapi gagal mencatat ke audit trail. Hubungi admin.');
        }
      }

      // 3. Invalidate cache → Dashboard & Riwayat update
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-activities'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-history'] });

      // Show success
      setSuccessMessage(
        `Penggajian ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} berhasil diproses! ` +
        `${batchResult.success_count} karyawan berhasil, total gaji bersih Rp ${batchResult.total_net_pay.toLocaleString('id-ID')}.`
      );
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
  }, [terRates, bpjsConfig, activeEmployees, companyId, selectedMonth, selectedYear, user, queryClient]);

  /**
   * Handler tombol proses — cek duplikat periode dari DATABASE
   */
  const handleProcess = useCallback(async () => {
    // Cek dari database apakah periode sudah pernah diproses
    const exists = await checkPeriodExists(companyId, selectedMonth, selectedYear);
    if (exists) {
      setShowDuplicateDialog(true);
    } else {
      startProcessing();
    }
  }, [companyId, selectedYear, selectedMonth, startProcessing]);

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
            <div className="space-y-1.5">
              <label htmlFor="month-select" className="text-sm font-medium text-ink">Bulan</label>
              <Select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                disabled={isProcessing}
              >
                {MONTH_NAMES.map((name, index) => (
                  <SelectOption key={index + 1} value={index + 1}>{name}</SelectOption>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="year-select" className="text-sm font-medium text-ink">Tahun</label>
              <Select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                disabled={isProcessing}
              >
                {[2025, 2026, 2027].map((year) => (
                  <SelectOption key={year} value={year}>{year}</SelectOption>
                ))}
              </Select>
            </div>

            <PayrollBatchRunner
              isProcessing={isProcessing}
              processedCount={processedCount}
              totalCount={totalCount}
              onProcess={handleProcess}
              disabled={isDataLoading || activeEmployees.length === 0}
            />
          </div>

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

      {/* Success Banner */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-l-4 border-l-[#3ecf8e] bg-[#ecfdf5]">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#065f46] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#065f46]">Proses Penggajian Berhasil!</p>
                    <p className="text-xs text-[#065f46]/80 mt-0.5">{successMessage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      {error && (
        <Card className="border-l-4 border-l-[#ef4444] bg-[#fef2f2]">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-[#991b1b]">{error}</p>
            {validationErrors.length > 0 && (
              <ul className="mt-2 space-y-1">
                {validationErrors.map((ve, idx) => (
                  <li key={idx} className="text-xs text-[#991b1b]">
                    <span className="font-medium">{ve.nama}:</span> {ve.errors.join(', ')}
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
          <PayrollSummary result={result} />

          <Card>
            <CardHeader>
              <CardTitle>Detail Hasil Penggajian</CardTitle>
            </CardHeader>
            <CardContent>
              <PayrollResultTable result={result} />
            </CardContent>
          </Card>

          {result.errors.length > 0 && (
            <Card className="border-l-4 border-l-[#f59e0b] bg-[#fffbeb]">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-[#92400e]">
                  {result.failed_count} karyawan gagal diproses:
                </p>
                <ul className="mt-2 space-y-1">
                  {result.errors.map((err) => (
                    <li key={err.employee_id} className="text-xs text-[#92400e]">
                      <span className="font-medium">{err.nama}:</span> {err.error_message}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Duplicate Period Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Periode Sudah Diproses</DialogTitle>
            <DialogDescription>
              Periode {MONTH_NAMES[selectedMonth - 1]} {selectedYear} sudah pernah diproses sebelumnya.
              Apakah Anda ingin menimpa hasil sebelumnya?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
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
