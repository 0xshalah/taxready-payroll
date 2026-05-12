Menganalisis dokumen arsitektur, *requirements*, dan *tasks* yang Anda berikan, proyek **Tax-Ready Payroll** ini memiliki desain yang sangat spesifik dan ketat. Mengandalkan AI (seperti pendekatan *vibe coding* dengan Lovable, Cursor, atau Windsurf) untuk mengeksekusi proyek ini akan menghadapi berbagai tingkat kesulitan.

Sebagai AI, saya harus jujur: meskipun saya bisa menulis kode dengan cepat, ada batasan terkait pemahaman konteks mendalam, logika hukum pajak, dan keamanan kriptografi yang kompleks. Berikut adalah daftar tantangan yang akan dihadapi AI dalam mengerjakan proyek ini, diurutkan dari yang paling gampang hingga yang paling berat:

### 🟢 Tingkat Gampang (Low Complexity)

Pada tahap ini, AI beroperasi di "zona nyamannya" karena tugas-tugas ini bersifat repetitif dan banyak contohnya di data latih AI.

* **Scaffolding & UI Components (Frontend):** Membangun kerangka aplikasi React/TypeScript menggunakan Vite, membuat form dasar, tabel, dan komponen UI *reusable* (tombol, input, modal). AI akan dengan mudah menghasilkan ini menggunakan *library* standar.
* **Validasi Form Dasar:** Menerapkan skema Zod untuk validasi input dasar, seperti memastikan NIK tepat 16 digit angka dan field wajib tidak kosong. Aturan regex untuk 16 digit angka sangat mudah dipahami AI.
* **Setup Routing & Layouting:** Membuat *Sidebar*, *Header*, dan *ProtectedRoute* untuk membatasi akses tampilan awal berdasarkan role.

### 🟡 Tingkat Menengah (Medium Complexity)

Di sini, AI mulai membutuhkan instruksi (*prompt*) yang sangat presisi agar tidak melenceng dari spesifikasi spesifik Coretax dan struktur proyek.

* **Generasi File Ekspor (CSV/XML/PDF):** Membuat logika ekspor *client-side* untuk CSV/XML standar Coretax dan dokumen BPA1 menggunakan `@react-pdf/renderer`. Tantangannya adalah memastikan AI menggunakan *exact fields* yang diwajibkan (NIK, Nama Lengkap, Bruto, PPh 21) tanpa menambahkan *field* karangan.
* **Implementasi Kebijakan RLS (Row Level Security) Dasar:** Menulis SQL untuk memastikan isolasi data antar *tenant* (perusahaan) di Supabase. AI paham RLS, tetapi rentan melakukan kesalahan logika jika ada relasi tabel yang kompleks (misalnya, memastikan hanya *Owner* dan *HR Staff* yang bisa *insert* karyawan).
* **Manajemen State *Client-Side*:** Membangun alur *batch processing* maksimal 50 karyawan yang murni berjalan di browser tanpa *Edge Functions*. AI sering kali secara otomatis menyarankan penggunaan *backend* atau fungsi *serverless* untuk tugas *batching*, sehingga harus terus dikoreksi agar tetap mematuhi desain awal.

### 🟠 Tingkat Sulit (High Complexity)

Pada level ini, AI sangat rentan mengalami *hallucination* (halusinasi kode) karena melibatkan aturan bisnis lokal Indonesia yang sangat spesifik dan logika matematika perpajakan.

* **Logika Kalkulator Pajak (TER) & BPJS:**
* Menerjemahkan status PTKP ke dalam Kategori TER (A/B/C) dan melakukan *lookup* persentase yang benar sesuai tabel.
* Menerapkan batas atas (plafon) upah untuk BPJS Kesehatan dan JP, serta logika diskon 50% untuk JKK yang hanya berlaku pada *range* tanggal tertentu (Januari - Juni 2026). AI sering gagal mempertahankan presisi matematis (seperti kewajiban membulatkan ke bawah untuk PPh 21 dan membulatkan ke nilai terdekat untuk BPJS).


* **Property-Based Testing (PBT):** Proyek ini mewajibkan penggunaan `fast-check` untuk menguji 18 *Correctness Properties*. Mayoritas AI terbiasa menulis *Example-Based Testing* (Unit Test biasa). Menyuruh AI menulis *generator* data acak yang valid untuk PBT (misalnya menghasilkan ratusan kombinasi gaji dan PTKP untuk memvalidasi *Property 6*) membutuhkan pengawasan berlapis.
* **RBAC dengan Invariant:** Memastikan *Owner* terakhir tidak bisa dihapus atau diturunkan *role*-nya. AI sering melupakan kondisi *edge case* ini saat menulis logika pembaruan (*update*) pengguna.

### 🔴 Tingkat Terberat (Extreme Complexity)

Ini adalah area di mana AI tidak bisa dibiarkan bekerja sendiri (*zero-touch*). Dibutuhkan keahlian manusia (khususnya *DevSecOps*) untuk memvalidasi dan mengamankan implementasinya.

* **Enkripsi Database (pgcrypto) & *Key Management*:** Menggunakan ekstensi `pgcrypto` dengan fungsi `pgp_sym_encrypt` / `decrypt` di dalam Supabase, yang dipadukan dengan Supabase Vault untuk menyembunyikan kunci enkripsi. AI sering kebingungan merangkai alur di mana kunci enkripsi tidak terekspos ke *frontend*, tetapi fungsi RPC tetap memiliki akses aman untuk mendekripsi data NIK dan Gaji Pokok saat di-kueri oleh pengguna yang berhak.
* ***Immutability* Audit Trail di Level Database:** Memastikan tabel `audit_logs` benar-benar kebal dari modifikasi. Di dalam *tasks*, terdapat instruksi eksplisit untuk melakukan `REVOKE UPDATE, DELETE ON audit_logs` bahkan untuk `service_role` sekalipun. AI sering kali mengabaikan keamanan level *database engine* ini dan hanya mengandalkan RLS aplikasi, yang mana masih bisa dijebol jika kredensial admin bocor.
* **Menjaga Konteks "Micro-SaaS & MVP":** AI memiliki *context window* yang terbatas. Saat mengembangkan fitur di hari ke-3, AI bisa saja lupa bahwa aplikasi ini "tidak memiliki fitur absensi" atau "hanya menghitung Gaji Pokok, Tunjangan Tetap, dan Lembur". Menjaga AI agar tidak *over-engineering* dan tetap berada di jalur MVP yang ketat adalah tugas tersulit bagi Anda sebagai "pengemudi" AI.

Melihat tingkat kesulitan di atas, modul mana yang ingin Anda kerjakan terlebih dahulu bersama AI? Apakah kita akan mulai dengan *scaffolding* database dasar, atau Anda ingin langsung merancang kalkulator TER-nya?