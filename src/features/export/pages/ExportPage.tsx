/**
 * ExportPage — Halaman ekspor laporan Coretax
 * Format: CSV, XML, atau PDF BPA1
 * Fitur: pilih periode, pilih format, validasi pra-ekspor, download
 */

import { useState, useCallback } from 'react';
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
import { useEmployees } from '@/features/employees/hooks/useEmployees';
import {
  generateCoretaxCSV,
  validateExportRecords,
  ExportValidationError,
} from '@/features/export/generators/csvGenerator';
import { generateCoretaxXML } from '@/features/export/generators/xmlGenerator';
import { downloadBPA1 } from '@/features/export/generators/pdfBPA1Generator';
import type { ExportRecord, ValidationError } from '@/features/export/generators/csvGenerator';
import type { Employee } from '@/types/employee';

type ExportFormat = 'csv' | 'xml' | 'pdf_bpa1';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/**
 * Trigger browser download from a Blob
 */
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

/**
 * Convert Employee data to ExportRecord
 * Note: In production, gross_income and pph21 would come from payroll results
 */
function toExportRecord(employee: Employee): ExportRecord {
  return {
    nik: employee.nik,
    nama_lengkap: employee.nama_lengkap,
    gross_income: employee.gaji_pokok + employee.tunjangan_tetap,
    pph21: 0, // Placeholder — would come from payroll processing results
  };
}

export function ExportPage() {
  const { user } = useAuth();
  const { data: employees } = useEmployees(user?.role ?? 'owner');

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const activeEmployees = employees?.filter((e) => e.is_active) ?? [];
  const companyName = 'Perusahaan'; // Placeholder — would come from company data

  /**
   * Run pre-export validation and display results
   */
  const runValidation = useCallback(() => {
    const records = activeEmployees.map(toExportRecord);
    const result = validateExportRecords(records);
    setValidationErrors(result.errors);
    return result.valid;
  }, [activeEmployees]);

  /**
   * Handle CSV/XML export
   */
  const handleExportFile = useCallback(async () => {
    setExportError(null);
    setExportSuccess(null);
    setValidationErrors([]);

    const records = activeEmployees.map(toExportRecord);
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
  }, [activeEmployees, selectedMonth, selectedYear, format, companyName]);

  /**
   * Handle PDF BPA1 generation (per employee)
   */
  const handleGenerateBPA1 = useCallback(async () => {
    setExportError(null);
    setExportSuccess(null);
    setValidationErrors([]);

    if (activeEmployees.length === 0) {
      setExportError('Tidak ada karyawan aktif untuk generate BPA1.');
      return;
    }

    setIsExporting(true);
    let successCount = 0;
    const errors: string[] = [];

    for (const employee of activeEmployees) {
      try {
        const result = await downloadBPA1(
          {
            nama: employee.nama_lengkap,
            nik: employee.nik,
            ptkp_status: employee.ptkp_status,
            gross_income: employee.gaji_pokok + employee.tunjangan_tetap,
            pph21: 0, // Placeholder
          },
          {
            nama_perusahaan: companyName,
            npwp_badan: '0000000000000000', // Placeholder
          },
          { month: selectedMonth, year: selectedYear }
        );
        triggerDownload(result.blob, result.filename);
        successCount++;
      } catch (err) {
        errors.push(
          `${employee.nama_lengkap}: ${err instanceof Error ? err.message : 'Gagal generate'}`
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
  }, [activeEmployees, selectedMonth, selectedYear, companyName]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink tracking-tight">Ekspor Laporan</h1>
        <p className="text-sm text-ink-mute mt-1">
          Ekspor data penggajian ke format Coretax (CSV/XML) atau generate Bukti Potong A1 (PDF).
        </p>
      </div>

      {/* Period & Format Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi Ekspor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* Month */}
            <div className="space-y-1.5">
              <label htmlFor="export-month" className="text-sm font-medium text-ink">
                Bulan
              </label>
              <Select
                id="export-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                disabled={isExporting}
              >
                {MONTH_NAMES.map((name, index) => (
                  <SelectOption key={index + 1} value={index + 1}>
                    {name}
                  </SelectOption>
                ))}
              </Select>
            </div>

            {/* Year */}
            <div className="space-y-1.5">
              <label htmlFor="export-year" className="text-sm font-medium text-ink">
                Tahun
              </label>
              <Select
                id="export-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                disabled={isExporting}
              >
                {[2025, 2026, 2027].map((year) => (
                  <SelectOption key={year} value={year}>
                    {year}
                  </SelectOption>
                ))}
              </Select>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-ink">Format Ekspor</p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="export-format"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={() => setFormat('csv')}
                  disabled={isExporting}
                  className="accent-[#3ecf8e]"
                />
                <span className="text-sm text-ink">CSV (Coretax)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="export-format"
                  value="xml"
                  checked={format === 'xml'}
                  onChange={() => setFormat('xml')}
                  disabled={isExporting}
                  className="accent-[#3ecf8e]"
                />
                <span className="text-sm text-ink">XML (Coretax)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="export-format"
                  value="pdf_bpa1"
                  checked={format === 'pdf_bpa1'}
                  onChange={() => setFormat('pdf_bpa1')}
                  disabled={isExporting}
                  className="accent-[#3ecf8e]"
                />
                <span className="text-sm text-ink">PDF BPA1 (Bukti Potong)</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="outline" onClick={runValidation} disabled={isExporting}>
              Validasi Data
            </Button>
            {format !== 'pdf_bpa1' ? (
              <Button onClick={handleExportFile} disabled={isExporting || activeEmployees.length === 0}>
                {isExporting ? 'Mengekspor...' : `Download ${format.toUpperCase()}`}
              </Button>
            ) : (
              <Button onClick={handleGenerateBPA1} disabled={isExporting || activeEmployees.length === 0}>
                {isExporting ? 'Generating...' : 'Generate BPA1'}
              </Button>
            )}
          </div>

          <p className="text-xs text-ink-mute">
            {activeEmployees.length} karyawan aktif akan diekspor.
          </p>
        </CardContent>
      </Card>

      {/* Success Message */}
      {exportSuccess && (
        <Card className="border-l-4 border-l-[#3ecf8e]">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-ink">{exportSuccess}</p>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {exportError && (
        <Card className="border-l-4 border-l-[#ef4444] bg-[#fef2f2]">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-[#991b1b]">{exportError}</p>
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
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
