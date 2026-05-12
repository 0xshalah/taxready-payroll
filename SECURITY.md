# SECURITY.md — Tax-Ready Payroll

> Panduan keamanan aplikasi berdasarkan OWASP Top 10 (Edisi 2025) dan kepatuhan UU Perlindungan Data Pribadi (UU PDP) Indonesia.

## Ringkasan

Dokumen ini mendefinisikan strategi keamanan untuk Tax-Ready Payroll — aplikasi yang menangani data sensitif (NIK, gaji, data perpajakan) milik karyawan UMKM. Setiap keputusan keamanan dirancang untuk memenuhi:
1. **OWASP Top 10 (2025)** — 10 risiko keamanan aplikasi web paling kritis
2. **UU PDP (UU No. 27/2022)** — Perlindungan data pribadi karyawan
3. **Kepatuhan Coretax DJP** — Integritas data perpajakan

---

## OWASP Top 10 (2025) — Implementasi per Kategori

### A01: Broken Access Control

**Risiko:** Pengguna mengakses data atau fitur di luar izinnya (misal: HR Staff menghapus data, atau user Company A melihat data Company B).

**Implementasi:**

| Kontrol | Detail |
|---------|--------|
| Row Level Security (RLS) | Setiap tabel memiliki policy `company_id = current_user_company_id`. Isolasi data di level database, bukan aplikasi. |
| RBAC 3-tier | Owner / HR Staff / Regular Staff. Permission check di RLS policy DAN di frontend route guard. |
| Deny by default | Semua tabel RLS enabled. Tanpa policy = tidak ada akses. |
| CORS strict | Hanya origin aplikasi yang diizinkan. |
| Rate limiting | Supabase built-in rate limiting pada Auth endpoints. |

**Checklist:**
- [ ] Semua tabel memiliki RLS enabled
- [ ] Setiap RLS policy memfilter berdasarkan `company_id`
- [ ] ProtectedRoute component memvalidasi role sebelum render
- [ ] Regular Staff hanya bisa akses `/profile` dan `/my-payslips`
- [ ] DELETE operation hanya tersedia untuk Owner (via RLS policy)
- [ ] Tidak ada endpoint yang bisa diakses tanpa autentikasi
- [ ] SSRF dicegah: tidak ada user-supplied URL yang di-fetch oleh server

---

### A02: Security Misconfiguration

**Risiko:** Konfigurasi default yang tidak aman, fitur yang tidak perlu aktif, error messages yang membocorkan informasi.

**Implementasi:**

| Kontrol | Detail |
|---------|--------|
| Supabase project settings | Disable public schema access. Disable realtime untuk tabel sensitif. |
| Environment variables | Semua secrets di `.env` (tidak di-commit). Supabase anon key hanya untuk operasi publik (login/register). |
| Security headers | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `Content-Security-Policy` |
| Error handling | Pesan error generik ke user. Detail error hanya di server log (tanpa PII). |
| Unused features | Disable Supabase Storage (tidak digunakan MVP). Disable Realtime subscriptions. |

**Checklist:**
- [ ] `.env` ada di `.gitignore`
- [ ] Tidak ada hardcoded credentials di source code
- [ ] Supabase Dashboard: disable public schema access
- [ ] Security headers dikonfigurasi di hosting (Vercel/Netlify headers)
- [ ] Error messages tidak mengandung stack trace atau detail database
- [ ] Disable Supabase features yang tidak digunakan (Storage, Realtime, Edge Functions jika tidak perlu)

---

### A03: Software Supply Chain Failures

**Risiko:** Dependency yang vulnerable atau compromised masuk ke production.

**Implementasi:**

| Kontrol | Detail |
|---------|--------|
| Lock file | `package-lock.json` atau `pnpm-lock.yaml` di-commit. Exact versions. |
| Audit rutin | `npm audit` dijalankan sebelum setiap release. |
| Minimal dependencies | Hanya install package yang benar-benar dibutuhkan. Prefer well-known packages. |
| Integrity check | `npm ci` (bukan `npm install`) di CI/CD untuk memastikan lockfile integrity. |

**Checklist:**
- [ ] Lock file di-commit ke repository
- [ ] `npm audit` tidak ada critical/high vulnerability
- [ ] Tidak ada dependency dengan maintainer tunggal yang tidak aktif > 1 tahun
- [ ] Gunakan `npm ci` di pipeline deployment
- [ ] Review dependency baru sebelum install (cek download count, last update, maintainers)

---

### A04: Cryptographic Failures

**Risiko:** Data sensitif (NIK, gaji) terekspos karena enkripsi lemah atau tidak ada.

**Implementasi:**

| Kontrol | Detail |
|---------|--------|
| Encryption at-rest | NIK dan gaji_pokok dienkripsi dengan `pgp_sym_encrypt` (AES-256) via pgcrypto |
| Encryption in-transit | TLS 1.2+ enforced (Supabase default). HSTS header. |
| Key management | Encryption key disimpan di Supabase Vault, terpisah dari data. |
| Password hashing | Supabase Auth menggunakan bcrypt (default, tidak perlu custom). |
| No plaintext PII in logs | NIK dan gaji tidak boleh muncul di console.log, error messages, atau API responses (kecuali ke user berwenang). |

**Checklist:**
- [ ] Kolom `nik_encrypted` dan `gaji_pokok_encrypted` bertipe BYTEA (bukan TEXT)
- [ ] Encryption key tersimpan di Supabase Vault (bukan di `.env` atau source code)
- [ ] `console.log` tidak pernah mencetak NIK atau gaji dalam plaintext
- [ ] TLS enforced (no HTTP fallback)
- [ ] Fungsi `encrypt_value` dan `decrypt_value` menggunakan `SECURITY DEFINER`

---

### A05: Injection

**Risiko:** SQL injection, XSS, atau command injection melalui input user.

**Implementasi:**

| Kontrol | Detail |
|---------|--------|
| Parameterized queries | Supabase JS client menggunakan parameterized queries secara default. Tidak ada raw SQL dari user input. |
| Input validation | Zod schema memvalidasi semua input sebelum dikirim ke database. |
| Output encoding | React secara default melakukan XSS escaping pada JSX. Tidak menggunakan `dangerouslySetInnerHTML`. |
| Content Security Policy | CSP header mencegah inline scripts dan unauthorized sources. |

**Checklist:**
- [ ] Tidak ada string concatenation untuk query SQL
- [ ] Semua form input divalidasi dengan Zod schema sebelum submit
- [ ] Tidak ada penggunaan `dangerouslySetInnerHTML`
- [ ] CSP header dikonfigurasi: `script-src 'self'`
- [ ] NIK input hanya menerima digit (regex `/^\d{16}$/`)
- [ ] Gaji input hanya menerima angka positif

---

### A06: Insecure Design

**Risiko:** Kelemahan arsitektur yang tidak bisa diperbaiki dengan implementasi saja.

**Implementasi:**

| Kontrol | Detail |
|---------|--------|
| Threat modeling | Identifikasi aset (NIK, gaji), threat actors (insider, external attacker), dan attack vectors. |
| Defense in depth | RLS (database) + RBAC guard (frontend) + input validation (form). Tiga layer. |
| Fail secure | Jika RLS gagal → query ditolak (bukan diizinkan). Jika enkripsi gagal → operasi dibatalkan. |
| Business logic validation | Gaji negatif → warning. Periode duplikat → konfirmasi. NIK duplikat → reject. |
| Least privilege | Supabase anon key hanya bisa: login, register. Semua operasi data memerlukan authenticated session. |

**Checklist:**
- [ ] Setiap fitur memiliki validasi di minimal 2 layer (client + database)
- [ ] Tidak ada "admin bypass" yang melewati RLS
- [ ] Audit trail tidak bisa di-disable oleh user manapun
- [ ] Owner terakhir tidak bisa dihapus (invariant)
- [ ] Payroll processing memvalidasi SEMUA karyawan sebelum mulai (fail-fast)

---

### A07: Authentication Failures

**Risiko:** Credential stuffing, session hijacking, brute force.

**Implementasi:**

| Kontrol | Detail |
|---------|--------|
| Supabase Auth | Managed authentication service dengan bcrypt hashing, JWT tokens, refresh token rotation. |
| Password policy | Minimum 8 karakter (Supabase default). Recommend: 12+ karakter. |
| Session management | JWT expiry 1 jam. Refresh token rotation enabled. |
| Rate limiting | Supabase built-in: max 30 login attempts per hour per IP. |
| No credential exposure | Password tidak pernah di-log. JWT tidak disimpan di localStorage (gunakan httpOnly cookie jika memungkinkan, atau Supabase default secure storage). |

**Checklist:**
- [ ] Supabase Auth configured dengan email confirmation enabled
- [ ] Password minimum length ≥ 8 karakter
- [ ] JWT expiry ≤ 3600 detik (1 jam)
- [ ] Refresh token rotation enabled
- [ ] Login failure tidak membocorkan apakah email terdaftar atau tidak (generic error message)
- [ ] Logout menghapus session di client DAN invalidate refresh token

---

### A08: Software or Data Integrity Failures

**Risiko:** Data payroll dimanipulasi, audit log di-tamper, atau update aplikasi compromised.

**Implementasi:**

| Kontrol | Detail |
|---------|--------|
| Immutable audit logs | REVOKE UPDATE, DELETE pada tabel `audit_logs`. Tidak ada API endpoint untuk modify/delete. |
| Data integrity checks | Payroll records disimpan dengan semua komponen (bruto, potongan, net_pay) — bisa di-verify ulang. |
| Deployment integrity | Deploy dari branch terproteksi. Tidak ada manual file upload ke production. |
| Input integrity | Zod schema memastikan data yang masuk sesuai format yang diharapkan. |

**Checklist:**
- [ ] `REVOKE UPDATE, DELETE ON audit_logs FROM authenticated, service_role` diterapkan
- [ ] Tidak ada API endpoint yang bisa mengubah audit_logs
- [ ] Payroll records menyimpan snapshot data (bukan reference) sehingga bisa di-audit
- [ ] Deployment hanya dari main/production branch

---

### A09: Security Logging & Alerting Failures

**Risiko:** Serangan tidak terdeteksi, investigasi breach tidak mungkin dilakukan.

**Implementasi:**

| Kontrol | Detail |
|---------|--------|
| Audit trail komprehensif | Semua operasi sensitif dicatat: payroll, CRUD karyawan, ekspor, settings, role change, unauthorized access. |
| Structured logging | Format: timestamp ISO 8601, user_id, role, action, entity, changes (before/after), IP address. |
| Alerting | Unauthorized access attempts dicatat. Owner bisa filter dan review. |
| Retention | Minimum 5 tahun (sesuai ketentuan retensi dokumen perpajakan DJP). |
| No PII in logs | NIK dan gaji TIDAK dicatat dalam audit log changes (hanya "field changed", bukan nilainya). |

**Checklist:**
- [ ] Setiap operasi CRUD pada data sensitif menghasilkan audit entry
- [ ] Unauthorized access attempts dicatat dengan IP address
- [ ] Audit log viewer tersedia untuk Owner dengan filter
- [ ] Log retention policy: tidak ada auto-delete sebelum 5 tahun
- [ ] Audit log tidak mengandung plaintext NIK atau gaji

---

### A10: Mishandling of Exceptional Conditions

**Risiko:** Aplikasi crash, expose data sensitif, atau "fail open" saat terjadi error.

**Implementasi:**

| Kontrol | Detail |
|---------|--------|
| Fail secure | Enkripsi gagal → batalkan operasi (jangan simpan plaintext). Audit gagal → batalkan operasi pemicu. |
| Graceful error handling | Try-catch di setiap operasi kritis. User melihat pesan generik, bukan stack trace. |
| Batch fault tolerance | Kegagalan 1 karyawan dalam batch tidak menghentikan seluruh proses. Error di-collect dan dilaporkan. |
| Boundary validation | Gaji negatif → warning (bukan crash). NIK invalid → reject (bukan exception). |
| Error boundaries | React ErrorBoundary component mencegah white screen of death. |

**Checklist:**
- [ ] Semua async operations dibungkus try-catch
- [ ] ErrorBoundary component di root app
- [ ] Enkripsi failure → operasi dibatalkan + log security event
- [ ] Audit log failure → operasi pemicu dibatalkan
- [ ] Batch processor: kegagalan parsial tidak menghentikan batch
- [ ] Tidak ada `throw` tanpa `catch` di production code
- [ ] Error messages ke user tidak mengandung technical details

---

## Keamanan Tambahan (Beyond OWASP)

### Kepatuhan UU PDP (UU No. 27/2022)

| Aspek | Implementasi |
|-------|-------------|
| Dasar pemrosesan | Kontrak kerja (hubungan ketenagakerjaan) sebagai dasar hukum pemrosesan data karyawan |
| Minimalisasi data | Hanya simpan data yang diperlukan. TIDAK menyimpan data keluarga (nama/NIK istri/anak). Cukup status PTKP. |
| Enkripsi | AES-256 at-rest untuk NIK dan gaji. TLS 1.2+ in-transit. |
| Hak akses | Data hanya bisa diakses oleh Owner dan HR Staff perusahaan yang bersangkutan (via RLS). |
| Data masking | Regular Staff melihat NIK ter-mask (hanya 4 digit terakhir). |
| Retensi | Data payroll disimpan sesuai kebutuhan perpajakan (5 tahun). Setelah itu bisa dihapus. |
| Breach notification | Jika terjadi kebocoran, wajib lapor ke subjek data dan otoritas dalam 3×24 jam (prosedur manual untuk MVP). |

### Secure Development Practices

| Praktik | Detail |
|---------|--------|
| Secrets management | Semua credentials di environment variables. Tidak ada secret di source code. |
| Git hygiene | `.env`, `*.key`, `*.pem` di `.gitignore`. Pre-commit hook untuk cek secrets (opsional). |
| Dependency pinning | Exact versions di package.json. Lock file di-commit. |
| Code review | Setiap PR yang menyentuh auth/enkripsi/RLS harus di-review. |
| Testing | Property-based tests memvalidasi correctness properties keamanan (RBAC, enkripsi, masking). |

### HTTP Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://*.supabase.co
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Supabase-Specific Security

| Kontrol | Detail |
|---------|--------|
| Anon key scope | Hanya untuk auth operations (login, register, password reset). |
| Service role key | TIDAK pernah di-expose ke client. Hanya untuk server-side operations (jika ada). |
| RLS enforcement | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` pada SEMUA tabel. |
| Function security | `SECURITY DEFINER` pada fungsi enkripsi/dekripsi agar key tidak terekspos ke client. |
| Vault | Encryption keys disimpan di Supabase Vault, diakses hanya oleh SECURITY DEFINER functions. |

---

## Security Testing Checklist (Pre-Release)

### Automated
- [ ] `npm audit` — zero critical/high vulnerabilities
- [ ] Property tests lulus (RBAC, enkripsi, masking, validasi)
- [ ] Zod schema coverage: semua form input tervalidasi

### Manual
- [ ] Coba akses data company lain via browser DevTools (harus gagal — RLS)
- [ ] Coba akses route `/settings` sebagai HR Staff (harus redirect — RBAC)
- [ ] Coba akses route `/employees` sebagai Regular Staff (harus redirect)
- [ ] Coba submit NIK dengan karakter non-angka (harus ditolak)
- [ ] Coba submit form tanpa field wajib (harus menampilkan error per field)
- [ ] Periksa Network tab: tidak ada plaintext NIK/gaji di response untuk Regular Staff
- [ ] Periksa Console: tidak ada plaintext PII di log

### Penetration Testing (Post-MVP)
- [ ] IDOR testing: ganti UUID di URL, verifikasi akses ditolak
- [ ] SQL injection: coba inject via search/filter fields
- [ ] XSS: coba inject script via nama karyawan atau jabatan
- [ ] CSRF: verifikasi Supabase JWT mencegah cross-site requests
- [ ] Brute force: verifikasi rate limiting pada login

---

## Incident Response (Prosedur Manual MVP)

1. **Deteksi** — Monitor audit trail untuk unauthorized_access entries
2. **Containment** — Disable akun yang compromised via Supabase Dashboard
3. **Assessment** — Review audit logs untuk scope of breach
4. **Notification** — Jika data pribadi bocor: lapor ke subjek data + otoritas dalam 3×24 jam (UU PDP)
5. **Recovery** — Rotate encryption keys jika key compromised. Reset passwords affected users.
6. **Post-mortem** — Dokumentasikan root cause dan perbaikan

---

## Referensi

- [OWASP Top 10 (2025)](https://owasp.org/Top10/) — Edisi ke-8, berlaku sejak 2025
- [UU PDP (UU No. 27/2022)](https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022) — Perlindungan Data Pribadi Indonesia
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod)
- [OWASP Application Security Verification Standard (ASVS)](https://owasp.org/www-project-application-security-verification-standard/)

---

*Dokumen ini harus di-review dan diperbarui setiap kali ada perubahan arsitektur, penambahan fitur, atau update regulasi.*
