-- Migration: 008_security_hardening_2
-- Deskripsi: Perbaikan keamanan lanjutan berdasarkan audit mendalam
-- Framework: OWASP Top 10 2025 + CWE/SANS Top 25 + Supabase Security Research
--
-- MED-NEW-03: Optimasi RLS policy performance (N+1 subquery)
-- CRIT-NEW-01: Enable MFA enforcement untuk Owner dan HR Staff
-- HIGH-NEW-02: Verifikasi semua tabel punya RLS enabled

-- ============================================================
-- MED-NEW-03: Optimasi RLS dengan index yang tepat
-- Subquery (SELECT company_id FROM users WHERE id = auth.uid())
-- dieksekusi per-row. Index ini memastikan lookup cepat.
-- ============================================================

-- Index untuk RLS policy lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON users(id);
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_user ON audit_logs(company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_results_company_period ON payroll_results(company_id, period);

-- ============================================================
-- HIGH-NEW-02: Verifikasi RLS pada semua tabel
-- Jalankan query ini untuk cek tabel yang belum punya RLS:
-- SELECT tablename FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename NOT IN (
--   SELECT relname FROM pg_class
--   WHERE relrowsecurity = true
-- );
-- ============================================================

-- Pastikan semua tabel punya RLS (idempotent)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_results ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CRIT-NEW-01: MFA Enforcement
-- Supabase tidak mendukung enforce MFA via SQL langsung,
-- tapi kita bisa membuat fungsi helper untuk cek MFA status
-- dan mencatat di audit log jika user login tanpa MFA.
-- ============================================================

-- Fungsi untuk cek apakah user sudah setup MFA
-- (Digunakan oleh aplikasi untuk menampilkan warning)
CREATE OR REPLACE FUNCTION check_user_mfa_status(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_mfa BOOLEAN;
BEGIN
  -- Cek apakah user punya factor MFA yang verified
  SELECT EXISTS (
    SELECT 1
    FROM auth.mfa_factors
    WHERE user_id = check_user_mfa_status.user_id
    AND status = 'verified'
  ) INTO has_mfa;

  RETURN has_mfa;
END;
$$;

GRANT EXECUTE ON FUNCTION check_user_mfa_status(UUID) TO authenticated;

-- ============================================================
-- Tambahan: Constraint untuk mencegah spam payroll processing
-- Rate limiting: max 1 proses per company per periode per menit
-- ============================================================
CREATE OR REPLACE FUNCTION check_payroll_rate_limit(p_company_id UUID, p_period TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM audit_logs
  WHERE company_id = p_company_id
  AND action_type = 'payroll_process'
  AND changes->>'period' = p_period
  AND created_at > NOW() - INTERVAL '1 minute';

  -- Izinkan jika belum ada proses dalam 1 menit terakhir untuk periode ini
  RETURN recent_count = 0;
END;
$$;

GRANT EXECUTE ON FUNCTION check_payroll_rate_limit(UUID, TEXT) TO authenticated;
