/**
 * ExportPage — Halaman ekspor laporan Coretax
 * Format: CSV, XML, atau PDF BPA1
 *
 * FIXED: Mengambil data PPh21 dari payroll_results (bukan placeholder 0)
 * FIXED: Mengambil nama perusahaan & NPWP dari companies table
 */

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectOption,
  Button,
} from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  generateCoretaxCSV,
  validateExportRecords,
  ExportValidationError,
} from '@/features/export/generators/csvGenerator';
import { generateCoretaxXML } from '@/features/export/generators/xmlGenerator';
import { downloadBPA1 } from '@/features/export/generators/pdfBPA1Generator';
import { supabase } from '@/lib/supabase';
import type { ExportRecord, ValidationError } from '@/features/export/generators/csvGenerator';

type ExportFormat = 'csv' | 'xml' | 'pdf_bpa1';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Fetch company info (nama + NPWP) */
async function fetchCompanyInfo(companyId: string) {
  const { data } = await supabase
    .from('companies')
    .select('nama_perusahaan, npwp_badan')
    .eq('id', companyId)
    .single();
  return data;
}

/** Fetch payroll results for a specific period from database */
async function fetchPayrollResults(companyId: string, period: string): Promise<ExportRecord[]> {
  const { data, error } = await supabase
    .from('payroll_results')
    .select('nama, gross_income, pph21, employee_id, ptkp_status')
    .eq('company_id', companyId)
    .eq('period', period)
    .eq('status', 'success');

  if (error || !data || data.length === 0) {
    return [];
  }

  // We need NIK from employees table — fetch encrypted NIK via RPC
  // For export, we need the decrypted NIK
  const employeeIds = data.map(r => r.employee_id);
  const { data: employees } = await supabase
    .from('employees')
    .select('id, nik_encrypted')
    .in('id', employeeIds);

  // Decrypt NIKs — key diambil dari Vault di server, tidak dari client
  const nikMap: Record<string, string> = {};
  if (employees) {
    for (const emp of employees) {
      try {
        const { data: decrypted } = await supabase.rpc('decrypt_value', {
          encrypted_data: emp.nik_encrypted,
        });
        if (decrypted) {
          nikMap[emp.id] = decrypted;
        }
      } catch {
        // Skip if decrypt fails
      }
    }
  }

  return data.map(r => ({
    nik: nikMap[r.employee_id] ?? '',
    nama_lengkap: r.nama,
    gross_income: Number(r.gross_income),
    pph21: Number(r.pph21),
    ptkp_status: r.ptkp_status ?? 'TK/0',
  }));
}

export function ExportPage() {
  const { user } = useAuth();
  const companyId = user?.company_id ?? '';

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Fetch company info from database
  const { data: companyInfo } = useQuery({
    queryKey: ['company-info', companyId],
    queryFn: () => fetchCompanyInfo(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const companyName = companyInfo?.nama_perusahaan ?? 'Perusahaan';
  const companyNPWP = companyInfo?.npwp_badan ?? '';

  const periodStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  // Fetch payroll results for selected period
  const { data: payrollRecords, isLoading: loadingRecords } = useQuery({
    queryKey: ['export-records', companyId, periodStr],
    queryFn: () => fetchPayrollResults(companyId, periodStr),
    enabled: !!companyId,
  });

  const records = payrollRecords ?? [];
  const hasPayrollData = records.length > 0;

  const runValidation = useCallback(() => {
    setExportError(null);
    setExportSuccess(null);
    if (!hasPayrollData) {
      setExportError(`Belum ada data penggajian untuk periode ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}. Proses penggajian terlebih dahulu.`);
      return false;
    }
    const result = validateExportRecords(records);
    setValidationErrors(result.errors);
    if (result.valid) {
      setExportSuccess(`Validasi berhasil! ${records.length} karyawan siap diekspor.`);
    }
    return result.valid;
  }, [records, hasPayrollData, selectedMonth, selectedYear]);

  const handleExportFile = useCallback(async () => {
    if (!hasPayrollData) {
      setExportError(`Belum ada data penggajian untuk periode ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}. Proses penggajian terlebih dahulu.`);
      return;
    }

    const confirmed = window.confirm(
      'File ekspor mengandung data pribadi (NIK) karyawan.\n\n' +
      'Pastikan Anda menyimpan file ini di lokasi yang aman dan tidak membagikannya ke pihak yang tidak berwenang.\n\n' +
      'Lanjutkan download?'
    );
    if (!confirmed) return;

    setExportError(null);
    setExportSuccess(null);
    setValidationErrors([]);

    const period = { month: selectedMonth, year: selectedYear };

    try {
      setIsExporting(true);

      if (format === 'csv') {
        const result = generateCoretaxCSV(companyName, period, records);
        const blob = new Blob([result.content], { type: 'text/csv;charset=utf-8' });
        triggerDownload(blob, result.filename);
        setExportSuccess(`File ${result.filename} berhasil diunduh.`);
      } else if (format === 'xml') {
        const result = generateCoretaxXML(companyName, period, records);
        const blob = new Blob([result.content], { type: 'application/xml;charset=utf-8' });
        triggerDownload(blob, result.filename);
        setExportSuccess(`File ${result.filename} berhasil diunduh.`);
      }
    } catch (err) {
      if (err instanceof ExportValidationError) {
        setValidationErrors(err.errors);
        setExportError('Data tidak valid untuk ekspor. Perbaiki error di bawah.');
      } else {
        setExportError(err instanceof Error ? err.message : 'Gagal mengekspor file.');
      }
    } finally {
      setIsExporting(false);
    }
  }, [records, hasPayrollData, selectedMonth, selectedYear, format, companyName]);

  const handleGenerateBPA1 = useCallback(async () => {
    if (!hasPayrollData) {
      setExportError(`Belum ada data penggajian untuk periode ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}. Proses penggajian terlebih dahulu.`);
      return;
    }

    if (!companyNPWP) {
      setExportError('NPWP Badan perusahaan belum dikonfigurasi.');
      return;
    }

    const confirmed = window.confirm(
      'File BPA1 mengandung data pribadi (NIK) karyawan.\n\n' +
      'Pastikan Anda menyimpan file ini di lokasi yang aman.\n\n' +
      'Lanjutkan generate?'
    );
    if (!confirmed) return;

    setExportError(null);
    setExportSuccess(null);
    setValidationErrors([]);
    setIsExporting(true);

    let successCount = 0;
    const errors: string[] = [];

    for (const record of records) {
      try {
        const result = await downloadBPA1(
          {
            nama: record.nama_lengkap,
            nik: record.nik,
            ptkp_status: (record as ExportRecord & { ptkp_status?: string }).ptkp_status ?? 'TK/0',
            gross_income: record.gross_income,
            pph21: record.pph21,
          },
          {
            nama_perusahaan: companyName,
            npwp_badan: companyNPWP,
          },
          { month: selectedMonth, year: selectedYear }
        );
        triggerDownload(result.blob, result.filename);
        successCount++;
      } catch (err) {
        errors.push(
          `${record.nama_lengkap}: ${err instanceof Error ? err.message : 'Gagal generate'}`
        );
      }
    }

    setIsExporting(false);

    if (successCount > 0) {
      setExportSuccess(`${successCount} file BPA1 berhasil diunduh.`);
    }
    if (errors.length > 0) {
      setExportError(`${errors.length} karyawan gagal: ${errors.join('; ')}`);
    }
  }, [records, hasPayrollData, selectedMonth, selectedYear, companyName, companyNPWP]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink tracking-tight">Ekspor Laporan</h1>
        <p className="text-sm text-ink-mute mt-1">
          Ekspor data penggajian ke format Coretax (CSV/XML) atau generate Bukti Potong A1 (PDF).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi Ekspor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label htmlFor="export-month" className="text-sm font-medium text-ink">Bulan</label>
              <Select id="export-month" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} disabled={isExporting}>
                {MONTH_NAMES.map((name, index) => (
                  <SelectOption key={index + 1} value={index + 1}>{name}</SelectOption>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="export-year" className="text-sm font-medium text-ink">Tahun</label>
              <Select id="export-year" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} disabled={isExporting}>
                {[2025, 2026, 2027].map((year) => (
                  <SelectOption key={year} value={year}>{year}</SelectOption>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink">Format Ekspor</p>
            <div className="flex flex-wrap gap-4">
              {(['csv', 'xml', 'pdf_bpa1'] as const).map((f) => (
                <label key={f} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="export-format" value={f} checked={format === f} onChange={() => setFormat(f)} disabled={isExporting} className="accent-[#3ecf8e]" />
                  <span className="text-sm text-ink">
                    {f === 'csv' ? 'CSV (Coretax)' : f === 'xml' ? 'XML (Coretax)' : 'PDF BPA1 (Bukti Potong)'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="outline" onClick={runValidation} disabled={isExporting || loadingRecords}>
              Validasi Data
            </Button>
            {format !== 'pdf_bpa1' ? (
              <Button onClick={handleExportFile} disabled={isExporting || !hasPayrollData}>
                {isExporting ? 'Mengekspor...' : `Download ${format.toUpperCase()}`}
              </Button>
            ) : (
              <Button onClick={handleGenerateBPA1} disabled={isExporting || !hasPayrollData}>
                {isExporting ? 'Generating...' : 'Generate BPA1'}
              </Button>
            )}
          </div>

          <p className="text-xs text-ink-mute">
            {loadingRecords ? 'Memuat data...' :
              hasPayrollData
                ? `${records.length} karyawan siap diekspor untuk periode ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}.`
                : `Belum ada data penggajian untuk ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}. Proses penggajian terlebih dahulu.`
            }
          </p>
        </CardContent>
      </Card>

      {exportSuccess && (
        <Card className="border-l-4 border-l-[#3ecf8e]">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-ink">{exportSuccess}</p>
          </CardContent>
        </Card>
      )}

      {exportError && (
        <Card className="border-l-4 border-l-[#ef4444] bg-[#fef2f2]">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-[#991b1b]">{exportError}</p>
          </CardContent>
        </Card>
      )}

      {validationErrors.length > 0 && (
        <Card className="border-l-4 border-l-[#f59e0b] bg-[#fffbeb]">
          <CardHeader>
            <CardTitle className="text-sm text-[#92400e]">
              Validasi Pra-Ekspor: {validationErrors.length} error ditemukan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {validationErrors.map((err, idx) => (
                <li key={idx} className="text-xs text-[#92400e]">
                  <span className="font-medium">{err.nama || `#${err.index + 1}`}:</span>{' '}
                  {err.field} — {err.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
