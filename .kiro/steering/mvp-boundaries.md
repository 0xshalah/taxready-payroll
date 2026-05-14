---
inclusion: auto
---
# MVP Boundaries — Tax-Ready Payroll

## JANGAN Implementasi (Out of Scope)
- ❌ Integrasi API langsung ke Coretax DJP
- ❌ Transfer bank otomatis (disbursement)
- ❌ Absensi / clock-in / clock-out / cuti
- ❌ Employee Self Service portal
- ❌ Bonus, THR, atau komponen variabel
- ❌ Edge Functions atau serverless backend untuk kalkulasi
- ❌ Multi-payrun per bulan

## Komponen Penghasilan HANYA
- ✅ Gaji Pokok
- ✅ Tunjangan Tetap
- ✅ Uang Lembur (input manual per karyawan per bulan)

## Batasan Teknis
- Maksimal 50 karyawan aktif per perusahaan
- Penggajian 1x per bulan
- Semua kalkulasi di client-side (browser)
- 1 akun = 1 perusahaan (1 NPWP Badan)

## Pemetaan PTKP → Kategori TER (PP 58/2023)
- Kategori A: TK/0, TK/1, K/0
- Kategori B: TK/2, TK/3, K/1, K/2
- Kategori C: K/3

## Aturan Pembulatan
- PPh 21: `Math.floor()` (bulatkan ke bawah ke Rupiah penuh)
- BPJS: `Math.round()` (bulatkan ke Rupiah terdekat)
