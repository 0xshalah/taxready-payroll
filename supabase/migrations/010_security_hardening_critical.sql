-- Migration: 010_security_hardening_critical
-- Deskripsi: Perbaikan keamanan kritis berdasarkan audit mendalam
-- Tanggal: 2026-05-14
-- Framework: OWASP ASVS v4 + CWE Top 25 + NIST 800-63B + API Security Top 10
--
-- CRITICAL FIXES:
-- 1. Fix RLS payroll_results_select_own - restrict to employee's own records
-- 2. Restrict decrypt_value RPC - create role-specific wrapper
-- 3. Add employee_user_id mapping for proper isolation
-- 4. Add rate limiting table for API abuse prevention

-- ============================================================
-- FIX 1: Add user_id to payroll_results for proper isolation
-- ============================================================

-- Add user_id column to payroll_results (nullable for backward compat)
ALTER TABLE payroll_results ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_payroll_results_user_id ON payroll_results(user_id);

-- ============================================================
-- FIX 2: Fix RLS policy for regular_staff
-- Regular staff should ONLY see their own payroll results
-- ============================================================

DROP POLICY IF EXISTS "payroll_results_select_own" ON payroll_results;

-- New strict policy: regular_staff can only read their own records
CREATE POLICY "payroll_results_select_own" ON payroll_results
    FOR SELECT USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'regular_staff'
        AND user_id = auth.uid()
    );

-- ============================================================
-- FIX 3: Restrict decrypt_value RPC
-- Create role-specific wrapper that enforces authorization
-- ============================================================

-- Revoke direct access to decrypt_value from all authenticated users
REVOKE EXECUTE ON FUNCTION public.decrypt_value(text) FROM authenticated;

-- Create secure wrapper for employee data decryption
-- Only allows decryption if user has permission to access the employee record
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
BEGIN
    -- Get current user's company and role
    SELECT company_id, role INTO user_company_id, user_role
    FROM users
    WHERE id = auth.uid();

    IF user_company_id IS NULL THEN
        RAISE EXCEPTION 'User not found or not authenticated';
    END IF;

    -- Get employee's company
    SELECT company_id INTO employee_company_id
    FROM employees
    WHERE id = employee_id_param;

    IF employee_company_id IS NULL THEN
        RAISE EXCEPTION 'Employee not found';
    END IF;

    -- Check authorization: same company + appropriate role
    IF employee_company_id != user_company_id THEN
        RAISE EXCEPTION 'Access denied: employee belongs to different company';
    END IF;

    -- Regular staff cannot decrypt employee data (even their own - use masked display)
    IF user_role = 'regular_staff' THEN
        RAISE EXCEPTION 'Access denied: insufficient privileges';
    END IF;

    -- Owner and HR staff can decrypt
    IF user_role NOT IN ('owner', 'hr_staff') THEN
        RAISE EXCEPTION 'Access denied: invalid role';
    END IF;

    -- Perform decryption using the original function
    RETURN decrypt_value(encrypted_data);
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrypt_employee_field(UUID, TEXT) TO authenticated;

-- ============================================================
-- FIX 4: Create rate limiting infrastructure
-- ============================================================

CREATE TABLE IF NOT EXISTS api_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    endpoint TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_endpoint_window UNIQUE (user_id, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON api_rate_limits(user_id, endpoint, window_start);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_endpoint TEXT,
    p_max_requests INTEGER,
    p_window_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_count INTEGER;
    window_start_time TIMESTAMPTZ;
BEGIN
    window_start_time := date_trunc('minute', now()) - (EXTRACT(MINUTE FROM now())::INTEGER % p_window_minutes || ' minutes')::INTERVAL;

    -- Get current count for this window
    SELECT request_count INTO current_count
    FROM api_rate_limits
    WHERE user_id = auth.uid()
    AND endpoint = p_endpoint
    AND window_start = window_start_time;

    IF current_count IS NULL THEN
        -- First request in this window
        INSERT INTO api_rate_limits (user_id, endpoint, request_count, window_start)
        VALUES (auth.uid(), p_endpoint, 1, window_start_time)
        ON CONFLICT (user_id, endpoint, window_start)
        DO UPDATE SET request_count = api_rate_limits.request_count + 1;
        RETURN TRUE;
    ELSIF current_count < p_max_requests THEN
        -- Increment counter
        UPDATE api_rate_limits
        SET request_count = request_count + 1
        WHERE user_id = auth.uid()
        AND endpoint = p_endpoint
        AND window_start = window_start_time;
        RETURN TRUE;
    ELSE
        -- Rate limit exceeded
        RETURN FALSE;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, INTEGER, INTEGER) TO authenticated;

-- ============================================================
-- FIX 5: Add trigger to auto-populate user_id in payroll_results
-- ============================================================

CREATE OR REPLACE FUNCTION set_payroll_result_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Try to find user_id from users table where id matches employee_id
    -- This assumes employee_id in payroll_results corresponds to a user.id
    -- If employee is not a user (no login), user_id stays NULL
    SELECT id INTO NEW.user_id
    FROM users
    WHERE id = NEW.employee_id
    AND company_id = NEW.company_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_payroll_user_id_trigger ON payroll_results;

CREATE TRIGGER set_payroll_user_id_trigger
    BEFORE INSERT ON payroll_results
    FOR EACH ROW
    EXECUTE FUNCTION set_payroll_result_user_id();

-- ============================================================
-- FIX 6: Add ptkp_status column to payroll_results (if missing)
-- Already exists from previous migrations, but ensure it's there
-- ============================================================

ALTER TABLE payroll_results ADD COLUMN IF NOT EXISTS ptkp_status TEXT;

-- ============================================================
-- FIX 7: Create audit log for decrypt operations
-- ============================================================

CREATE TABLE IF NOT EXISTS decrypt_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    field_name TEXT NOT NULL,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address INET
);

CREATE INDEX IF NOT EXISTS idx_decrypt_audit_user ON decrypt_audit_logs(user_id, accessed_at);
CREATE INDEX IF NOT EXISTS idx_decrypt_audit_employee ON decrypt_audit_logs(employee_id, accessed_at);

-- Enable RLS on decrypt_audit_logs
ALTER TABLE decrypt_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only owner can read decrypt audit logs
CREATE POLICY "decrypt_audit_select_owner" ON decrypt_audit_logs
    FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE company_id = (SELECT company_id FROM users WHERE id = auth.uid()) AND role = 'owner')
    );

-- All authenticated users can insert (for logging their own access)
CREATE POLICY "decrypt_audit_insert" ON decrypt_audit_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Make decrypt_audit_logs immutable
REVOKE UPDATE, DELETE ON decrypt_audit_logs FROM authenticated;
REVOKE UPDATE, DELETE ON decrypt_audit_logs FROM service_role;

-- ============================================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================================

-- Verify RLS is enabled on all critical tables
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;

-- Verify decrypt_value is not directly callable
-- SELECT has_function_privilege('authenticated', 'decrypt_value(text)', 'EXECUTE');

-- Verify rate limit table exists
-- SELECT COUNT(*) FROM api_rate_limits;
