-- Migration: 009_fix_functions
-- Perbaikan bug dari verifikasi migrasi 007 + 008

-- ============================================================
-- FIX 1: Aktifkan pgcrypto extension
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- FIX 2: check_user_mfa_status — fix ambiguous column reference
-- ============================================================
DROP FUNCTION IF EXISTS check_user_mfa_status(UUID);

CREATE OR REPLACE FUNCTION check_user_mfa_status(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_mfa BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM auth.mfa_factors f
    WHERE f.user_id = p_user_id
    AND f.status = 'verified'
  ) INTO has_mfa;

  RETURN COALESCE(has_mfa, false);
END;
$$;

GRANT EXECUTE ON FUNCTION check_user_mfa_status(UUID) TO authenticated;

-- ============================================================
-- FIX 3: Trigger enforce_audit_log_user_id
-- Pastikan trigger aktif dan berfungsi
-- ============================================================
DROP TRIGGER IF EXISTS enforce_audit_log_user_id_trigger ON audit_logs;
DROP FUNCTION IF EXISTS enforce_audit_log_user_id();

CREATE OR REPLACE FUNCTION enforce_audit_log_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  actual_company_id UUID;
  actual_role TEXT;
BEGIN
  -- Ambil company_id dan role dari database (tidak dari client)
  SELECT company_id, role INTO actual_company_id, actual_role
  FROM users
  WHERE id = auth.uid();

  -- Override dengan nilai dari database
  NEW.user_id := auth.uid();
  NEW.user_role := COALESCE(actual_role, 'unknown');

  -- Validasi company_id
  IF actual_company_id IS NULL THEN
    RAISE EXCEPTION 'User tidak ditemukan di tabel users';
  END IF;

  IF NEW.company_id != actual_company_id THEN
    RAISE EXCEPTION 'company_id tidak sesuai dengan user yang login';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_audit_log_user_id_trigger
  BEFORE INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION enforce_audit_log_user_id();

-- ============================================================
-- FIX 4: encrypt_value dan decrypt_value menggunakan Vault
-- Pastikan vault extension aktif
-- ============================================================
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- Recreate dengan error handling yang lebih baik
DROP FUNCTION IF EXISTS public.encrypt_value(text);
DROP FUNCTION IF EXISTS public.decrypt_value(text);

CREATE OR REPLACE FUNCTION public.encrypt_value(plain_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
DECLARE
  enc_key TEXT;
  encrypted_data BYTEA;
BEGIN
  -- Coba ambil dari Vault
  BEGIN
    SELECT decrypted_secret INTO enc_key
    FROM vault.decrypted_secrets
    WHERE name = 'employee_encryption_key'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    enc_key := NULL;
  END;

  -- Fallback: jika Vault belum dikonfigurasi, gunakan key dari config
  IF enc_key IS NULL OR enc_key = '' THEN
    RAISE EXCEPTION 'Encryption key tidak ditemukan di Vault. Tambahkan secret "employee_encryption_key" di Supabase Dashboard → Settings → Vault.';
  END IF;

  encrypted_data := pgp_sym_encrypt(plain_text, enc_key);
  RETURN encode(encrypted_data, 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_value(encrypted_data TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
DECLARE
  enc_key TEXT;
  raw_data BYTEA;
BEGIN
  BEGIN
    SELECT decrypted_secret INTO enc_key
    FROM vault.decrypted_secrets
    WHERE name = 'employee_encryption_key'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    enc_key := NULL;
  END;

  IF enc_key IS NULL OR enc_key = '' THEN
    RAISE EXCEPTION 'Encryption key tidak ditemukan di Vault.';
  END IF;

  -- Handle base64 encoded data
  BEGIN
    raw_data := decode(encrypted_data, 'base64');
  EXCEPTION WHEN OTHERS THEN
    -- Fallback untuk data hex lama (\x...)
    raw_data := encrypted_data::BYTEA;
  END;

  RETURN pgp_sym_decrypt(raw_data, enc_key);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.encrypt_value(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrypt_value(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.encrypt_value(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_value(text) TO authenticated;
