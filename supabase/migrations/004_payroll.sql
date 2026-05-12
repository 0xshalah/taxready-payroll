-- Migration: 004_payroll
-- Deskripsi: Membuat tabel payroll_periods dan payroll_records beserta RLS policies
-- Persyaratan: 4.1, 4.2, 11.2

-- ============================================================
-- TABEL: payroll_periods
-- ============================================================
CREATE TABLE payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year SMALLINT NOT NULL CHECK (year >= 2024),
    status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'overwritten')),
    processed_by UUID NOT NULL REFERENCES users(id),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- UNIQUE constraint: satu periode per perusahaan per bulan/tahun
    CONSTRAINT unique_period_per_company UNIQUE (company_id, month, year)
);

-- Aktifkan Row Level Security
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;

-- Policy: User bisa melihat periode penggajian perusahaannya sendiri
CREATE POLICY "payroll_periods_select" ON payroll_periods
    FOR SELECT USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    );

-- Policy: Owner dan HR Staff bisa membuat periode penggajian baru
CREATE POLICY "payroll_periods_insert" ON payroll_periods
    FOR INSERT WITH CHECK (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'hr_staff')
    );

-- Policy: Owner dan HR Staff bisa mengupdate periode (untuk overwrite)
CREATE POLICY "payroll_periods_update" ON payroll_periods
    FOR UPDATE USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'hr_staff')
    );

-- ============================================================
-- TABEL: payroll_records
-- ============================================================
CREATE TABLE payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    period_id UUID NOT NULL REFERENCES payroll_periods(id),
    -- Komponen penghasilan
    gaji_pokok NUMERIC(15,0) NOT NULL,
    tunjangan_tetap NUMERIC(15,0) NOT NULL DEFAULT 0,
    uang_lembur NUMERIC(15,0) NOT NULL DEFAULT 0,
    gross_income NUMERIC(15,0) NOT NULL,
    -- Potongan PPh 21
    pph21 NUMERIC(15,0) NOT NULL DEFAULT 0,
    -- Potongan BPJS bagian karyawan
    bpjs_kes_employee NUMERIC(15,0) NOT NULL DEFAULT 0,
    bpjs_jht_employee NUMERIC(15,0) NOT NULL DEFAULT 0,
    bpjs_jp_employee NUMERIC(15,0) NOT NULL DEFAULT 0,
    -- Kontribusi BPJS bagian pemberi kerja
    bpjs_kes_employer NUMERIC(15,0) NOT NULL DEFAULT 0,
    bpjs_jht_employer NUMERIC(15,0) NOT NULL DEFAULT 0,
    bpjs_jp_employer NUMERIC(15,0) NOT NULL DEFAULT 0,
    bpjs_jkm_employer NUMERIC(15,0) NOT NULL DEFAULT 0,
    bpjs_jkk_employer NUMERIC(15,0) NOT NULL DEFAULT 0,
    bpjs_jkp_employer NUMERIC(15,0) NOT NULL DEFAULT 0,
    -- Total dan gaji bersih
    total_deductions NUMERIC(15,0) NOT NULL,
    net_pay NUMERIC(15,0) NOT NULL,
    -- Status perhitungan
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'warning', 'failed')),
    warning_message TEXT,
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Aktifkan Row Level Security
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;

-- Policy: User bisa melihat record penggajian perusahaannya sendiri
CREATE POLICY "payroll_records_select" ON payroll_records
    FOR SELECT USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    );

-- Policy: Owner dan HR Staff bisa membuat record penggajian
CREATE POLICY "payroll_records_insert" ON payroll_records
    FOR INSERT WITH CHECK (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'hr_staff')
    );
