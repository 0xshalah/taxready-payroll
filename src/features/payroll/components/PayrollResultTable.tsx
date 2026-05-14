/**
 * PayrollResultTable — Tabel hasil perhitungan per karyawan
 * Kolom: Nama, Bruto, PPh 21, BPJS Karyawan, Gaji Bersih, Status, Aksi
 * Fitur: Klik "Detail" untuk melihat rincian formula perhitungan
 *
 * Validates: Persyaratan 4.2, 4.6, 4.7, Fitur Transparansi #1
 */

import { useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Badge,
  Button,
} from '@/components/ui';
import { Eye } from 'lucide-react';
import { CalculationDetailDialog } from './CalculationDetailDialog';
import type { PayrollBatchResult, PayrollEmployeeResult } from '@/types/payroll';

interface PayrollResultTableProps {
  result: PayrollBatchResult;
  /** Map employee_id → TER rate percent (untuk ditampilkan di detail) */
  terRateMap?: Record<string, number>;
}

/**
 * Format angka ke format mata uang Indonesia (Rp X.XXX.XXX)
 */
function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function PayrollResultTable({ result, terRateMap }: PayrollResultTableProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollEmployeeResult | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleShowDetail = (employee: PayrollEmployeeResult) => {
    setSelectedEmployee(employee);
    setDialogOpen(true);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead className="text-right">Bruto</TableHead>
            <TableHead className="text-right">PPh 21</TableHead>
            <TableHead className="text-right">BPJS Karyawan</TableHead>
            <TableHead className="text-right">Gaji Bersih</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.results.map((row) => (
            <TableRow key={row.employee_id}>
              <TableCell className="font-medium">{row.nama}</TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(row.gross_income)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(row.pph21)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(row.bpjs_employee_total)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(row.net_pay)}
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant={
                    row.status === 'success'
                      ? 'success'
                      : row.status === 'warning'
                        ? 'warning'
                        : 'error'
                  }
                >
                  {row.status === 'success'
                    ? 'Sukses'
                    : row.status === 'warning'
                      ? 'Perlu Ditinjau'
                      : 'Gagal'}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShowDetail(row)}
                  aria-label={`Lihat rincian perhitungan ${row.nama}`}
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Detail
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {result.errors.map((err) => (
            <TableRow key={err.employee_id}>
              <TableCell className="font-medium">{err.nama}</TableCell>
              <TableCell className="text-right font-mono">-</TableCell>
              <TableCell className="text-right font-mono">-</TableCell>
              <TableCell className="text-right font-mono">-</TableCell>
              <TableCell className="text-right font-mono">-</TableCell>
              <TableCell className="text-center">
                <Badge variant="error">Gagal</Badge>
              </TableCell>
              <TableCell className="text-center">—</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Calculation Detail Dialog */}
      <CalculationDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={selectedEmployee}
        terRatePercent={
          selectedEmployee && terRateMap
            ? terRateMap[selectedEmployee.employee_id]
            : undefined
        }
      />
    </>
  );
}
