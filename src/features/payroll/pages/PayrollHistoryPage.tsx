/**
 * PayrollHistoryPage — Daftar periode penggajian yang sudah diproses
 * Menampilkan cards per periode. Klik untuk lihat detail (placeholder).
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

/** Nama bulan dalam Bahasa Indonesia */
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

interface ProcessedPeriod {
  month: number;
  year: number;
}

export function PayrollHistoryPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<ProcessedPeriod | null>(null);

  // Placeholder data — in production this would come from a hook/API
  const processedPeriods: ProcessedPeriod[] = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink tracking-tight">Riwayat Penggajian</h1>
        <p className="text-sm text-ink-mute mt-1">
          Daftar periode penggajian yang sudah diproses.
        </p>
      </div>

      {/* Detail view */}
      {selectedPeriod && (
        <Card className="border-l-4 border-l-[#3ecf8e]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink">
                Detail untuk periode {MONTH_NAMES[selectedPeriod.month - 1]} {selectedPeriod.year}
              </p>
              <button
                onClick={() => setSelectedPeriod(null)}
                className="text-xs text-ink-mute hover:text-ink"
              >
                Tutup
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Period cards */}
      {processedPeriods.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-ink-mute text-center">
              Belum ada riwayat penggajian. Proses penggajian pertama Anda di halaman Proses Penggajian.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedPeriods.map((period) => (
            <Card
              key={`${period.year}-${period.month}`}
              className="cursor-pointer hover:bg-canvas-soft transition-colors"
              onClick={() => setSelectedPeriod(period)}
            >
              <CardHeader>
                <CardTitle className="text-base">
                  {MONTH_NAMES[period.month - 1]} {period.year}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-ink-mute">Klik untuk lihat detail</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
