# PRODUCT REQUIREMENTS DOCUMENT (PRD)
**Nama Produk:** Tax-Ready Payroll (Nama sementara)
**Fase:** Minimum Viable Product (MVP)
**Target Pengguna:** UMKM Lokal di Indonesia (Klinik, Apotek, Distributor, dll.) dengan jumlah karyawan 10-50 orang.
**Platform:** Aplikasi Web (*Micro-SaaS*)

### 1. Visi & Tujuan Produk
Membangun aplikasi penggajian ringan yang tidak hanya menghitung gaji pokok dan lembur secara otomatis, tetapi juga menjamin **100% kompatibilitas dengan sistem Coretax DJP**. Tujuannya adalah membebaskan pemilik UMKM dari rasa takut akan denda pajak akibat *human error* pada perhitungan manual (Excel) serta melindungi data pribadi karyawan sesuai standar hukum.

### 2. Masalah yang Diselesaikan
*   **Perubahan Sistem Pelaporan:** DJP Online lama telah digantikan oleh Coretax pada 2026, yang mengharuskan penggunaan struktur data baru dan validasi *real-time*.
*   **Aturan Pajak yang Rumit:** UMKM kesulitan mengikuti skema perhitungan Tarif Efektif Rata-Rata (TER) untuk PPh 21 dan penyesuaian plafon BPJS terbaru.
*   **Format Dokumen Baru:** Formulir bukti potong 1721-A1 lama sudah usang dan diganti dengan format baru **BPA1** (untuk pegawai swasta), yang strukturnya wajib sesuai dengan Coretax.
*   **Ancaman Sanksi UU PDP:** Karyawan UMKM rentan mengalami kebocoran Nomor Induk Kependudukan (NIK) akibat sistem HR lawas, yang kini diancam denda hingga miliaran rupiah oleh UU Perlindungan Data Pribadi (PDP).

### 3. Fitur Utama MVP (Core Features)
Karena ini MVP, kita hanya membangun fitur yang **wajib ada** untuk menyelesaikan masalah utama klien:

*   **Pusat Data Karyawan (Coretax-Synced):**
    *   Input data karyawan dengan fokus pada validasi **NIK 16 digit** sebagai NPWP baru. 
    *   Jika ada perbedaan data (NIK/NPWP tidak sinkron), sistem otomatis memberi peringatan sebelum penggajian diproses agar SPT tidak tertolak.
*   **Kalkulator Payroll Otomatis (TER & BPJS):**
    *   Menghitung gaji kotor hingga bersih (*take-home pay*).
    *   Otomatisasi pemotongan PPh 21 menggunakan **skema TER terbaru** berdasarkan status tanggungan (PTKP).
    *   Kalkulasi otomatis potongan BPJS Kesehatan dan Ketenagakerjaan sesuai tarif dan plafon 2026.
*   **Ekspor Dokumen Siap Coretax:**
    *   Pembuatan laporan akhir bulan (CSV/XML) dengan *format* standar Coretax yang bisa langsung diunggah (*upload*) klien ke portal DJP.
    *   *Generate* otomatis format bukti potong **BPA1** untuk diberikan ke karyawan.

### 4. Aspek Keamanan & DevSecOps (Keunggulan Kompetitifmu)
Sebagai mahasiswa Keamanan Siber, jadikan ini sebagai "nilai jual" utamamu kepada calon klien:
*   **Enkripsi Data (At-Rest & In-Transit):** Data gaji dan NIK karyawan dilindungi dengan enkripsi berstandar ISO/IEC 27001 (seperti AES-256) untuk memenuhi kepatuhan UU PDP.
*   **Role-Based Access Control (RBAC):** Akses terpisah antara staf biasa, staf HR, dan *owner* (pemilik bisnis).
*   **Jejak Audit (Audit Trail):** Semua aktivitas perhitungan, perubahan gaji, dan persetujuan dicatat (*logged*) sebagai bukti sah jika UMKM diaudit oleh DJP.

### 5. Arsitektur "Vibe Coding" & Tech Stack
Kamu bisa membangun ini dengan modal **Rp 0** menggunakan strategi *vibe coding*:
*   **Frontend (Desain & UI):** Menggunakan **Lovable** untuk merancang halaman aplikasi berbasis *React/TypeScript* hanya dengan mengetik instruksi teks (*prompt*).
*   **Backend & Database:** **Supabase** (basis data PostgreSQL *open-source*) terintegrasi dengan Lovable untuk menyimpan data absensi, penggajian, serta mengelola autentikasi pengguna secara aman.
*   **Refactoring & Security Tweaks:** Setelah kode dasar selesai, kamu bisa memindahkannya ke *AI IDE* seperti **Cursor** atau **Windsurf** untuk menanamkan pemindaian keamanan (*DevSecOps*) dan membersihkan celah kerentanan kode (*shift-left security*).

### 6. Metrik Kesuksesan (Bulan 1 - 3)
*   **Produk:** Aplikasi berhasil menghitung PPh 21 dari 1 perusahaan *dummy* tanpa *error* selisih pajak.
*   **Pengguna:** Minimal mendapatkan 2-3 UMKM sebagai "Beta Tester" gratis selama 1-2 bulan.
*   **Waktu Pengerjaan:** MVP selesai dikembangkan melalui Lovable dalam waktu maksimal 2 hingga 4 minggu.