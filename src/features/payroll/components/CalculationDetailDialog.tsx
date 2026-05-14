/**
 * CalculationDetailDialog — Dialog rincian perhitungan per karyawan
 * Menampilkan formula transparansi: "PPh 21 = Bruto × Rate%"
 * Termasuk breakdown BPJS dan net pay.
 *
 * Validates: Fitur Transparansi #1
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Badge,
} from '@/components/ui';
import type { PayrollEmployeeResult } from '@/types/payroll';

interface CalculationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: PayrollEmployeeResult | null;
  /** TER rate percent yang digunakan dalam perhitungan */
  terRatePercent?: number;
}

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function FormulaRow({
  label,
  formula,
  result,
  highlight = false,
}: {
  label: string;
  formula?: string;
  result: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between py-2 border-b border-hairline-cool last:border-0 ${
        highlight ? 'bg-canvas-soft -mx-3 px-3 rounded-md' : ''
      }`}
    >
      <div className="flex-1">
        <p className="text-sm text-ink">{label}</p>
        {formula && (
          <p className="text-xs text-ink-mute font-mono mt-0.5">{formula}</p>
        )}
      </div>
      <span className={`text-sm font-mono font-medium ${highlight ? 'text-primary' : 'text-ink'}`}>
        {result}
      </span>
    </div>
  );
}

export function CalculationDetailDialog({
  open,
  onOpenChange,
  employee,
  terRatePercent,
}: CalculationDetailDialogProps) {
  if (!employee) return null;

  const rate = terRatePercent ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Rincian Perhitungan</DialogTitle>
          <DialogDescription>
            Detail formula perhitungan gaji untuk <strong>{employee.nama}</strong>
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 mt-2"
          >
            {/* Section: Penghasilan Bruto */}
            <div>
              <h4 className="text-xs font-medium text-ink-mute uppercase tracking-wide mb-2">
                Penghasilan Bruto
              </h4>
              <div className="space-y-0">
                <FormulaRow
                  label="Gaji Pokok"
                  result={formatCurrency(employee.gaji_pokok)}
                />
                <FormulaRow
                  label="Tunjangan Tetap"
                  result={formatCurrency(employee.tunjangan_tetap)}
                />
                <FormulaRow
                  label="Uang Lembur"
                  result={formatCurrency(employee.uang_lembur)}
                />
                <FormulaRow
                  label="Total Bruto"
                  formula={`= ${formatCurrency(employee.gaji_pokok)} + ${formatCurrency(employee.tunjangan_tetap)} + ${formatCurrency(employee.uang_lembur)}`}
                  result={formatCurrency(employee.gross_income)}
                  highlight
                />
              </div>
            </div>

            {/* Section: PPh 21 */}
            <div>
              <h4 className="text-xs font-medium text-ink-mute uppercase tracking-wide mb-2">
                PPh Pasal 21 (TER — PP 58/2023)
              </h4>
              <div className="space-y-0">
                <FormulaRow
                  label="PPh 21"
                  formula={`= floor(${formatCurrency(employee.gross_income)} × ${rate}%)`}
                  result={formatCurrency(employee.pph21)}
                  highlight
                />
                <div className="mt-1">
                  <Badge variant="default">
                    Tarif TER: {rate}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* Section: BPJS Karyawan */}
            <div>
              <h4 className="text-xs font-medium text-ink-mute uppercase tracking-wide mb-2">
                Potongan BPJS (Bagian Karyawan)
              </h4>
              <div className="space-y-0">
                <FormulaRow
                  label="Total BPJS Karyawan"
                  formula="= JHT + JP + Kesehatan (karyawan)"
                  result={formatCurrency(employee.bpjs_employee_total)}
                />
              </div>
            </div>

            {/* Section: Total Potongan & Gaji Bersih */}
            <div>
              <h4 className="text-xs font-medium text-ink-mute uppercase tracking-wide mb-2">
                Gaji Bersih (Take-Home Pay)
              </h4>
              <div className="space-y-0">
                <FormulaRow
                  label="Total Potongan"
                  formula={`= PPh 21 + BPJS Karyawan = ${formatCurrency(employee.pph21)} + ${formatCurrency(employee.bpjs_employee_total)}`}
                  result={formatCurrency(employee.total_deductions)}
                />
                <FormulaRow
                  label="Gaji Bersih"
                  formula={`= Bruto − Total Potongan = ${formatCurrency(employee.gross_income)} − ${formatCurrency(employee.total_deductions)}`}
                  result={formatCurrency(employee.net_pay)}
                  highlight
                />
              </div>
            </div>

            {/* Referensi Regulasi */}
            <div className="pt-2 border-t border-hairline">
              <p className="text-xs text-ink-mute">
                <strong>Dasar Hukum:</strong> Perhitungan PPh 21 menggunakan skema Tarif Efektif
                Rata-rata (TER) sesuai PP 58/2023 jo. PMK 168/2023, berlaku sejak 1 Januari 2024.
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
