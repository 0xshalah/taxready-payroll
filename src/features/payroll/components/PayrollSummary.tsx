/**
 * PayrollSummary — Ringkasan total hasil proses penggajian
 * Menampilkan: Total Karyawan, Total Bruto, Total PPh 21, Total BPJS, Total Gaji Bersih
 *
 * Validates: Persyaratan 4.7, 11.5
 */

import { Card, CardContent } from '@/components/ui';
import type { PayrollBatchResult } from '@/types/payroll';

interface PayrollSummaryProps {
  result: PayrollBatchResult;
}

/**
 * Format angka ke format mata uang Indonesia (Rp X.XXX.XXX)
 */
function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

interface SummaryCardProps {
  label: string;
  value: string;
}

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <Card className="flex-1 min-w-[140px]">
      <CardContent className="p-3 md:p-4">
        <p className="text-[10px] md:text-xs text-ink-mute uppercase tracking-wide">{label}</p>
        <p className="text-base md:text-xl font-medium text-ink mt-1 font-mono truncate">{value}</p>
      </CardContent>
    </Card>
  );
}

export function PayrollSummary({ result }: PayrollSummaryProps) {
  const totalBruto = result.results.reduce((sum, r) => sum + r.gross_income, 0);
  const totalPPh21 = result.results.reduce((sum, r) => sum + r.pph21, 0);
  const totalBPJS = result.results.reduce((sum, r) => sum + r.bpjs_employee_total, 0);
  const totalNetPay = result.total_net_pay;
  const totalKaryawan = result.success_count + result.failed_count;

  return (
    <div className="flex flex-wrap gap-3 overflow-x-auto pb-1">
      <SummaryCard label="Total Karyawan" value={`${totalKaryawan}`} />
      <SummaryCard label="Total Bruto" value={formatCurrency(totalBruto)} />
      <SummaryCard label="Total PPh 21" value={formatCurrency(totalPPh21)} />
      <SummaryCard label="Total BPJS" value={formatCurrency(totalBPJS)} />
      <SummaryCard label="Total Gaji Bersih" value={formatCurrency(totalNetPay)} />
    </div>
  );
}
