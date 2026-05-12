-- Migration: 005_audit_logs
-- Deskripsi: Membuat tabel audit_logs (immutable) beserta RLS policies
-- Persyaratan: 10.1, 10.2, 10.3

-- ============================================================
-- TABEL: audit_logs (IMMUTABLE)
-- ============================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    user_id UUID NOT NULL REFERENCES users(id),
    user_role TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'payroll_process',
        'employee_create',
        'employee_update',
        'employee_delete',
        'salary_change',
        'export_document',
        'settings_change',
        'role_change',
        'unauthorized_access'
    )),
    entity_type TEXT NOT NULL,
    entity_id UUID,
    changes JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index untuk performa query filter
CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Hanya Owner yang bisa membaca audit logs perusahaannya
CREATE POLICY "audit_logs_select_owner" ON audit_logs
    FOR SELECT USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'owner'
    );

-- Policy: User yang terautentikasi bisa INSERT audit log untuk perusahaannya sendiri
CREATE POLICY "audit_logs_insert" ON audit_logs
    FOR INSERT WITH CHECK (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    );

-- ============================================================
-- IMMUTABILITY: REVOKE UPDATE dan DELETE
-- Tidak ada policy UPDATE/DELETE = immutable via RLS
-- Tambahan: revoke UPDATE/DELETE dari semua roles untuk keamanan berlapis
-- ============================================================
REVOKE UPDATE, DELETE ON audit_logs FROM authenticated;
REVOKE UPDATE, DELETE ON audit_logs FROM service_role;
