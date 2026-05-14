# Dokumen Persyaratan (Requirements Document)

## Pendahuluan

Tax-Ready Payroll adalah aplikasi web Micro-SaaS untuk penggajian UMKM Indonesia (10-50 karyawan) yang menjamin kompatibilitas penuh dengan sistem Coretax DJP. Aplikasi ini mengotomatisasi perhitungan PPh 21 menggunakan skema TER, kalkulasi BPJS, serta menghasilkan dokumen ekspor siap unggah ke portal Coretax. Sistem dibangun dengan standar keamanan tinggi untuk memenuhi kepatuhan UU PDP.

## Glosarium

- **Sistem**: Aplikasi Tax-Ready Payroll secara keseluruhan
- **Kalkulator_Payroll**: Modul yang menghitung gaji kotor hingga bersih (take-home pay) termasuk potongan pajak dan BPJS
- **Modul_Karyawan**: Modul pengelolaan data karyawan termasuk validasi NIK dan status PTKP
- **Modul_Ekspor**: Modul yang menghasilkan file CSV/XML standar Coretax dan dokumen BPA1 dalam format PDF
- **Modul_Keamanan**: Modul yang menangani enkripsi, RBAC, dan audit trail
- **NIK**: Nomor Induk Kependudukan 16 digit yang berfungsi sebagai NPWP baru dalam sistem Coretax
- **TER**: Tarif Efektif Rata-rata, skema perhitungan PPh 21 berdasarkan kategori A/B/C sesuai status tanggungan
- **PTKP**: Penghasilan Tidak Kena Pajak, status tanggungan karyawan (TK/0, TK/1, TK/2, TK/3, K/0, K/1, K/2, K/3)
- **BPA1**: Bukti Potong A1, format pengganti 1721-A1 untuk pegawai swasta dalam sistem Coretax
- **BPJS_Kesehatan**: Program jaminan kesehatan nasional dengan tarif 5% (4% pemberi kerja, 1% pekerja)
- **BPJS_Ketenagakerjaan**: Program jaminan sosial ketenagakerjaan meliputi JHT, JP, JKM, JKK, dan JKP
- **RLS**: Row Level Security, mekanisme keamanan Supabase untuk isolasi data antar tenant
- **Admin**: Pengguna dengan peran Owner atau staf HR yang menginput dan memproses penggajian
- **Coretax**: Sistem perpajakan digital DJP yang menggantikan DJP Online lama sejak 2026

## Persyaratan

### Persyaratan 1: Validasi Data Karyawan (NIK 16 Digit)

**User Story:** Sebagai Admin, saya ingin menginput data karyawan dengan validasi NIK 16 digit, sehingga data yang tersimpan selalu kompatibel dengan format Coretax DJP.

#### Kriteria Penerimaan

1. WHEN Admin menginput NIK karyawan, THE Modul_Karyawan SHALL memvalidasi bahwa NIK terdiri dari tepat 16 digit angka sebelum data disimpan
2. IF NIK yang diinput kurang dari atau lebih dari 16 digit, THEN THE Modul_Karyawan SHALL menampilkan pesan error yang menunjukkan bahwa NIK harus terdiri dari 16 digit angka, dan mencegah penyimpanan data
3. IF NIK mengandung karakter non-numerik, THEN THE Modul_Karyawan SHALL menampilkan pesan error yang menunjukkan bahwa NIK hanya boleh berisi angka, dan mencegah penyimpanan data
4. IF Admin menginput NIK yang sudah terdaftar pada karyawan lain dalam perusahaan yang sama, THEN THE Modul_Karyawan SHALL menampilkan pesan error yang menunjukkan bahwa NIK tersebut sudah digunakan, dan mencegah penyimpanan data duplikat
5. THE Modul_Karyawan SHALL menyimpan field wajib berikut untuk setiap karyawan: NIK (tepat 16 digit angka), Nama Lengkap (sesuai KTP, maksimal 150 karakter), Status PTKP (salah satu dari: TK/0, TK/1, TK/2, TK/3, K/0, K/1, K/2, K/3), Tanggal Bergabung, Jabatan (maksimal 100 karakter), dan Gaji Pokok (dalam Rupiah, minimal Rp100.000 dan maksimal Rp999.999.999)
6. IF salah satu field wajib tidak diisi saat Admin menyimpan data karyawan, THEN THE Modul_Karyawan SHALL menampilkan pesan error yang menyebutkan field mana yang belum diisi, dan mencegah penyimpanan data
7. WHEN Admin memproses penggajian, THE Modul_Karyawan SHALL memeriksa bahwa seluruh karyawan aktif memiliki NIK valid (tepat 16 digit angka) dan seluruh field wajib terisi sebelum proses dilanjutkan
8. IF terdapat karyawan aktif dengan NIK yang tidak valid atau field wajib yang kosong saat proses penggajian, THEN THE Modul_Karyawan SHALL menampilkan daftar nama karyawan beserta field yang bermasalah, dan mencegah proses penggajian dilanjutkan hingga data diperbaiki

### Persyaratan 2: Perhitungan PPh 21 dengan Skema TER

**User Story:** Sebagai Admin, saya ingin sistem menghitung PPh 21 secara otomatis menggunakan skema TER 2026, sehingga potongan pajak karyawan akurat dan sesuai regulasi terbaru.

#### Kriteria Penerimaan

1. WHEN Admin memproses penggajian bulanan, THE Kalkulator_Payroll SHALL menghitung PPh 21 menggunakan formula: PPh 21 = Penghasilan Bruto × Persentase TER, dengan persentase TER ditentukan berdasarkan kategori TER karyawan dan rentang penghasilan bruto sesuai tabel tarif TER 2026
2. THE Kalkulator_Payroll SHALL mengkategorikan karyawan ke dalam kategori TER berdasarkan pemetaan berikut sesuai PP 58/2023: Kategori A untuk status PTKP TK/0, TK/1, dan K/0; Kategori B untuk status PTKP TK/2, TK/3, K/1, dan K/2; Kategori C untuk status PTKP K/3
3. THE Kalkulator_Payroll SHALL mendukung seluruh kategori PTKP standar: TK/0, TK/1, TK/2, TK/3, K/0, K/1, K/2, K/3
4. THE Kalkulator_Payroll SHALL menghitung penghasilan bruto dengan menjumlahkan hanya komponen berikut: Gaji Pokok + Tunjangan Tetap + Uang Lembur, di mana setiap komponen bernilai minimal Rp 0
5. THE Kalkulator_Payroll SHALL mengaplikasikan persentase TER dari tabel tarif yang tersimpan di database berdasarkan kategori TER karyawan dan rentang penghasilan bruto, kemudian membulatkan hasil PPh 21 ke bawah ke satuan Rupiah terdekat (tanpa desimal)
6. IF status PTKP karyawan tidak terisi atau tidak valid, THEN THE Kalkulator_Payroll SHALL menolak perhitungan dan menampilkan pesan error yang menyebutkan nama karyawan dan field yang bermasalah
7. IF penghasilan bruto karyawan bernilai Rp 0, THEN THE Kalkulator_Payroll SHALL menetapkan PPh 21 sebesar Rp 0 tanpa melakukan lookup ke tabel TER
8. THE Kalkulator_Payroll SHALL menyediakan tabel konfigurasi tarif TER di database yang memuat kategori (A/B/C), batas bawah penghasilan bruto, batas atas penghasilan bruto, dan persentase tarif, yang dapat diperbarui oleh Admin melalui halaman pengaturan tanpa perubahan kode

### Persyaratan 3: Perhitungan BPJS Kesehatan dan Ketenagakerjaan

**User Story:** Sebagai Admin, saya ingin sistem menghitung potongan BPJS secara otomatis sesuai tarif 2026, sehingga kewajiban iuran perusahaan dan karyawan terpenuhi dengan benar.

#### Kriteria Penerimaan

1. THE Kalkulator_Payroll SHALL menghitung iuran BPJS Kesehatan dengan tarif total 5% dari upah (Gaji Pokok + Tunjangan Tetap), dengan pembagian 4% ditanggung pemberi kerja dan 1% dipotong dari gaji karyawan, di mana upah yang digunakan tidak melebihi batas atas upah BPJS Kesehatan yang tersimpan dalam tabel konfigurasi
2. THE Kalkulator_Payroll SHALL menghitung iuran BPJS Ketenagakerjaan dengan tarif default berikut dari upah (Gaji Pokok + Tunjangan Tetap): JHT 3,7% pemberi kerja dan 2% karyawan, JP 2% pemberi kerja dan 1% karyawan, JKM 0,3% pemberi kerja, JKK sesuai kelas risiko yang dikonfigurasi untuk perusahaan (rentang 0,24% hingga 1,74% pemberi kerja), dan JKP 0,36% pemberi kerja
3. WHILE periode penggajian berada dalam rentang Januari 2026 hingga Juni 2026, THE Kalkulator_Payroll SHALL menerapkan diskon 50% pada tarif JKK yang berlaku untuk perusahaan tersebut
4. THE Kalkulator_Payroll SHALL menerapkan batas atas upah untuk perhitungan JP, di mana upah yang melebihi nilai ceiling JP dalam tabel konfigurasi hanya dihitung sampai nilai ceiling tersebut
5. WHEN Admin mengubah tarif, kelas risiko JKK, atau batas atas upah melalui halaman pengaturan, THE Sistem SHALL memvalidasi bahwa nilai tarif berada dalam rentang 0% hingga 100% dan nilai batas atas upah lebih besar dari 0, menyimpan perubahan tersebut, dan menggunakannya pada perhitungan penggajian berikutnya tanpa memerlukan perubahan kode
6. IF upah karyawan bernilai 0 atau data tarif BPJS tidak tersedia dalam tabel konfigurasi, THEN THE Kalkulator_Payroll SHALL menolak perhitungan untuk karyawan tersebut dan menampilkan pesan error yang menyebutkan nama karyawan dan komponen yang bermasalah
7. THE Sistem SHALL menyediakan tabel konfigurasi untuk menyimpan seluruh tarif BPJS (JHT, JP, JKM, JKK per kelas risiko, JKP, Kesehatan), batas atas upah JP, batas atas upah BPJS Kesehatan, serta tanggal berlaku diskon JKK, yang dapat diubah oleh Admin

### Persyaratan 4: Perhitungan Gaji Bersih (Take-Home Pay)

**User Story:** Sebagai Admin, saya ingin sistem menghitung gaji bersih karyawan secara otomatis, sehingga saya mengetahui jumlah yang harus dibayarkan ke setiap karyawan.

#### Kriteria Penerimaan

1. WHEN Admin memproses penggajian, THE Kalkulator_Payroll SHALL menghitung gaji bersih dengan formula: Gaji Pokok + Tunjangan Tetap + Uang Lembur - Potongan PPh 21 - Potongan BPJS Kesehatan (1% bagian karyawan) - Potongan BPJS Ketenagakerjaan bagian karyawan (JHT 2% + JP 1%)
2. THE Kalkulator_Payroll SHALL menampilkan rincian perhitungan untuk setiap karyawan yang mencakup: Gaji Pokok, Tunjangan Tetap, Uang Lembur, total penghasilan bruto, potongan PPh 21, potongan BPJS Kesehatan (bagian karyawan), potongan BPJS Ketenagakerjaan per komponen (JHT dan JP bagian karyawan), total potongan, dan gaji bersih akhir
3. THE Kalkulator_Payroll SHALL memproses penggajian untuk seluruh karyawan aktif (maksimal 50 karyawan) dalam satu kali proses batch dan menyelesaikan seluruh perhitungan dalam waktu tidak lebih dari 30 detik
4. IF nilai gaji bersih menghasilkan angka negatif, THEN THE Kalkulator_Payroll SHALL menampilkan peringatan kepada Admin yang menyebutkan nama karyawan terkait, menghentikan penyimpanan hasil perhitungan karyawan tersebut, dan menandai status karyawan tersebut sebagai "Perlu Ditinjau" dalam daftar hasil penggajian
5. THE Kalkulator_Payroll SHALL membulatkan setiap hasil perhitungan komponen gaji ke bilangan bulat terdekat (Rupiah penuh, tanpa desimal) menggunakan metode pembulatan standar (0,5 ke atas)
6. IF perhitungan gagal untuk satu atau lebih karyawan dalam proses batch, THEN THE Kalkulator_Payroll SHALL melanjutkan perhitungan untuk karyawan lainnya, menyimpan hasil yang berhasil, dan menampilkan daftar karyawan yang gagal beserta alasan kegagalannya kepada Admin
7. WHEN proses batch selesai, THE Kalkulator_Payroll SHALL menampilkan ringkasan yang mencakup: jumlah karyawan berhasil diproses, jumlah karyawan gagal (jika ada), dan total gaji bersih keseluruhan yang harus dibayarkan

### Persyaratan 5: Ekspor Laporan Bulanan Format Coretax (CSV/XML)

**User Story:** Sebagai Admin, saya ingin mengekspor laporan penggajian bulanan dalam format CSV/XML standar Coretax, sehingga saya dapat mengunggahnya langsung ke portal DJP tanpa perlu input ulang.

#### Kriteria Penerimaan

1. WHEN Admin memilih ekspor laporan bulanan dan menentukan format (CSV atau XML) serta periode (bulan dan tahun), THE Modul_Ekspor SHALL menghasilkan file dalam format yang dipilih sesuai struktur data Coretax dalam waktu maksimal 30 detik untuk hingga 50 karyawan
2. THE Modul_Ekspor SHALL menyertakan field wajib Coretax dalam file ekspor untuk setiap karyawan aktif pada periode yang dipilih: NIK 16 digit, Nama Lengkap, Penghasilan Bruto, dan Potongan PPh 21
3. IF terdapat data karyawan yang tidak memenuhi validasi Coretax (NIK tidak 16 digit atau field wajib kosong), THEN THE Modul_Ekspor SHALL menampilkan daftar error yang mencantumkan nama karyawan dan field yang bermasalah untuk setiap pelanggaran, serta mencegah ekspor hingga data diperbaiki
4. THE Modul_Ekspor SHALL menamai file ekspor dengan format: [NamaPerusahaan]_[YYYY]_[MM].[csv/xml] sesuai format yang dipilih Admin
5. IF penggajian belum diproses untuk periode bulan dan tahun yang dipilih, THEN THE Modul_Ekspor SHALL menampilkan pesan bahwa ekspor hanya dapat dilakukan setelah penggajian periode tersebut selesai diproses

### Persyaratan 6: Generate Dokumen BPA1 (PDF)

**User Story:** Sebagai Admin, saya ingin menghasilkan dokumen bukti potong BPA1 dalam format PDF untuk setiap karyawan, sehingga karyawan memiliki bukti potong pajak resmi sesuai format Coretax.

#### Kriteria Penerimaan

1. WHEN Admin memilih generate BPA1 untuk periode bulan dan tahun tertentu, THE Modul_Ekspor SHALL menghasilkan dokumen PDF untuk setiap karyawan aktif yang telah diproses penggajiannya pada periode tersebut, dengan struktur field sesuai ketentuan BPA1 Coretax
2. THE Modul_Ekspor SHALL menyertakan field wajib berikut dalam setiap dokumen BPA1: Nama Karyawan, NIK 16 digit, Status PTKP, Masa Pajak (bulan dan tahun), Penghasilan Bruto, Potongan PPh 21, Nama Pemotong Pajak (nama perusahaan), dan NPWP Pemotong Pajak
3. THE Modul_Ekspor SHALL menghasilkan satu file PDF per karyawan yang dapat diunduh secara individual, atau dalam satu file ZIP untuk seluruh karyawan dalam periode yang dipilih
4. IF data karyawan belum diproses penggajiannya untuk periode yang diminta, THEN THE Modul_Ekspor SHALL menampilkan pesan error yang menyebutkan bahwa BPA1 hanya dapat digenerate setelah penggajian diproses untuk periode tersebut, dan mencegah proses generate dilanjutkan
5. THE Modul_Ekspor SHALL menamai file PDF dengan konvensi penamaan yang mencakup nama karyawan dan periode pajak (bulan dan tahun)
6. IF terjadi kegagalan saat proses generate PDF berlangsung, THEN THE Modul_Ekspor SHALL menampilkan daftar karyawan yang gagal digenerate dan memperbolehkan Admin untuk mengulang proses generate hanya untuk karyawan yang gagal

### Persyaratan 7: Multi-Tenancy dan Isolasi Data

**User Story:** Sebagai pemilik UMKM, saya ingin data perusahaan saya terisolasi sepenuhnya dari perusahaan lain, sehingga kerahasiaan data gaji dan karyawan terjamin.

#### Kriteria Penerimaan

1. THE Sistem SHALL mengasosiasikan setiap baris data dengan company_id yang terhubung ke akun pengguna yang login
2. THE Sistem SHALL menerapkan Row Level Security (RLS) pada seluruh tabel database sehingga pengguna hanya dapat mengakses data milik perusahaannya sendiri
3. WHEN pengguna melakukan query data, THE Sistem SHALL memfilter hasil berdasarkan company_id secara otomatis melalui kebijakan RLS tanpa bergantung pada logika aplikasi
4. THE Sistem SHALL membatasi satu akun untuk satu entitas perusahaan (satu NPWP Badan)
5. IF terjadi kegagalan pada kebijakan RLS yang memungkinkan akses lintas tenant, THEN THE Sistem SHALL menolak query tersebut dan mencatat kejadian dalam log keamanan

### Persyaratan 8: Enkripsi Data (Kepatuhan UU PDP)

**User Story:** Sebagai pemilik UMKM, saya ingin data sensitif karyawan (NIK dan gaji) terenkripsi, sehingga perusahaan saya mematuhi UU Perlindungan Data Pribadi dan terhindar dari sanksi.

#### Kriteria Penerimaan

1. THE Modul_Keamanan SHALL mengenkripsi data NIK dan data gaji karyawan saat disimpan di database (encryption at-rest) menggunakan algoritma AES-256
2. THE Modul_Keamanan SHALL mengenkripsi seluruh komunikasi data antara client dan server menggunakan protokol TLS 1.2 atau lebih tinggi (encryption in-transit)
3. THE Modul_Keamanan SHALL menyimpan kunci enkripsi pada layanan atau penyimpanan yang terpisah dari database yang menyimpan data terenkripsi, sehingga akses ke database saja tidak cukup untuk mendekripsi data
4. IF terjadi kegagalan enkripsi saat menyimpan data, THEN THE Modul_Keamanan SHALL membatalkan operasi penyimpanan, menampilkan pesan error kepada pengguna yang menginformasikan bahwa data gagal disimpan, dan mencatat kejadian tersebut dalam log keamanan meliputi: timestamp, jenis operasi yang gagal, dan identitas pengguna yang melakukan operasi
5. WHEN pengguna dengan peran Owner atau HR Staff mengakses data NIK atau gaji, THE Modul_Keamanan SHALL mendekripsi dan menampilkan data tersebut dalam bentuk terbaca hanya kepada pengguna yang memiliki hak akses sesuai kebijakan RBAC
6. THE Modul_Keamanan SHALL memastikan data NIK dan gaji dalam bentuk plaintext tidak tercatat dalam application log, error message, atau response API selain kepada pengguna yang berwenang
7. WHILE pengguna dengan peran Regular Staff mengakses data karyawan lain, THE Modul_Keamanan SHALL menampilkan data NIK dalam bentuk tersamarkan (masking) dengan hanya menampilkan 4 digit terakhir

### Persyaratan 9: Role-Based Access Control (RBAC)

**User Story:** Sebagai pemilik UMKM, saya ingin mengatur hak akses berdasarkan peran pengguna, sehingga hanya pihak yang berwenang yang dapat mengakses dan mengubah data sensitif.

#### Kriteria Penerimaan

1. THE Modul_Keamanan SHALL mendukung tepat tiga peran pengguna: Owner (pemilik), HR Staff (staf HR), dan Regular Staff (staf biasa), di mana pengguna pertama yang mendaftarkan perusahaan secara otomatis mendapat peran Owner
2. THE Modul_Keamanan SHALL memberikan akses penuh kepada peran Owner meliputi: baca, tulis, dan hapus data karyawan; proses penggajian; ekspor dokumen; pengaturan sistem (tarif BPJS, batas atas upah); serta pengelolaan peran pengguna lain
3. THE Modul_Keamanan SHALL memberikan akses kepada peran HR Staff meliputi: baca dan tulis data karyawan, proses penggajian, dan ekspor dokumen, tetapi TANPA akses hapus data karyawan, TANPA akses pengaturan sistem, dan TANPA akses pengelolaan peran pengguna
4. THE Modul_Keamanan SHALL membatasi peran Regular Staff untuk hanya dapat melihat data profil dirinya sendiri (nama, jabatan, tanggal bergabung) dan slip gaji miliknya sendiri, tanpa akses ke data karyawan lain, fitur penggajian, ekspor dokumen, atau pengaturan sistem
5. IF pengguna dengan peran tidak berwenang mencoba mengakses fitur yang dibatasi, THEN THE Modul_Keamanan SHALL menolak akses dengan menampilkan pesan yang menyatakan bahwa pengguna tidak memiliki izin untuk fitur tersebut, dan mencatat percobaan tersebut dalam audit trail dalam waktu maksimal 5 detik setelah percobaan terjadi
6. WHEN Owner mengubah peran pengguna lain, THE Modul_Keamanan SHALL menerapkan perubahan hak akses tersebut pada sesi berikutnya dari pengguna yang perannya diubah
7. THE Modul_Keamanan SHALL memastikan bahwa minimal satu pengguna dengan peran Owner selalu ada dalam setiap perusahaan, sehingga Owner terakhir tidak dapat dihapus atau diturunkan perannya

### Persyaratan 10: Audit Trail

**User Story:** Sebagai pemilik UMKM, saya ingin seluruh aktivitas penting dalam sistem tercatat, sehingga saya memiliki bukti sah jika perusahaan diaudit oleh DJP.

#### Kriteria Penerimaan

1. THE Modul_Keamanan SHALL mencatat setiap aktivitas berikut dalam log audit: proses perhitungan penggajian, perubahan data gaji karyawan, perubahan data karyawan, ekspor dokumen, dan perubahan pengaturan sistem
2. THE Modul_Keamanan SHALL menyimpan informasi berikut untuk setiap entri audit: timestamp dalam format ISO 8601 dengan zona waktu (contoh: 2026-01-15T10:30:00+07:00), user_id, peran pengguna, jenis aksi, detail perubahan pada level field (nama field, nilai sebelum, dan nilai sesudah), serta alamat IP
3. THE Modul_Keamanan SHALL melindungi log audit dari modifikasi atau penghapusan oleh pengguna manapun termasuk Owner, sehingga tidak tersedia fungsi edit atau hapus entri audit melalui antarmuka aplikasi maupun API
4. WHILE log audit tersimpan dalam sistem, THE Modul_Keamanan SHALL mempertahankan log tersebut selama minimal 5 tahun sejak tanggal pencatatan sesuai ketentuan retensi dokumen perpajakan
5. IF pencatatan log audit gagal saat aktivitas tercatat sedang diproses, THEN THE Modul_Keamanan SHALL membatalkan operasi yang memicu pencatatan tersebut dan menampilkan pesan error yang mengindikasikan bahwa aktivitas tidak dapat diproses karena kegagalan pencatatan audit
6. WHEN Owner mengakses halaman audit trail, THE Modul_Keamanan SHALL menampilkan log audit dengan kemampuan filter berdasarkan rentang tanggal, jenis aksi, dan user_id, dengan akses baca terbatas hanya untuk peran Owner
7. THE Modul_Keamanan SHALL mencatat entri audit dalam waktu maksimal 2 detik setelah aktivitas yang memicu pencatatan selesai dieksekusi

### Persyaratan 11: Alur Proses Penggajian

**User Story:** Sebagai Admin, saya ingin proses penggajian berjalan sederhana tanpa alur persetujuan bertingkat, sehingga saya dapat menyelesaikan penggajian dengan cepat setiap bulan.

#### Kriteria Penerimaan

1. THE Sistem SHALL menyediakan alur penggajian satu langkah: Admin menginput/review data → klik "Proses Penggajian" → Sistem menghitung → Selesai
2. THE Sistem SHALL memproses penggajian dengan frekuensi bulanan (satu kali per bulan per periode), dan IF Admin mencoba memproses penggajian untuk periode bulan yang sudah pernah diproses, THEN THE Sistem SHALL menampilkan peringatan bahwa periode tersebut sudah diproses dan meminta konfirmasi sebelum menimpa hasil sebelumnya
3. WHEN Admin mengklik "Proses Penggajian", THE Kalkulator_Payroll SHALL memvalidasi seluruh data karyawan aktif meliputi: kelengkapan NIK 16 digit, status PTKP yang valid, dan gaji pokok yang terisi, sebelum memulai perhitungan
4. IF validasi data gagal, THEN THE Sistem SHALL menampilkan daftar error yang mencantumkan nama karyawan, field yang bermasalah, dan jenis kesalahan untuk setiap karyawan yang tidak lolos validasi, serta membatalkan proses penggajian hingga data diperbaiki
5. WHEN proses penggajian selesai, THE Sistem SHALL menampilkan ringkasan hasil perhitungan yang mencakup: jumlah karyawan yang diproses, total gaji bruto, total potongan PPh 21, total potongan BPJS, dan total gaji bersih seluruh karyawan kepada Admin
6. WHILE proses penggajian sedang berjalan, THE Sistem SHALL menampilkan indikator progres kepada Admin dan mencegah Admin memulai proses penggajian lain hingga proses saat ini selesai atau gagal

### Persyaratan 12: Batasan Lingkup MVP

**User Story:** Sebagai tim pengembang, saya ingin batasan lingkup MVP terdefinisi dengan jelas, sehingga pengembangan tetap fokus pada fitur inti dan selesai dalam 2-4 minggu.

#### Kriteria Penerimaan

1. THE Sistem SHALL membatasi komponen penghasilan hanya pada tiga jenis: Gaji Pokok, Tunjangan Tetap, dan Uang Lembur, serta tidak menyediakan field input atau opsi untuk komponen lain seperti bonus, THR, komisi, atau komponen variabel lainnya
2. THE Sistem SHALL menghasilkan file ekspor dalam format CSV atau XML untuk diunggah secara manual ke portal Coretax (tanpa integrasi API langsung ke DJP)
3. THE Sistem SHALL menyediakan unduhan dokumen BPA1 dan slip gaji hanya melalui peran Admin (tanpa portal Employee Self Service atau akses langsung oleh karyawan)
4. THE Sistem SHALL beroperasi tanpa integrasi ke sistem perbankan untuk transfer gaji otomatis
5. THE Sistem SHALL beroperasi tanpa fitur manajemen kehadiran (absensi/clock-in/clock-out) atau cuti
6. THE Sistem SHALL menerima input Uang Lembur secara manual oleh Admin dalam bentuk nilai nominal Rupiah per karyawan per periode penggajian
7. THE Sistem SHALL mendukung pengelolaan maksimal 50 karyawan aktif per perusahaan
