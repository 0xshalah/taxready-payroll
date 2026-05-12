-- Migration: 002_employees
-- Deskripsi: Membuat tabel employees dengan enkripsi pgcrypto dan RLS policies
-- Persyaratan: 1.5, 7.2, 8.1, 8.3, 9.2, 9.3

-- ============================================================
-- EXTENSION: pgcrypto
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- TABEL: employees
-- ============================================================
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    nik_encrypted BYTEA NOT NULL,
    nama_lengkap TEXT NOT NULL CHECK (char_length(nama_lengkap) <= 150),
    ptkp_status TEXT NOT NULL CHECK (ptkp_status IN (
        'TK/0', 'TK/1', 'TK/2', 'TK/3',
        'K/0', 'K/1', 'K/2', 'K/3'
    )),
    tanggal_bergabung DATE NOT NULL,
    jabatan TEXT NOT NULL CHECK (char_length(jabatan) <= 100),
    gaji_pokok_encrypted BYTEA NOT NULL,
    tunjangan_tetap NUMERIC(15,0) NOT NULL DEFAULT 0 CHECK (tunjangan_tetap >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- FUNGSI: encrypt_value dan decrypt_value (SECURITY DEFINER)
-- Menggunakan pgp_sym_encrypt/decrypt untuk AES-256 encryption
-- ============================================================
CREATE OR REPLACE FUNCTION encrypt_value(plain_text TEXT, encryption_key TEXT)
RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(plain_text, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_value(encrypted_data BYTEA, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(encrypted_data, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY: employees
-- ============================================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Policy: User bisa melihat karyawan dalam perusahaan yang sama
CREATE POLICY "employees_select" ON employees
    FOR SELECT USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    );

-- Policy: Owner dan HR Staff bisa menambahkan karyawan
CREATE POLICY "employees_insert" ON employees
    FOR INSERT WITH CHECK (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'hr_staff')
    );

-- Policy: Owner dan HR Staff bisa mengubah data karyawan
CREATE POLICY "employees_update" ON employees
    FOR UPDATE USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'hr_staff')
    );

-- Policy: Hanya Owner yang bisa menghapus karyawan
CREATE POLICY "employees_delete" ON employees
    FOR DELETE USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'owner'
    );
