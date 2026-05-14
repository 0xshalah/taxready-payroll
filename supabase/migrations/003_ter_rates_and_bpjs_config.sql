-- Migration: 003_ter_rates_and_bpjs_config
-- Deskripsi: Membuat tabel ter_rates dan bpjs_config beserta RLS policies
-- Persyaratan: 2.8, 3.5, 3.7

-- ============================================================
-- TABEL: ter_rates (Konfigurasi Tarif TER)
-- ============================================================
CREATE TABLE ter_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    category TEXT NOT NULL CHECK (category IN ('A', 'B', 'C')),
    lower_bound NUMERIC(15,0) NOT NULL CHECK (lower_bound >= 0),
    upper_bound NUMERIC(15,0) NOT NULL CHECK (upper_bound > 0),
    rate_percent NUMERIC(5,2) NOT NULL CHECK (rate_percent >= 0 AND rate_percent <= 100),
    CONSTRAINT valid_range CHECK (upper_bound > lower_bound)
);

-- Aktifkan Row Level Security
ALTER TABLE ter_rates ENABLE ROW LEVEL SECURITY;

-- Policy: User bisa melihat tarif TER perusahaannya sendiri
CREATE POLICY "ter_rates_select" ON ter_rates
    FOR SELECT USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    );

-- Policy: Hanya Owner yang bisa mengelola (INSERT/UPDATE/DELETE) tarif TER
CREATE POLICY "ter_rates_manage_owner" ON ter_rates
    FOR ALL USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'owner'
    );

-- ============================================================
-- TABEL: bpjs_config (Konfigurasi Tarif BPJS)
-- ============================================================
CREATE TABLE bpjs_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) UNIQUE,
    -- Tarif JHT (Jaminan Hari Tua)
    jht_employer_rate NUMERIC(5,2) NOT NULL DEFAULT 3.70,
    jht_employee_rate NUMERIC(5,2) NOT NULL DEFAULT 2.00,
    -- Tarif JP (Jaminan Pensiun)
    jp_employer_rate NUMERIC(5,2) NOT NULL DEFAULT 2.00,
    jp_employee_rate NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    -- Tarif JKM (Jaminan Kematian)
    jkm_employer_rate NUMERIC(5,2) NOT NULL DEFAULT 0.30,
    -- Tarif JKK (Jaminan Kecelakaan Kerja) - rentang 0.24% - 1.74% sesuai kelas risiko
    jkk_rate NUMERIC(5,2) NOT NULL DEFAULT 0.24 CHECK (jkk_rate BETWEEN 0.24 AND 1.74),
    -- Tarif JKP (Jaminan Kehilangan Pekerjaan)
    jkp_employer_rate NUMERIC(5,2) NOT NULL DEFAULT 0.36,
    -- Tarif BPJS Kesehatan
    kes_employer_rate NUMERIC(5,2) NOT NULL DEFAULT 4.00,
    kes_employee_rate NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    -- Batas atas upah (ceiling)
    jp_wage_ceiling NUMERIC(15,0) NOT NULL DEFAULT 10042300,
    kes_wage_ceiling NUMERIC(15,0) NOT NULL DEFAULT 12000000,
    -- Periode diskon JKK 50% (Jan-Jun 2026)
    jkk_discount_start DATE DEFAULT '2026-01-01',
    jkk_discount_end DATE DEFAULT '2026-06-30',
    -- Metadata
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Aktifkan Row Level Security
ALTER TABLE bpjs_config ENABLE ROW LEVEL SECURITY;

-- Policy: User bisa melihat konfigurasi BPJS perusahaannya sendiri
CREATE POLICY "bpjs_config_select" ON bpjs_config
    FOR SELECT USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    );

-- Policy: Hanya Owner yang bisa mengubah konfigurasi BPJS
CREATE POLICY "bpjs_config_update_owner" ON bpjs_config
    FOR UPDATE USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'owner'
    );
