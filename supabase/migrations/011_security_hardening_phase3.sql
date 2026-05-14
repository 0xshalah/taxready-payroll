-- Migration: 011_security_hardening_phase3
-- Deskripsi: Perbaikan keamanan kritis berdasarkan audit mendalam 2026-05-15
-- Framework: OWASP ASVS v4 + CWE Top 25 + NIST 800-63B + Payroll Security Best Practices

-- ============================================================
-- STEP 1: Buat tabel yang dibutuhkan dulu
-- ============================================================

-- Tabel untuk audit log dekripsi data sensitif
CREATE TABLE IF NOT EXISTS decrypt_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    employee_id UUID NOT NULL,
    field_name TEXT NOT NULL DEFAULT 'encrypted_field',
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decrypt_audit_user ON decrypt_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_decrypt_audit_employee ON decrypt_audit_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_decrypt_audit_time ON decrypt_audit_logs(accessed_at);

-- ============================================================
-- STEP 2: RLS pada decrypt_audit_logs
-- ============================================================

ALTER TABLE decrypt_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "decrypt_audit_select_owner" ON decrypt_audit_logs;
DROP POLICY IF EXISTS "decrypt_audit_insert" ON decrypt_audit_logs;

CREATE POLICY "decrypt_audit_select_owner" ON decrypt_audit_logs
    FOR SELECT USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'owner'
        AND user_id IN (
            SELECT id FROM users
            WHERE company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "decrypt_audit_insert" ON decrypt_audit_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

REVOKE UPDATE, DELETE ON decrypt_audit_logs FROM authenticated;
REVOKE UPDATE, DELETE ON decrypt_audit_logs FROM anon;

-- ============================================================
-- STEP 3: Trigger mencegah soft-delete oleh non-Owner
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_unauthorized_soft_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = auth.uid();

  IF (NEW.is_active IS DISTINCT FROM OLD.is_active OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at) THEN
    IF user_role != 'owner' THEN
      RAISE EXCEPTION 'Hanya Owner yang dapat menonaktifkan atau menghapus karyawan';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_unauthorized_soft_delete_trigger ON employees;

CREATE TRIGGER prevent_unauthorized_soft_delete_trigger
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION prevent_unauthorized_soft_delete();

-- ============================================================
-- STEP 4: soft_delete_employee dengan audit log
-- ============================================================

CREATE OR REPLACE FUNCTION soft_delete_employee(employee_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  emp_name TEXT;
  emp_company_id UUID;
  user_company_id UUID;
  user_role TEXT;
BEGIN
  SELECT company_id, role INTO user_company_id, user_role
  FROM users WHERE id = auth.uid();

  IF user_company_id IS NULL THEN
    RAISE EXCEPTION 'User tidak ditemukan atau tidak terautentikasi';
  END IF;

  IF user_role != 'owner' THEN
    RAISE EXCEPTION 'Hanya Owner yang dapat menghapus karyawan';
  END IF;

  SELECT nama_lengkap, company_id INTO emp_name, emp_company_id
  FROM employees WHERE id = employee_id;

  IF emp_company_id IS NULL THEN
    RAISE EXCEPTION 'Karyawan tidak ditemukan';
  END IF;

  IF emp_company_id != user_company_id THEN
    RAISE EXCEPTION 'Tidak memiliki izin untuk menghapus karyawan ini';
  END IF;

  UPDATE employees
  SET is_active = false, deleted_at = now(), updated_at = now()
  WHERE id = employee_id;

  INSERT INTO audit_logs (company_id, user_id, user_role, action_type, entity_type, entity_id, changes)
  VALUES (
    user_company_id, auth.uid(), user_role, 'employee_delete', 'employee', employee_id,
    jsonb_build_object('employee_name', emp_name, 'timestamp', now())
  );
END;
$$;

GRANT EXECUTE ON FUNCTION soft_delete_employee(UUID) TO authenticated;

-- ============================================================
-- STEP 5: decrypt_employee_field — dekripsi dengan authz + audit
-- ============================================================

CREATE OR REPLACE FUNCTION public.decrypt_employee_field(
    employee_id_param UUID,
    encrypted_data TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
DECLARE
    user_company_id UUID;
    user_role TEXT;
    employee_company_id UUID;
    decrypted_result TEXT;
BEGIN
    SELECT company_id, role INTO user_company_id, user_role
    FROM users WHERE id = auth.uid();

    IF user_company_id IS NULL THEN
        RAISE EXCEPTION 'User not found or not authenticated';
    END IF;

    SELECT company_id INTO employee_company_id
    FROM employees WHERE id = employee_id_param;

    IF employee_company_id IS NULL THEN
        RAISE EXCEPTION 'Employee not found';
    END IF;

    IF employee_company_id != user_company_id THEN
        RAISE EXCEPTION 'Access denied: employee belongs to different company';
    END IF;

    IF user_role = 'regular_staff' THEN
        RAISE EXCEPTION 'Access denied: insufficient privileges';
    END IF;

    IF user_role NOT IN ('owner', 'hr_staff') THEN
        RAISE EXCEPTION 'Access denied: invalid role';
    END IF;

    decrypted_result := decrypt_value(encrypted_data);

    INSERT INTO decrypt_audit_logs (user_id, employee_id, field_name, accessed_at)
    VALUES (auth.uid(), employee_id_param, 'encrypted_field', now());

    RETURN decrypted_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrypt_employee_field(UUID, TEXT) TO authenticated;
