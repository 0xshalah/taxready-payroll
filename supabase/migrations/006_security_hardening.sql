-- Migration: 006_security_hardening
-- Deskripsi: Perbaikan keamanan post-audit
-- 1. HR Staff bisa baca audit_logs untuk settings_change (Changelog Tarif)
-- 2. Unique constraint pada payroll period per company (anti-spam)
-- 3. Tabel payroll_results dengan RLS

-- ============================================================
-- FIX #1: HR Staff bisa baca audit_logs (hanya settings_change)
-- Untuk fitur Changelog Tarif yang accessible oleh HR Staff
-- ============================================================
CREATE POLICY "audit_logs_select_hr_settings" ON audit_logs
    FOR SELECT USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'hr_staff'
        AND action_type = 'settings_change'
    );

-- ============================================================
-- FIX #3: Tabel payroll_results untuk menyimpan detail per karyawan
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    period TEXT NOT NULL, -- format: "2026-05"
    employee_id UUID NOT NULL,
    nama TEXT NOT NULL,
    gaji_pokok NUMERIC(15,0) NOT NULL DEFAULT 0,
    tunjangan_tetap NUMERIC(15,0) NOT NULL DEFAULT 0,
    uang_lembur NUMERIC(15,0) NOT NULL DEFAULT 0,
    gross_income NUMERIC(15,0) NOT NULL DEFAULT 0,
    pph21 NUMERIC(15,0) NOT NULL DEFAULT 0,
    bpjs_employee_total NUMERIC(15,0) NOT NULL DEFAULT 0,
    bpjs_employer_total NUMERIC(15,0) NOT NULL DEFAULT 0,
    total_deductions NUMERIC(15,0) NOT NULL DEFAULT 0,
    net_pay NUMERIC(15,0) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'warning', 'failed')),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: satu karyawan hanya punya satu hasil per periode per company
CREATE UNIQUE INDEX IF NOT EXISTS idx_payroll_results_unique
    ON payroll_results(company_id, period, employee_id);

-- Index untuk query performa
CREATE INDEX IF NOT EXISTS idx_payroll_results_company_period
    ON payroll_results(company_id, period);

-- RLS pada payroll_results
ALTER TABLE payroll_results ENABLE ROW LEVEL SECURITY;

-- Owner dan HR Staff bisa baca hasil payroll perusahaannya
CREATE POLICY "payroll_results_select" ON payroll_results
    FOR SELECT USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'hr_staff')
    );

-- Owner dan HR Staff bisa insert hasil payroll
CREATE POLICY "payroll_results_insert" ON payroll_results
    FOR INSERT WITH CHECK (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'hr_staff')
    );

-- Owner dan HR Staff bisa delete (untuk overwrite periode)
CREATE POLICY "payroll_results_delete" ON payroll_results
    FOR DELETE USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'hr_staff')
    );

-- Regular Staff bisa baca HANYA hasil miliknya sendiri (untuk slip gaji)
CREATE POLICY "payroll_results_select_own" ON payroll_results
    FOR SELECT USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'regular_staff'
        AND employee_id = auth.uid()
    );
