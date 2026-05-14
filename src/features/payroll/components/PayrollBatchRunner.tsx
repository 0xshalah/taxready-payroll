/**
 * PayrollBatchRunner — Tombol "Proses Penggajian" dengan progress indicator
 * Menampilkan progress "Memproses... X/Y karyawan" saat proses berjalan.
 * Tombol di-disable (lock) selama proses berjalan.
 *
 * Validates: Persyaratan 11.1, 11.6
 */

import { Button } from '@/components/ui';
import { Loader2 } from 'lucide-react';

interface PayrollBatchRunnerProps {
  /** Apakah proses sedang berjalan */
  isProcessing: boolean;
  /** Jumlah karyawan yang sudah diproses */
  processedCount: number;
  /** Total karyawan yang akan diproses */
  totalCount: number;
  /** Callback saat tombol diklik */
  onProcess: () => void;
  /** Apakah tombol disabled (misal: belum pilih periode) */
  disabled?: boolean;
}

export function PayrollBatchRunner({
  isProcessing,
  processedCount,
  totalCount,
  onProcess,
  disabled = false,
}: PayrollBatchRunnerProps) {
  return (
    <div className="flex items-center gap-4">
      <Button
        onClick={onProcess}
        disabled={disabled || isProcessing}
        className="min-w-[180px]"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Memproses...
          </>
        ) : (
          'Proses Penggajian'
        )}
      </Button>

      {isProcessing && totalCount > 0 && (
        <span className="text-sm text-ink-mute">
          Memproses... {processedCount}/{totalCount} karyawan
        </span>
      )}
    </div>
  );
}
