/**
 * PayrollResultTable — Tabel hasil perhitungan per karyawan
 * Kolom: Nama, Bruto, PPh 21, BPJS Karyawan, Gaji Bersih, Status
 *
 * Validates: Persyaratan 4.2, 4.6, 4.7
 */

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Badge,
} from '@/components/ui';
import type { PayrollBatchResult } from '@/types/payroll';

interface PayrollResultTableProps {
  result: PayrollBatchResult;
}

/**
 * Format angka ke format mata uang Indonesia (Rp X.XXX.XXX)
 */
function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function PayrollResultTable({ result }: PayrollResultTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead className="text-right">Bruto</TableHead>
          <TableHead className="text-right">PPh 21</TableHead>
          <TableHead className="text-right">BPJS Karyawan</TableHead>
          <TableHead className="text-right">Gaji Bersih</TableHead>
          <TableHead className="text-center">Status</TableHead>
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
