/**
 * MyPayslipsPage — Halaman slip gaji untuk Regular Staff
 * Menampilkan riwayat slip gaji dari payroll_results berdasarkan employee_id
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Calendar, Banknote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface PayslipEntry {
  id: string;
  period: string;
  nama: string;
  gaji_pokok: number;
  tunjangan_tetap: number;
  uang_lembur: number;
  gross_income: number;
  pph21: number;
  bpjs_employee_total: number;
  total_deductions: number;
  net_pay: number;
  status: string;
  processed_at: string;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatCurrency(amount: number): string {
  return `Rp ${Number(amount).toLocaleString('id-ID')}`;
}

function formatPeriod(period: string): string {
  const parts = period.split('-');
  if (parts.length === 2) {
    const monthIdx = parseInt(parts[1]!, 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${MONTH_NAMES[monthIdx]} ${parts[0]}`;
    }
  }
  return period;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

interface SlipDetailRowProps {
  label: string;
  value: string;
  isDeduction?: boolean;
  isTotal?: boolean;
}

function SlipDetailRow({ label, value, isDeduction, isTotal }: SlipDetailRowProps) {
  return (
    <div className={`flex items-center justify-between py-1.5 border-b border-hairline-cool last:border-0 ${isTotal ? 'pt-2 mt-1 border-t-2 border-hairline' : ''}`}>
      <span className={`text-sm ${isTotal ? 'font-medium text-ink' : 'text-ink-mute'}`}>{label}</span>
      <span className={`text-sm font-mono ${isDeduction ? 'text-[#991b1b]' : isTotal ? 'font-medium text-ink' : 'text-ink'}`}>
        {isDeduction ? `- ${value}` : value}
      </span>
    </div>
  );
}

export function MyPayslipsPage() {
  const { user } = useAuth();

  const { data: payslips, isLoading } = useQuery({
    queryKey: ['my-payslips', user?.id],
    queryFn: async (): Promise<PayslipEntry[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('payroll_results')
        .select('id, period, nama, gaji_pokok, tunjangan_tetap, uang_lembur, gross_income, pph21, bpjs_employee_total, total_deductions, net_pay, status, processed_at')
        .eq('employee_id', user.id)
        .order('period', { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as PayslipEntry[];
    },
    enabled: !!user?.id,
  });

  const [selectedPayslip, setSelectedPayslip] = useState<PayslipEntry | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink tracking-tight">Slip Gaji Saya</h1>
        <p className="text-sm text-ink-mute mt-1">Riwayat slip gaji Anda.</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <div className="h-10 w-20 bg-canvas-soft rounded animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-canvas-soft rounded animate-pulse" />
                    <div className="h-3 w-48 bg-canvas-soft rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (!payslips || payslips.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-ink-faint mx-auto mb-3" />
            <p className="text-sm text-ink-mute">Belum ada slip gaji.</p>
            <p className="text-xs text-ink-faint mt-1">Slip gaji akan muncul setelah penggajian diproses oleh HR.</p>
          </CardContent>
        </Card>
      )}

      {payslips && payslips.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* List */}
          <div className="space-y-3">
            {payslips.map((slip, index) => (
              <motion.div
                key={slip.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Card
                  className={`cursor-pointer transition-colors hover:bg-canvas-soft/50 ${selectedPayslip?.id === slip.id ? 'border-primary' : ''}`}
                  onClick={() => setSelectedPayslip(slip)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 rounded-lg p-2.5 shrink-0">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink">{formatPeriod(slip.period)}</p>
                        <p className="text-xs text-ink-mute mt-0.5">Diproses {formatDate(slip.processed_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-ink font-mono">{formatCurrency(slip.net_pay)}</p>
                        <p className="text-xs text-ink-mute">Gaji Bersih</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Detail */}
          {selectedPayslip && (
            <motion.div
              key={selectedPayslip.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Slip Gaji {formatPeriod(selectedPayslip.period)}</span>
                    <Badge variant="success">Diproses</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Penghasilan */}
                  <div>
                    <p className="text-xs font-medium text-ink-mute uppercase tracking-wide mb-2">Penghasilan</p>
                    <SlipDetailRow label="Gaji Pokok" value={formatCurrency(selectedPayslip.gaji_pokok)} />
                    <SlipDetailRow label="Tunjangan Tetap" value={formatCurrency(selectedPayslip.tunjangan_tetap)} />
                    {selectedPayslip.uang_lembur > 0 && (
                      <SlipDetailRow label="Uang Lembur" value={formatCurrency(selectedPayslip.uang_lembur)} />
                    )}
                    <SlipDetailRow label="Total Bruto" value={formatCurrency(selectedPayslip.gross_income)} isTotal />
                  </div>

                  {/* Potongan */}
                  <div>
                    <p className="text-xs font-medium text-ink-mute uppercase tracking-wide mb-2">Potongan</p>
                    <SlipDetailRow label="PPh 21" value={formatCurrency(selectedPayslip.pph21)} isDeduction />
                    <SlipDetailRow label="BPJS Karyawan" value={formatCurrency(selectedPayslip.bpjs_employee_total)} isDeduction />
                    <SlipDetailRow label="Total Potongan" value={formatCurrency(selectedPayslip.total_deductions)} isTotal />
                  </div>

                  {/* Gaji Bersih */}
                  <div className="bg-canvas-soft rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-ink">Gaji Bersih (Take-Home Pay)</span>
                    </div>
                    <span className="text-lg font-medium text-ink font-mono">{formatCurrency(selectedPayslip.net_pay)}</span>
                  </div>

                  <p className="text-xs text-ink-faint">
                    Diproses pada {formatDate(selectedPayslip.processed_at)}. Hasil perhitungan bersifat estimasi.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
