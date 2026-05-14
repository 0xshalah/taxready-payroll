# Rencana Implementasi: Tax-Ready Payroll

## Ringkasan

Implementasi aplikasi web Tax-Ready Payroll menggunakan React/TypeScript (frontend) dan Supabase/PostgreSQL (backend). Urutan implementasi: database → autentikasi → modul inti → UI → testing. Seluruh perhitungan payroll dijalankan di client-side. Menggunakan Vitest + fast-check untuk property-based testing.

## Tasks

- [x] 1. Setup database dan skema Supabase
  - [x] 1.1 Buat migrasi SQL untuk tabel `companies` dan `users` beserta RLS policies
    - Buat tabel `companies` dengan field: id, nama_perusahaan, npwp_badan (UNIQUE), alamat, jkk_risk_class (CHECK 1-5), created_at
    - Buat tabel `users` dengan field: id (FK auth.users), company_id (FK companies), email, nama, role (CHECK owner/hr_staff/regular_staff), created_at
    - Aktifkan RLS dan buat policies: companies_select, companies_update (owner only), users_select_same_company, users_insert_owner, users_update_owner
    - _Persyaratan: 7.1, 7.2, 7.3, 9.1_

  - [x] 1.2 Buat migrasi SQL untuk tabel `employees` dengan enkripsi pgcrypto
    - Aktifkan extension pgcrypto
    - Buat tabel `employees` dengan kolom terenkripsi: nik_encrypted (BYTEA), gaji_pokok_encrypted (BYTEA)
    - Tambahkan CHECK constraints: nama_lengkap ≤ 150 char, jabatan ≤ 100 char, ptkp_status IN valid values, tunjangan_tetap ≥ 0
    - Buat fungsi `encrypt_value` dan `decrypt_value` menggunakan pgp_sym_encrypt/decrypt (SECURITY DEFINER)
    - Aktifkan RLS: employees_select (same company), employees_insert/update (owner + hr_staff), employees_delete (owner only)
    - _Persyaratan: 1.5, 7.2, 8.1, 8.3, 9.2, 9.3_

  - [x] 1.3 Buat migrasi SQL untuk tabel `ter_rates` dan `bpjs_config`
    - Buat tabel `ter_rates` dengan field: id, company_id, category (A/B/C), lower_bound, upper_bound, rate_percent, CONSTRAINT valid_range
    - Buat tabel `bpjs_config` dengan seluruh tarif default (JHT, JP, JKM, JKK, JKP, Kesehatan), ceiling, dan periode diskon JKK
    - Aktifkan RLS: ter_rates_select (same company), ter_rates_manage_owner (owner only), bpjs_config_select, bpjs_config_update_owner
    - _Persyaratan: 2.8, 3.5, 3.7_

  - [x] 1.4 Buat migrasi SQL untuk tabel `payroll_periods` dan `payroll_records`
    - Buat tabel `payroll_periods` dengan UNIQUE constraint (company_id, month, year) dan status (processed/overwritten)
    - Buat tabel `payroll_records` dengan seluruh kolom komponen gaji (bruto, PPh21, BPJS per komponen, net_pay, status)
    - Aktifkan RLS: select (same company), insert (owner + hr_staff)
    - _Persyaratan: 4.1, 4.2, 11.2_

  - [x] 1.5 Buat migrasi SQL untuk tabel `audit_logs` (immutable)
    - Buat tabel `audit_logs` dengan field: id, company_id, user_id, user_role, action_type (CHECK valid types), entity_type, entity_id, changes (JSONB), ip_address (INET), created_at
    - Aktifkan RLS: audit_logs_select_owner (owner only), audit_logs_insert (same company)
    - REVOKE UPDATE dan DELETE dari authenticated dan service_role
    - _Persyaratan: 10.1, 10.2, 10.3_

- [x] 2. Setup proyek frontend dan konfigurasi dasar
  - [x] 2.1 Inisialisasi proyek React + TypeScript dengan Vite
    - Setup Vite + React + TypeScript
    - Install dependencies: @supabase/supabase-js, @tanstack/react-query, react-router-dom, zod, @react-pdf/renderer
    - Konfigurasi Vitest + fast-check untuk testing
    - Buat folder structure sesuai desain (src/app, src/components, src/features, src/lib, src/types, src/utils)
    - _Persyaratan: 12.1_

  - [x] 2.2 Buat type definitions dan constants
    - Buat `src/types/employee.ts`: interface Employee, EmployeeFormData, PTKPStatus type
    - Buat `src/types/payroll.ts`: interface TERRate, PPh21Input, PPh21Result, BPJSConfig, BPJSInput, BPJSResult, PayrollBatchInput, PayrollBatchResult, PayrollEmployeeResult
    - Buat `src/types/auth.ts`: interface User, UserRole type, Permission type
    - Buat `src/lib/constants.ts`: PTKP_TO_TER_CATEGORY mapping, PTKP_VALUES array, default BPJS rates
    - _Persyaratan: 2.2, 2.3, 9.1_

  - [x] 2.3 Konfigurasi Supabase client dan environment
    - Buat `src/lib/supabase.ts` dengan inisialisasi Supabase client
    - Setup environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
    - Buat `src/lib/encryption.ts` untuk helper masking NIK di client-side
    - _Persyaratan: 7.1, 8.2, 8.7_

- [x] 3. Implementasi autentikasi dan RBAC
  - [x] 3.1 Implementasi modul autentikasi (login, register, session)
    - Buat `src/features/auth/hooks/useAuth.ts`: login, logout, register company, get current user + role
    - Implementasi flow register: buat company → buat user dengan role 'owner' → auto-create bpjs_config default
    - Implementasi flow login: Supabase Auth signInWithPassword → fetch user role dari tabel users
    - _Persyaratan: 9.1, 7.4_

  - [x] 3.2 Implementasi RBAC guard dan permission checking
    - Buat `src/components/layout/ProtectedRoute.tsx`: cek autentikasi dan role sebelum render halaman
    - Buat fungsi `checkPermission(role, resource, action)` sesuai matriks RBAC
    - Implementasi pencatatan unauthorized access ke audit_logs
    - _Persyaratan: 9.2, 9.3, 9.4, 9.5_

  - [ ]* 3.3 Tulis property test untuk RBAC permission matrix
    - **Property 15: RBAC permission matrix konsisten dengan definisi peran**
    - **Validates: Persyaratan 9.2, 9.3, 9.4**

  - [ ]* 3.4 Tulis property test untuk invariant minimal satu Owner
    - **Property 16: Invariant minimal satu Owner per perusahaan**
    - **Validates: Persyaratan 9.7**

- [x] 4. Implementasi modul manajemen karyawan
  - [x] 4.1 Buat validasi data karyawan (Zod schema + NIK validator)
    - Buat `src/features/employees/validators/employeeSchema.ts` dengan Zod schema
    - Implementasi validasi NIK: tepat 16 digit, hanya angka, unik per company
    - Validasi field wajib: nama_lengkap (≤150 char), ptkp_status (enum), tanggal_bergabung, jabatan (≤100 char), gaji_pokok (Rp100.000 - Rp999.999.999)
    - _Persyaratan: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 4.2 Tulis property test untuk validasi NIK
    - **Property 1: Validasi NIK menerima hanya 16 digit angka**
    - **Validates: Persyaratan 1.1, 1.2, 1.3**

  - [ ]* 4.3 Tulis property test untuk validasi field wajib karyawan
    - **Property 2: Validasi field wajib karyawan mendeteksi semua field kosong**
    - **Validates: Persyaratan 1.5, 1.6**

  - [x] 4.4 Implementasi CRUD karyawan dengan enkripsi
    - Buat `src/features/employees/hooks/useEmployees.ts`: fetch list, create, update, delete (dengan TanStack Query)
    - Implementasi enkripsi NIK dan gaji_pokok saat simpan (via Supabase RPC encrypt_value)
    - Implementasi dekripsi saat baca (via Supabase RPC decrypt_value)
    - Implementasi masking NIK untuk role Regular Staff (tampilkan hanya 4 digit terakhir)
    - _Persyaratan: 1.5, 8.1, 8.5, 8.7_

  - [ ]* 4.5 Tulis property test untuk enkripsi-dekripsi round-trip
    - **Property 13: Enkripsi-dekripsi round-trip mempertahankan data asli**
    - **Validates: Persyaratan 8.1**

  - [ ]* 4.6 Tulis property test untuk masking NIK
    - **Property 14: Masking NIK hanya menampilkan 4 digit terakhir**
    - **Validates: Persyaratan 8.7**

- [x] 5. Checkpoint - Pastikan semua test lulus
  - Pastikan semua test lulus, tanyakan ke user jika ada pertanyaan.

- [ ] 6. Implementasi engine perhitungan payroll
  - [~] 6.1 Implementasi kalkulator PPh 21 TER
    - Buat `src/features/payroll/engine/pph21Calculator.ts`
    - Implementasi `calculateGrossIncome(gajiPokok, tunjanganTetap, uangLembur)`: validasi ≥ 0, return sum
    - Implementasi `calculatePPh21(input, terRates)`: mapping PTKP → kategori TER, lookup rate, hitung floor(bruto × rate%)
    - Handle edge case: bruto = 0 → return PPh21 = 0 tanpa lookup
    - _Persyaratan: 2.1, 2.2, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 6.2 Tulis property test untuk pemetaan PTKP ke kategori TER
    - **Property 4: Pemetaan PTKP ke kategori TER selalu konsisten**
    - **Validates: Persyaratan 2.2**

  - [ ]* 6.3 Tulis property test untuk perhitungan penghasilan bruto
    - **Property 5: Perhitungan penghasilan bruto adalah penjumlahan komponen**
    - **Validates: Persyaratan 2.4**

  - [ ]* 6.4 Tulis property test untuk formula PPh 21
    - **Property 6: PPh 21 = floor(Bruto × Persentase TER)**
    - **Validates: Persyaratan 2.1, 2.5**

  - [~] 6.5 Implementasi kalkulator BPJS
    - Buat `src/features/payroll/engine/bpjsCalculator.ts`
    - Implementasi `calculateBPJS(input, config)`: hitung Kesehatan (dengan ceiling), JHT (tanpa ceiling), JP (dengan ceiling), JKM, JKK (dengan diskon 50%), JKP
    - Implementasi `isWithinDiscountPeriod(period, config)`: cek apakah periode dalam rentang diskon JKK (Jan-Jun 2026)
    - Semua hasil dibulatkan dengan Math.round
    - _Persyaratan: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 6.6 Tulis property test untuk kalkulator BPJS
    - **Property 7: Perhitungan BPJS menerapkan ceiling dan diskon dengan benar**
    - **Validates: Persyaratan 3.1, 3.2, 3.3, 3.4**

  - [~] 6.7 Implementasi kalkulator gaji bersih dan batch processor
    - Buat `src/features/payroll/engine/netPayCalculator.ts`: formula net_pay = bruto - PPh21 - BPJS karyawan
    - Buat `src/features/payroll/engine/batchProcessor.ts`: orchestrator yang memproses max 50 karyawan
    - Implementasi validasi pra-batch: cek NIK, PTKP, gaji_pokok untuk semua karyawan aktif
    - Implementasi fault tolerance: kegagalan satu karyawan tidak menghentikan batch
    - Implementasi deteksi gaji negatif → status 'warning'
    - Implementasi ringkasan: success_count, failed_count, total_net_pay
    - _Persyaratan: 4.1, 4.3, 4.4, 4.5, 4.6, 4.7, 11.3_

  - [ ]* 6.8 Tulis property test untuk formula gaji bersih
    - **Property 8: Formula gaji bersih = Bruto - PPh21 - BPJS karyawan**
    - **Validates: Persyaratan 4.1**

  - [ ]* 6.9 Tulis property test untuk deteksi gaji negatif
    - **Property 9: Gaji bersih negatif menghasilkan status warning**
    - **Validates: Persyaratan 4.4**

  - [ ]* 6.10 Tulis property test untuk fault tolerance batch processing
    - **Property 10: Batch processing fault tolerance — kegagalan parsial tidak menghentikan batch**
    - **Validates: Persyaratan 4.6, 4.7**

- [~] 7. Checkpoint - Pastikan engine perhitungan berfungsi
  - Pastikan semua test lulus, tanyakan ke user jika ada pertanyaan.

- [ ] 8. Implementasi modul ekspor
  - [~] 8.1 Implementasi generator CSV/XML untuk Coretax
    - Buat `src/features/export/generators/csvGenerator.ts`: generate CSV dengan field wajib Coretax (NIK, Nama, Bruto, PPh21)
    - Buat `src/features/export/generators/xmlGenerator.ts`: generate XML dengan struktur Coretax
    - Implementasi validasi pra-ekspor: cek kelengkapan data sebelum generate
    - Implementasi penamaan file: [NamaPerusahaan]_[YYYY]_[MM].[csv/xml]
    - _Persyaratan: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 8.2 Tulis property test untuk field wajib ekspor Coretax
    - **Property 11: Ekspor Coretax mengandung semua field wajib**
    - **Validates: Persyaratan 5.1, 5.2**

  - [ ]* 8.3 Tulis property test untuk penamaan file ekspor
    - **Property 12: Penamaan file ekspor mengikuti konvensi**
    - **Validates: Persyaratan 5.4**

  - [~] 8.4 Implementasi generator PDF BPA1
    - Buat `src/features/export/generators/pdfBPA1Generator.ts` menggunakan @react-pdf/renderer
    - Implementasi template BPA1 dengan field wajib: Nama, NIK, Status PTKP, Masa Pajak, Bruto, PPh21, Nama Pemotong, NPWP Pemotong
    - Implementasi download individual per karyawan dan bulk download (ZIP)
    - Implementasi penamaan file: [NamaKaryawan]_BPA1_[YYYY]_[MM].pdf
    - _Persyaratan: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 9. Implementasi modul pengaturan dan audit trail
  - [~] 9.1 Implementasi halaman pengaturan tarif (TER dan BPJS)
    - Buat hook `useSettings.ts`: fetch dan update ter_rates, bpjs_config
    - Implementasi validasi: tarif 0-100%, batas atas upah > 0, JKK 0.24-1.74%
    - Implementasi pencatatan audit saat perubahan pengaturan
    - _Persyaratan: 2.8, 3.5, 3.7_

  - [~] 9.2 Implementasi modul audit trail
    - Buat `src/features/audit/hooks/useAuditLogs.ts`: fetch logs dengan filter (tanggal, aksi, user_id)
    - Buat helper `logAuditEntry`: catat audit dengan timestamp ISO 8601, user_id, role, action_type, changes (JSONB), IP
    - Implementasi pencatatan otomatis untuk: payroll_process, employee CRUD, salary_change, export_document, settings_change, role_change, unauthorized_access
    - _Persyaratan: 10.1, 10.2, 10.5, 10.6, 10.7_

  - [ ]* 9.3 Tulis property test untuk audit log entry
    - **Property 17: Audit log entry mengandung semua field wajib**
    - **Validates: Persyaratan 10.1, 10.2**

  - [ ]* 9.4 Tulis property test untuk validasi batch pra-penggajian
    - **Property 3: Validasi batch pra-penggajian mendeteksi semua karyawan bermasalah**
    - **Validates: Persyaratan 1.7, 1.8, 11.3, 11.4**

  - [ ]* 9.5 Tulis property test untuk deteksi periode duplikat
    - **Property 18: Deteksi periode penggajian duplikat**
    - **Validates: Persyaratan 11.2**

- [~] 10. Checkpoint - Pastikan modul backend lengkap
  - Pastikan semua test lulus, tanyakan ke user jika ada pertanyaan.

- [ ] 11. Implementasi halaman UI — Autentikasi dan Layout
  - [~] 11.1 Buat komponen layout utama (Sidebar, Header, ProtectedRoute)
    - Buat `src/components/layout/Sidebar.tsx`: navigasi dengan menu sesuai role (Owner/HR Staff/Regular Staff)
    - Buat `src/components/layout/Header.tsx`: top bar dengan nama perusahaan, avatar, role badge
    - Buat `src/components/ui/` primitives: Button, Input, Modal, Table, LoadingSpinner, ConfirmDialog
    - Implementasi responsive: sidebar collapse di tablet, hidden di mobile
    - _Persyaratan: 9.2, 9.3, 9.4_

  - [~] 11.2 Buat halaman Login dan Register Company
    - Buat `src/features/auth/pages/LoginPage.tsx`: form email + password, validasi, error handling
    - Buat `src/features/auth/pages/RegisterCompanyPage.tsx`: form nama perusahaan, NPWP badan, email, password
    - Implementasi redirect setelah login berdasarkan role
    - _Persyaratan: 9.1_

- [ ] 12. Implementasi halaman UI — Modul Karyawan
  - [~] 12.1 Buat halaman daftar karyawan dan form input
    - Buat `src/features/employees/pages/EmployeeListPage.tsx`: tabel karyawan dengan kolom NIK (masked untuk Regular Staff), nama, jabatan, status
    - Buat `src/features/employees/pages/EmployeeFormPage.tsx`: form create/edit dengan validasi real-time
    - Buat `src/features/employees/components/NIKValidationInput.tsx`: input khusus NIK dengan validasi 16 digit inline
    - Buat `src/features/employees/components/EmployeeTable.tsx`: tabel dengan sorting, search, dan aksi (edit/delete)
    - Implementasi pencatatan audit untuk setiap operasi CRUD karyawan
    - _Persyaratan: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 8.7_

- [ ] 13. Implementasi halaman UI — Modul Penggajian
  - [~] 13.1 Buat halaman proses penggajian
    - Buat `src/features/payroll/pages/PayrollProcessPage.tsx`: pilih periode → validasi data → proses → tampilkan hasil
    - Buat `src/features/payroll/components/PayrollBatchRunner.tsx`: tombol "Proses Penggajian" dengan progress indicator
    - Buat `src/features/payroll/components/PayrollResultTable.tsx`: tabel hasil per karyawan (bruto, potongan, net pay, status)
    - Buat `src/features/payroll/components/PayrollSummary.tsx`: ringkasan total (jumlah karyawan, total bruto, total PPh21, total BPJS, total net pay)
    - Implementasi deteksi periode duplikat dengan konfirmasi overwrite
    - Implementasi progress indicator dan lock saat proses berjalan
    - _Persyaratan: 4.1, 4.2, 4.3, 4.6, 4.7, 11.1, 11.2, 11.5, 11.6_

  - [~] 13.2 Buat halaman riwayat penggajian
    - Buat `src/features/payroll/pages/PayrollHistoryPage.tsx`: daftar periode yang sudah diproses
    - Implementasi detail view: klik periode → tampilkan hasil perhitungan per karyawan
    - _Persyaratan: 11.5_

- [ ] 14. Implementasi halaman UI — Modul Ekspor dan Pengaturan
  - [~] 14.1 Buat halaman ekspor dokumen
    - Buat `src/features/export/pages/ExportPage.tsx`: pilih periode, pilih format (CSV/XML/PDF BPA1)
    - Buat `src/features/export/components/ExportFormatSelector.tsx`: radio button format + tombol download
    - Buat `src/features/export/components/BPA1Generator.tsx`: generate PDF per karyawan atau bulk ZIP
    - Implementasi validasi pra-ekspor dan tampilan error jika data tidak lengkap
    - _Persyaratan: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [~] 14.2 Buat halaman pengaturan tarif dan manajemen user
    - Buat `src/features/settings/pages/SettingsPage.tsx`: tab TER Rates, BPJS Config, User Management
    - Buat `src/features/settings/components/TERRateTable.tsx`: tabel editable tarif TER per kategori
    - Buat `src/features/settings/components/BPJSRateForm.tsx`: form edit tarif BPJS, ceiling, periode diskon
    - Buat `src/features/settings/components/UserRoleManager.tsx`: daftar user + ubah role (Owner only)
    - Implementasi validasi: tidak boleh menurunkan Owner terakhir
    - _Persyaratan: 2.8, 3.5, 3.7, 9.6, 9.7_

  - [~] 14.3 Buat halaman audit trail
    - Buat `src/features/audit/pages/AuditTrailPage.tsx`: tabel log dengan filter tanggal, jenis aksi, user
    - Buat `src/features/audit/components/AuditLogTable.tsx`: tampilkan timestamp, user, aksi, detail perubahan
    - Buat `src/features/audit/components/AuditFilter.tsx`: filter rentang tanggal, dropdown aksi, dropdown user
    - _Persyaratan: 10.6_

  - [~] 14.4 Buat halaman profil dan slip gaji (Regular Staff)
    - Buat halaman `/profile`: tampilkan data profil sendiri (nama, jabatan, tanggal bergabung)
    - Buat halaman `/my-payslips`: daftar slip gaji per periode dengan detail perhitungan
    - _Persyaratan: 9.4, 12.3_

- [ ] 15. Implementasi Dashboard
  - [~] 15.1 Buat halaman dashboard utama
    - Buat `src/features/dashboard/pages/DashboardPage.tsx`: ringkasan payroll terakhir, jumlah karyawan aktif
    - Buat `src/features/dashboard/components/PayrollSummaryCard.tsx`: card metrik (total karyawan, total gaji bulan ini)
    - Buat `src/features/dashboard/components/RecentActivityList.tsx`: 5 aktivitas terakhir dari audit log
    - _Persyaratan: 11.5_

- [ ] 16. Wiring dan integrasi seluruh modul
  - [~] 16.1 Setup routing dan integrasi seluruh halaman
    - Buat `src/app/routes.tsx`: definisi semua route dengan ProtectedRoute guard sesuai role
    - Buat `src/app/App.tsx`: root component dengan React Router, TanStack QueryProvider, AuthProvider
    - Pastikan navigasi antar halaman berfungsi dan RBAC diterapkan di setiap route
    - Integrasikan pencatatan audit trail di seluruh operasi (CRUD karyawan, payroll, ekspor, settings)
    - _Persyaratan: 9.2, 9.3, 9.4, 9.5, 10.1_

- [~] 17. Checkpoint final - Pastikan semua test lulus
  - Pastikan semua test lulus, tanyakan ke user jika ada pertanyaan.

## Catatan

- Task yang ditandai `*` bersifat opsional dan dapat dilewati untuk MVP lebih cepat
- Setiap task mereferensikan persyaratan spesifik untuk traceability
- Checkpoint memastikan validasi inkremental di setiap fase
- Property tests memvalidasi properti kebenaran universal dari dokumen desain
- Unit tests memvalidasi contoh spesifik dan edge cases
- Seluruh perhitungan payroll berjalan di client-side (browser) untuk menghindari biaya Edge Functions
- Format mata uang: selalu gunakan prefix `Rp` dengan pemisah ribuan (Rp 10.000.000)
- Format tanggal tampilan: DD MMM YYYY; format data: YYYY-MM-DD

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.2"] },
    { "id": 2, "tasks": ["1.4", "1.5", "2.3"] },
    { "id": 3, "tasks": ["3.1", "4.1"] },
    { "id": 4, "tasks": ["3.2", "4.4", "3.3", "3.4", "4.2", "4.3"] },
    { "id": 5, "tasks": ["4.5", "4.6", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.4", "6.5"] },
    { "id": 7, "tasks": ["6.6", "6.7"] },
    { "id": 8, "tasks": ["6.8", "6.9", "6.10", "8.1"] },
    { "id": 9, "tasks": ["8.2", "8.3", "8.4", "9.1"] },
    { "id": 10, "tasks": ["9.2", "9.3", "9.4", "9.5"] },
    { "id": 11, "tasks": ["11.1", "11.2"] },
    { "id": 12, "tasks": ["12.1", "13.1"] },
    { "id": 13, "tasks": ["13.2", "14.1", "14.2"] },
    { "id": 14, "tasks": ["14.3", "14.4", "15.1"] },
    { "id": 15, "tasks": ["16.1"] }
  ]
}
```
