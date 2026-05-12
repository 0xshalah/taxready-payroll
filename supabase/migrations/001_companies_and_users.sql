-- Migration: 001_companies_and_users
-- Deskripsi: Membuat tabel companies dan users beserta RLS policies
-- Persyaratan: 7.1, 7.2, 7.3, 9.1

-- ============================================================
-- TABEL: companies
-- ============================================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_perusahaan TEXT NOT NULL,
    npwp_badan TEXT NOT NULL UNIQUE,
    alamat TEXT,
    jkk_risk_class SMALLINT NOT NULL DEFAULT 1 CHECK (jkk_risk_class BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Aktifkan Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy: Semua user yang terkait company bisa SELECT data perusahaannya
CREATE POLICY "companies_select" ON companies
    FOR SELECT USING (
        id IN (SELECT company_id FROM users WHERE id = auth.uid())
    );

-- Policy: Hanya Owner yang bisa UPDATE data perusahaan
CREATE POLICY "companies_update" ON companies
    FOR UPDATE USING (
        id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'owner')
    );

-- ============================================================
-- TABEL: users (RBAC)
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id),
    email TEXT NOT NULL,
    nama TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'hr_staff', 'regular_staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Aktifkan Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: User bisa melihat semua user dalam perusahaan yang sama
CREATE POLICY "users_select_same_company" ON users
    FOR SELECT USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    );

-- Policy: Hanya Owner yang bisa menambahkan user baru ke perusahaannya
CREATE POLICY "users_insert_owner" ON users
    FOR INSERT WITH CHECK (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'owner')
    );

-- Policy: Hanya Owner yang bisa mengubah data user dalam perusahaannya
CREATE POLICY "users_update_owner" ON users
    FOR UPDATE USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'owner')
    );
