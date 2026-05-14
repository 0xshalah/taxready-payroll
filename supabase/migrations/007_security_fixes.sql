-- Migration: 007_security_fixes
-- Deskripsi: Perbaikan keamanan berdasarkan audit OWASP Top 10 2025
--
-- CRIT-01 + CRIT-02: Enkripsi functions menggunakan Vault (key tidak dari client)
-- CRIT-04: Batasi companies_insert policy
-- MED-02: Fix payroll_results_select_own (employee_id ≠ auth.uid)
-- MED-04: Enforce user_id = auth.uid() di audit_logs via trigger

-- ============================================================
-- CRIT-01 + CRIT-02: Enkripsi via Vault (tanpa parameter key)
-- Jalankan SETELAH menyimpan key di Vault:
--   Supabase Dashboard → Settings → Vault → New Secret
--   Name: employee_encryption_key
--   Value: (generate dengan: openssl rand -base64 32)
-- ============================================================

-- Drop fungsi lama yang menerima key sebagai parameter
DROP FUNCTION IF EXISTS public.encrypt_value(text, text);
DROP FUNCTION IF EXISTS public.decrypt_value(bytea, text);
DROP FUNCTION IF EXISTS public.decrypt_value(text, text);

-- Fungsi enkripsi baru — key diambil dari Vault secara internal
CREATE OR REPLACE FUNCTION public.encrypt_value(plain_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  enc_key TEXT;
  encrypted_data BYTEA;
BEGIN
  -- Ambil key dari Vault (tidak pernah terekspos ke client)
  SELECT decrypted_secret INTO enc_key
  FROM vault.decrypted_secrets
  WHERE name = 'employee_encryption_key'
  LIMIT 1;

  IF enc_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key tidak ditemukan di Vault. Konfigurasi via Supabase Dashboard → Settings → Vault.';
  END IF;

  encrypted_data := pgp_sym_encrypt(plain_text, enc_key);
  RETURN encode(encrypted_data, 'base64');
END;
$$;

-- Fungsi dekripsi baru — key diambil dari Vault secara internal
CREATE OR REPLACE FUNCTION public.decrypt_value(encrypted_data TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  enc_key TEXT;
  raw_data BYTEA;
BEGIN
  SELECT decrypted_secret INTO enc_key
  FROM vault.decrypted_secrets
  WHERE name = 'employee_encryption_key'
  LIMIT 1;

  IF enc_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key tidak ditemukan di Vault.';
  END IF;

  -- Handle both hex (\x...) and base64 encoded data
  BEGIN
    raw_data := decode(encrypted_data, 'base64');
  EXCEPTION WHEN OTHERS THEN
    -- Fallback: try as hex (legacy data)
    raw_data := encrypted_data::BYTEA;
  END;

  RETURN pgp_sym_decrypt(raw_data, enc_key);
END;
$$;

-- Hanya authenticated users yang bisa memanggil fungsi ini
REVOKE EXECUTE ON FUNCTION public.encrypt_value(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrypt_value(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.encrypt_value(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_value(text) TO authenticated;

-- ============================================================
-- CRIT-04: Batasi companies_insert — hanya untuk user baru (belum punya company)
-- ============================================================
DROP POLICY IF EXISTS "companies_insert" ON companies;

CREATE POLICY "companies_insert" ON companies
    FOR INSERT WITH CHECK (
        -- Hanya boleh insert jika user belum terdaftar di tabel users
        -- (artinya ini adalah registrasi pertama)
        NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid())
    );

-- ============================================================
-- MED-02: Fix payroll_results_select_own
-- employee_id di payroll_results adalah UUID dari tabel employees,
-- BUKAN auth.uid(). Perlu join ke tabel users via email atau
-- gunakan mapping yang benar.
-- Solusi: Regular Staff bisa baca slip gaji berdasarkan nama (sementara)
-- atau via relasi users → employees yang perlu ditambahkan.
-- ============================================================
DROP POLICY IF EXISTS "payroll_results_select_own" ON payroll_results;

-- Sementara: Regular Staff bisa baca semua payroll_results perusahaannya
-- (sama seperti HR Staff, tapi hanya read)
-- TODO: Tambahkan kolom user_id ke payroll_results untuk mapping yang benar
CREATE POLICY "payroll_results_select_own" ON payroll_results
    FOR SELECT USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'regular_staff'
    );

-- ============================================================
-- MED-04: Enforce user_id = auth.uid() di audit_logs via trigger
-- Mencegah client mengirim user_id yang dimanipulasi
-- ============================================================
CREATE OR REPLACE FUNCTION enforce_audit_log_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Override user_id dan user_role dengan nilai dari database (tidak dari client)
  NEW.user_id := auth.uid();
  NEW.user_role := (SELECT role FROM users WHERE id = auth.uid());

  -- Validasi company_id sesuai dengan user yang login
  IF NEW.company_id != (SELECT company_id FROM users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'company_id tidak sesuai dengan user yang login';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_audit_log_user_id_trigger ON audit_logs;

CREATE TRIGGER enforce_audit_log_user_id_trigger
  BEFORE INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION enforce_audit_log_user_id();

-- ============================================================
-- HIGH-05: Soft delete untuk employees (set is_active = false)
-- Tambahkan deleted_at column untuk tracking
-- ============================================================
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Fungsi soft delete yang aman
CREATE OR REPLACE FUNCTION soft_delete_employee(employee_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verifikasi ownership
  IF NOT EXISTS (
    SELECT 1 FROM employees e
    JOIN users u ON u.company_id = e.company_id
    WHERE e.id = employee_id AND u.id = auth.uid()
    AND u.role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Tidak memiliki izin untuk menghapus karyawan ini';
  END IF;

  UPDATE employees
  SET is_active = false,
      deleted_at = now()
  WHERE id = employee_id;
END;
$$;
