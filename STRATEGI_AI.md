# STRATEGI_AI.md — Mengatasi Tantangan Vibe Coding untuk Tax-Ready Payroll

> Dokumen ini berisi strategi konkret untuk mengatasi setiap tantangan yang diidentifikasi dalam `tantangan.md`, berdasarkan riset terbaru.

---

## ⚠️ TEMUAN KRITIS: Pemetaan PTKP → Kategori TER Perlu Dikoreksi

Berdasarkan riset dari [StaffAny PPh21 Calculation Guide](https://help.staffany.com/en/articles/10717593-pph21-calculation) dan regulasi PP 58/2023, pemetaan yang **benar** adalah:

| Kategori TER | Status PTKP |
|---|---|
| **A** | TK/0, TK/1, **K/0** |
| **B** | TK/2, TK/3, K/1, **K/2** |
| **C** | **K/3** saja |

**Perbedaan dari desain awal kita:**
- K/0 seharusnya masuk Kategori **A** (bukan B)
- K/2 seharusnya masuk Kategori **B** (bukan C)
- Kategori C hanya untuk K/3

**Aksi:** Update `src/lib/constants.ts` dan `design.md` sebelum implementasi kalkulator TER.

---

## 🟢 Tingkat Gampang — Strategi: Autopilot

### Scaffolding & UI Components
**Status:** ✅ Sudah selesai (Task 1-2)
**Strategi yang berhasil:**
- Berikan folder structure yang eksplisit di prompt
- Gunakan DESIGN.md sebagai referensi visual
- Biarkan AI generate boilerplate tanpa banyak intervensi

### Validasi Form Dasar
**Status:** ✅ Sudah selesai (Task 4.1)
**Strategi yang berhasil:**
- Definisikan constants terlebih dahulu (NIK_LENGTH, MAX_GAJI_POKOK, dll.)
- Gunakan Zod schema — AI sangat familiar dengan library ini
- Tulis error messages dalam Bahasa Indonesia langsung di prompt

### Routing & Layout
**Status:** ✅ Sudah selesai (Task 3.2)
**Strategi yang berhasil:**
- Berikan RBAC matrix secara eksplisit dalam prompt
- Gunakan tabel permission yang jelas (role × resource × action)

---

## 🟡 Tingkat Menengah — Strategi: Prompt Presisi + Validasi Manual

### 1. Generasi File Ekspor (CSV/XML/PDF)

**Tantangan:** AI bisa menambahkan field karangan yang tidak ada di Coretax.

**Strategi:**
```
STEERING RULE: File ekspor Coretax HANYA boleh mengandung 4 field:
1. NIK (16 digit)
2. Nama Lengkap
3. Penghasilan Bruto (angka bulat, tanpa desimal)
4. Potongan PPh 21 (angka bulat, tanpa desimal)

JANGAN tambahkan field lain seperti: alamat, NPWP lama, kode KPP, dll.
Format penamaan: [NamaPerusahaan]_[YYYY]_[MM].[csv/xml]
```

**Validasi:** Buat unit test yang memverifikasi output CSV hanya punya 4 kolom.

### 2. RLS Policies

**Tantangan:** AI bisa salah logika pada nested subquery.

**Strategi:**
- Selalu gunakan pola yang sama untuk semua tabel:
  ```sql
  company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  ```
- Jangan biarkan AI membuat variasi — konsistensi lebih penting dari kreativitas
- Test manual: login sebagai user Company A, coba query data Company B

### 3. Client-Side Batch Processing

**Tantangan:** AI sering menyarankan Edge Functions atau serverless.

**Strategi:**
```
STEERING RULE: SEMUA perhitungan payroll berjalan di BROWSER (client-side).
JANGAN gunakan Edge Functions, serverless, atau backend API untuk kalkulasi.
Alasan: menghindari biaya, batch 50 karyawan < 1 detik di browser modern.
Alur: Fetch data → Hitung di browser → Simpan hasil ke Supabase.
```

---

## 🟠 Tingkat Sulit — Strategi: Data-Driven + Property Testing

### 1. Kalkulator PPh 21 TER

**Tantangan:** AI bisa salah tarif, salah pembulatan, atau salah kategori.

**Strategi — Gunakan Tabel TER sebagai "Ground Truth":**

Simpan tabel TER lengkap sebagai data seed di database (bukan hardcode di kode). Ini memastikan:
- AI tidak perlu "mengingat" 100+ baris tarif
- Perubahan tarif cukup update database, bukan kode
- Property test bisa memverifikasi terhadap data yang sama

**Tabel TER Kategori A (contoh sebagian):**
```
0 - 5,400,000 → 0%
5,400,001 - 5,650,000 → 0.25%
5,650,001 - 5,950,000 → 0.5%
...
```

**Aturan pembulatan:** `Math.floor()` untuk PPh 21 (bulatkan ke bawah ke Rupiah penuh).

**Property Test kunci:**
```typescript
// Property 6: PPh 21 = floor(Bruto × Rate%)
fc.assert(
  fc.property(
    fc.integer({ min: 1, max: 100_000_000 }),
    (bruto) => {
      const rate = findApplicableRate(terRates, 'A', bruto);
      const expected = Math.floor(bruto * rate / 100);
      const actual = calculatePPh21({ gross_income: bruto, ptkp_status: 'TK/0' }, terRates);
      return actual.pph21_amount === expected;
    }
  ),
  { numRuns: 1000 }
);
```

### 2. Kalkulator BPJS

**Tantangan:** Ceiling, diskon temporal, dan banyak komponen.

**Strategi — Decompose menjadi fungsi kecil:**
```typescript
// Setiap komponen BPJS = 1 fungsi pure, mudah di-test
calculateBPJSKesehatan(wage, config) // → { employer, employee }
calculateJHT(wage, config)           // → { employer, employee }
calculateJP(wage, config)            // → { employer, employee } (dengan ceiling)
calculateJKK(wage, config, period)   // → employer (dengan diskon temporal)
calculateJKM(wage, config)           // → employer
calculateJKP(wage, config)           // → employer
```

**Aturan pembulatan:** `Math.round()` untuk BPJS (bulatkan ke terdekat).

**Diskon JKK — logika temporal:**
```typescript
function isJKKDiscountActive(period: Date, config: BPJSConfig): boolean {
  const start = new Date(config.jkk_discount_start); // 2026-01-01
  const end = new Date(config.jkk_discount_end);     // 2026-06-30
  return period >= start && period <= end;
}
// Jika aktif: JKK rate × 0.5
```

### 3. Property-Based Testing (PBT)

**Tantangan:** AI terbiasa example-based testing, bukan PBT.

**Strategi — Berikan template PBT yang eksplisit:**

```typescript
// Template yang harus diikuti AI untuk setiap property test:
import { fc } from 'fast-check';
import { describe, it, expect } from 'vitest';

describe('Property N: [Nama Property]', () => {
  it('should hold for all valid inputs', () => {
    fc.assert(
      fc.property(
        // 1. GENERATOR: definisikan input acak yang valid
        fc.integer({ min: X, max: Y }),
        fc.constantFrom(...VALID_VALUES),
        // 2. PROPERTY: definisikan apa yang harus selalu benar
        (input1, input2) => {
          const result = functionUnderTest(input1, input2);
          // 3. ASSERTION: verifikasi property
          expect(result).toSatisfy(condition);
        }
      ),
      { numRuns: 100 } // minimum 100 iterasi
    );
  });
});
```

**Steering rule untuk AI:**
```
JANGAN tulis unit test biasa (example-based) untuk property tests.
GUNAKAN fc.assert + fc.property + generator.
Minimum 100 numRuns per property.
Generator harus menghasilkan input yang VALID (dalam range yang benar).
```

### 4. RBAC Invariant (Owner Terakhir)

**Tantangan:** AI lupa edge case ini saat menulis update logic.

**Strategi — Buat fungsi guard terpisah:**
```typescript
// src/lib/rbac.ts
export function canDemoteOrDeleteUser(
  targetUserId: string,
  targetRole: UserRole,
  companyOwnerCount: number
): { allowed: boolean; reason?: string } {
  if (targetRole === 'owner' && companyOwnerCount <= 1) {
    return { allowed: false, reason: 'Owner terakhir tidak dapat dihapus atau diturunkan' };
  }
  return { allowed: true };
}
```

**Property test:**
```typescript
// Property 16: Invariant minimal satu Owner
fc.assert(
  fc.property(
    fc.integer({ min: 1, max: 5 }), // jumlah owner
    (ownerCount) => {
      if (ownerCount === 1) {
        const result = canDemoteOrDeleteUser('any-id', 'owner', ownerCount);
        return result.allowed === false;
      }
      return true; // jika > 1 owner, boleh hapus/demote
    }
  )
);
```

---

## 🔴 Tingkat Terberat — Strategi: Human-in-the-Loop + Arsitektur Defensif

### 1. Enkripsi pgcrypto + Key Management

**Tantangan:** Kunci enkripsi tidak boleh terekspos ke frontend, tapi RPC harus bisa dekripsi.

**Strategi — Arsitektur 3 Layer:**

```
┌─────────────────────────────────────────────────┐
│ Layer 1: Frontend (Browser)                      │
│ - TIDAK pernah menyentuh encryption key          │
│ - Hanya memanggil Supabase RPC                   │
│ - Menerima data yang sudah didekripsi            │
└─────────────────────┬───────────────────────────┘
                      │ RPC call (via anon key + JWT)
┌─────────────────────▼───────────────────────────┐
│ Layer 2: PostgreSQL Functions (SECURITY DEFINER) │
│ - encrypt_value(plaintext, key)                  │
│ - decrypt_value(ciphertext, key)                 │
│ - Key diambil dari Vault di dalam fungsi         │
└─────────────────────┬───────────────────────────┘
                      │ Internal call
┌─────────────────────▼───────────────────────────┐
│ Layer 3: Supabase Vault                          │
│ - Menyimpan encryption key                       │
│ - Hanya bisa diakses oleh SECURITY DEFINER func  │
│ - Tidak terekspos via API atau RLS               │
└─────────────────────────────────────────────────┘
```

**Implementasi Vault (SQL):**
```sql
-- Simpan key di Vault (jalankan sekali via Supabase Dashboard SQL Editor)
SELECT vault.create_secret('my-encryption-key-value', 'payroll_encryption_key');

-- Fungsi yang mengambil key dari Vault (bukan dari parameter!)
CREATE OR REPLACE FUNCTION encrypt_nik(plain_nik TEXT)
RETURNS BYTEA AS $$
DECLARE
  enc_key TEXT;
BEGIN
  SELECT decrypted_secret INTO enc_key
  FROM vault.decrypted_secrets
  WHERE name = 'payroll_encryption_key';
  
  RETURN pgp_sym_encrypt(plain_nik, enc_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Keuntungan:** Frontend TIDAK perlu tahu encryption key. Key hanya ada di Vault.

**Catatan MVP:** Untuk iterasi pertama, pendekatan saat ini (key di env var, dikirim via RPC parameter) sudah cukup. Migrasi ke Vault dilakukan sebelum production release.

### 2. Immutability Audit Trail

**Tantangan:** AI sering hanya mengandalkan RLS, padahal service_role bisa bypass.

**Strategi — Defense in Depth:**

```sql
-- Level 1: RLS (mencegah akses via API biasa)
-- Sudah diimplementasi ✅

-- Level 2: REVOKE (mencegah bahkan service_role)
REVOKE UPDATE, DELETE ON audit_logs FROM authenticated;
REVOKE UPDATE, DELETE ON audit_logs FROM service_role;
-- Sudah diimplementasi ✅

-- Level 3: Trigger (mencegah bypass via superuser)
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable. Modification is not allowed.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_update_audit_logs
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
```

**Validasi manual:** Coba `UPDATE audit_logs SET ...` via SQL Editor → harus gagal.

### 3. Menjaga Konteks MVP (Context Drift Prevention)

**Tantangan:** AI lupa batasan MVP setelah banyak interaksi.

**Strategi — Steering Files:**

Buat file `.kiro/steering/mvp-boundaries.md`:
```markdown
---
inclusion: auto
---
# MVP Boundaries — Tax-Ready Payroll

JANGAN implementasi fitur berikut:
- ❌ Integrasi API langsung ke Coretax DJP
- ❌ Transfer bank otomatis (disbursement)
- ❌ Absensi / clock-in / clock-out / cuti
- ❌ Employee Self Service portal
- ❌ Bonus, THR, atau komponen variabel
- ❌ Edge Functions atau serverless backend

Komponen penghasilan HANYA:
- ✅ Gaji Pokok
- ✅ Tunjangan Tetap
- ✅ Uang Lembur (input manual)

Batasan teknis:
- Maksimal 50 karyawan aktif per perusahaan
- Penggajian 1x per bulan
- Semua kalkulasi di client-side (browser)
- 1 akun = 1 perusahaan
```

**Strategi tambahan:**
1. **Checkpoint setiap 5 task** — jalankan test suite, verifikasi tidak ada feature creep
2. **Review setiap PR** — cek apakah ada import ke library yang tidak di-approve
3. **Constant file sebagai single source of truth** — semua batasan ada di `constants.ts`

---

## Ringkasan Strategi per Fase

| Fase | Strategi Utama | Tools |
|------|---------------|-------|
| Database | SQL template yang konsisten, copy-paste pattern RLS | Supabase SQL Editor |
| Auth & RBAC | Permission matrix eksplisit, property test untuk invariant | Vitest + fast-check |
| Kalkulator TER | Tabel tarif sebagai data (bukan hardcode), Math.floor | Seed data + PBT |
| Kalkulator BPJS | Decompose per komponen, ceiling logic terpisah, Math.round | Unit test + PBT |
| Ekspor | Whitelist field yang boleh (4 field saja), test output format | Unit test |
| Enkripsi | Vault untuk key, SECURITY DEFINER, jangan expose key ke client | Manual verification |
| Audit Trail | 3 layer defense (RLS + REVOKE + Trigger) | SQL test manual |
| Context Drift | Steering file auto-include, checkpoint berkala | .kiro/steering/ |

---

## Referensi

- [StaffAny PPh21 Calculation Guide](https://help.staffany.com/en/articles/10717593-pph21-calculation) — Tabel TER lengkap Kategori A/B/C
- [Supabase Vault Documentation](https://supabase.com/blog/supabase-vault) — Key management dengan Vault
- [Supabase Security Best Practices](https://bastion.tech/blog/supabase-security-best-practices) — RLS, key management, production checklist
- [Vibe Coding Advanced Techniques](https://vibecoding.app/blog/how-to-vibe-code-advanced) — Rules files, context engineering
- [Context Window Management](https://www.learn2vibe.com/blog/context-window-management) — Strategi mengatasi keterbatasan context
- [From Vibe Coding to Context Engineering](https://www.sundeepteki.org/blog/from-vibe-coding-to-context-engineering-a-blueprint-for-production-grade-genai-systems) — Blueprint untuk production-grade AI systems

---

*Dokumen ini adalah panduan operasional untuk kamu sebagai "pengemudi AI". Gunakan sebagai checklist sebelum dan sesudah setiap sesi coding dengan AI.*
