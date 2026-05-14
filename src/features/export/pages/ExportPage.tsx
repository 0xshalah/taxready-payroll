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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  Input,
} from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  generateCoretaxCSV,
  ExportValidationError,
} from '@/features/export/generators/csvGenerator';
import { generateCoretaxXML } from '@/features/export/generators/xmlGenerator';
import { downloadBPA1 } from '@/features/export/generators/pdfBPA1Generator';
import { supabase } from '@/lib/supabase';
import { logExportDocument, logUnauthorizedAccess } from '@/lib/auditLogger';
import type { ExportRecord, ValidationError } from '@/features/export/generators/csvGenerator';

type ExportFormat = 'csv' | 'xml' | 'pdf_bpa1';

interface SecureExportRecord extends ExportRecord {
  ptkp_status: string;
}

interface SecureExportResponse {
  records: SecureExportRecord[];
  company_name: string;
  company_npwp: string;
  period: string;
}

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

  // Step-up password dialog state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [stepUpPassword, setStepUpPassword] = useState('');
  const [stepUpError, setStepUpError] = useState<string | null>(null);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  // Fetch company info from database
  const { data: companyInfo } = useQuery({
    queryKey: ['company-info', companyId],
    queryFn: () => fetchCompanyInfo(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const companyNPWP = companyInfo?.npwp_badan ?? '';

  /**
   * Step-up: verify password, get fresh session token, call Edge Function.
   * Restores original session afterward.
   */
  const handleStepUpAndExport = useCallback(async () => {
    if (!user || !companyNPWP) {
      setExportError('Data pengguna atau perusahaan belum lengkap.');
      return;
    }

    setStepUpError(null);
    setIsVerifyingPassword(true);

    try {
      // Save current session
      const { data: { session: oldSession } } = await supabase.auth.getSession();

      // Re-authenticate with password (step-up verification)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: stepUpPassword,
      });

      if (signInError || !signInData.session) {
        setStepUpError('Password salah. Silakan coba lagi.');
        setIsVerifyingPassword(false);
        return;
      }

      // Close password dialog
      setShowPasswordDialog(false);
      setStepUpPassword('');
      setStepUpError(null);

      const freshToken = signInData.session.access_token;
      const period = { month: selectedMonth, year: selectedYear };
      const periodStrLocal = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

      // Call Edge Function with fresh token
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('secure-export', {
        headers: { Authorization: `Bearer ${freshToken}` },
        body: {
          company_id: companyId,
          period: periodStrLocal,
          format,
        },
      });

      // Restore old session
      if (oldSession) {
        await supabase.auth.setSession({
          access_token: oldSession.access_token,
          refresh_token: oldSession.refresh_token,
        });
      }

      if (edgeError) {
        const errMsg = edgeError.message || 'Gagal memproses ekspor.';
        if (errMsg.includes('Akses ditolak') || errMsg.includes('403')) {
          // Log unauthorized access attempt
          logUnauthorizedAccess({
            userId: user.id,
            companyId,
            userRole: user.role,
            attemptedResource: 'secure_export',
            attemptedAction: 'mass_export',
          }).catch(() => {});
          setExportError('Akses ditolak. Hanya Owner yang dapat melakukan ekspor data massal.');
        } else {
          setExportError(errMsg);
        }
        setIsExporting(false);
        return;
      }

      const exportData = edgeData as SecureExportResponse;

      if (!exportData.records || exportData.records.length === 0) {
        setExportError(`Belum ada data penggajian untuk periode ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}. Proses penggajian terlebih dahulu.`);
        setIsExporting(false);
        return;
      }

      setIsExporting(true);
      setValidationErrors([]);
      setExportError(null);
      setExportSuccess(null);

      // Process export based on format
      if (format === 'csv') {
        const result = generateCoretaxCSV(exportData.company_name, period, exportData.records);
        const blob = new Blob([result.content], { type: 'text/csv;charset=utf-8' });
        triggerDownload(blob, result.filename);
        setExportSuccess(`File ${result.filename} berhasil diunduh.`);
        logExportDocument({
          userId: user.id, companyId, userRole: user.role,
          exportType: 'csv', periodMonth: selectedMonth, periodYear: selectedYear,
          fileName: result.filename,
        }).catch(() => {});
      } else if (format === 'xml') {
        const result = generateCoretaxXML(exportData.company_name, period, exportData.records);
        const blob = new Blob([result.content], { type: 'application/xml;charset=utf-8' });
        triggerDownload(blob, result.filename);
        setExportSuccess(`File ${result.filename} berhasil diunduh.`);
        logExportDocument({
          userId: user.id, companyId, userRole: user.role,
          exportType: 'xml', periodMonth: selectedMonth, periodYear: selectedYear,
          fileName: result.filename,
        }).catch(() => {});
      } else if (format === 'pdf_bpa1') {
        let successCount = 0;
        const errors: string[] = [];

        for (const record of exportData.records) {
          try {
            const result = await downloadBPA1(
              {
                nama: record.nama_lengkap,
                nik: record.nik,
                ptkp_status: record.ptkp_status ?? 'TK/0',
                gross_income: record.gross_income,
                pph21: record.pph21,
              },
              {
                nama_perusahaan: exportData.company_name,
                npwp_badan: exportData.company_npwp,
              },
              period
            );
            triggerDownload(result.blob, result.filename);
            successCount++;
          } catch (err) {
            errors.push(
              `${record.nama_lengkap}: ${err instanceof Error ? err.message : 'Gagal generate'}`
            );
          }
        }

        if (successCount > 0) {
          setExportSuccess(`${successCount} file BPA1 berhasil diunduh.`);
        }
        if (errors.length > 0) {
          setExportError(`${errors.length} karyawan gagal: ${errors.join('; ')}`);
        }
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
      setIsVerifyingPassword(false);
    }
  }, [user, companyId, companyNPWP, selectedMonth, selectedYear, format, stepUpPassword]);

  const handleExportClick = useCallback(() => {
    if (!user) return;
    // Open step-up password dialog
    setStepUpPassword('');
    setStepUpError(null);
    setShowPasswordDialog(true);
  }, [user]);

  const handleGenerateBPA1Click = useCallback(() => {
    if (!user) return;
    setFormat('pdf_bpa1');
    setStepUpPassword('');
    setStepUpError(null);
    setShowPasswordDialog(true);
  }, [user]);

  const handlePasswordSubmit = useCallback(async () => {
    if (!stepUpPassword) {
      setStepUpError('Masukkan password Anda.');
      return;
    }
    await handleStepUpAndExport();
  }, [stepUpPassword, handleStepUpAndExport]);

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
            <Button variant="outline" disabled={isExporting}>
              Validasi Data
            </Button>
            {format !== 'pdf_bpa1' ? (
              <Button onClick={handleExportClick} disabled={isExporting}>
                {isExporting ? 'Mengekspor...' : `Download ${format.toUpperCase()}`}
              </Button>
            ) : (
              <Button onClick={handleGenerateBPA1Click} disabled={isExporting}>
                {isExporting ? 'Generating...' : 'Generate BPA1'}
              </Button>
            )}
          </div>

          <p className="text-xs text-ink-mute">
            {isExporting ? 'Memproses...' : 'Konfigurasi periode dan format ekspor di atas.'}
          </p>
        </CardContent>
      </Card>

      {/* Step-up Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={(open) => { if (!isVerifyingPassword) setShowPasswordDialog(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Password</DialogTitle>
            <DialogDescription>
              Ekspor data massal mengandung informasi pribadi (NIK) dan data penggajian.
              Masukkan password Anda untuk melanjutkan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              type="password"
              placeholder="Masukkan password"
              value={stepUpPassword}
              onChange={(e) => { setStepUpPassword(e.target.value); setStepUpError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordSubmit(); }}
              autoFocus
              disabled={isVerifyingPassword}
            />
            {stepUpError && (
              <p className="text-sm text-[#ef4444]">{stepUpError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowPasswordDialog(false); setStepUpPassword(''); setStepUpError(null); }}
              disabled={isVerifyingPassword}
            >
              Batal
            </Button>
            <Button onClick={handlePasswordSubmit} disabled={isVerifyingPassword || !stepUpPassword}>
              {isVerifyingPassword ? 'Memverifikasi...' : 'Konfirmasi & Ekspor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
