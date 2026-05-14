/**
 * Footer — Disclaimer hukum di bagian bawah dashboard
 * Menampilkan disclaimer bahwa perhitungan bersifat estimasi dan
 * pengguna tetap bertanggung jawab atas kepatuhan pajak.
 *
 * Validates: Fitur Transparansi #2
 */

export const LEGAL_DISCLAIMER = `Perhitungan pajak dan BPJS yang dihasilkan oleh Tax-Ready Payroll bersifat estimasi berdasarkan data yang diinput pengguna dan konfigurasi tarif yang berlaku. Hasil perhitungan ini BUKAN merupakan nasihat pajak profesional. Pengguna tetap bertanggung jawab penuh atas kebenaran data, kepatuhan pelaporan, dan pembayaran pajak sesuai ketentuan perundang-undangan yang berlaku. Konsultasikan dengan konsultan pajak berlisensi untuk kepastian hukum.`;

export const LEGAL_DISCLAIMER_SHORT = `Hasil perhitungan bersifat estimasi. Bukan nasihat pajak profesional. Pengguna bertanggung jawab atas kepatuhan pelaporan pajak.`;

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-canvas-card/50 px-4 py-4 md:px-6 backdrop-blur-sm">
      <div className="max-w-5xl">
        <p className="text-[11px] leading-relaxed text-ink-mute">
          <span className="font-medium text-ink-mute">Disclaimer:</span>{' '}
          {LEGAL_DISCLAIMER}
        </p>
        <p className="text-[11px] text-ink-faint mt-2">
          Dasar hukum: PP 58/2023, PMK 168/2023, UU HPP No. 7/2021, UU PDP No. 27/2022.
        </p>
      </div>
    </footer>
  );
}
