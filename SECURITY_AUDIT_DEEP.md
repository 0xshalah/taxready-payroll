# Deep Security Audit Report — Tax-Ready Payroll
**Date:** 2026-05-15  
**Scope:** Full-stack SPA + Supabase BaaS + Edge Functions  
**Frameworks:** OWASP ASVS v4, OWASP API Security Top 10, CWE/SANS Top 25, NIST 800-63B, PCI DSS v4.0, UU PDP No. 27/2022, SaaS Security Checklist 2026, Payroll Security Best Practices 2026  

---

## EXECUTIVE SUMMARY

| Metric | Result |
|--------|--------|
| **Total Findings** | 18 |
| **Critical** | 1 |
| **High** | 4 |
| **Medium** | 8 |
| **Low/Info** | 5 |
| **npm audit (high+)** | 0 vulnerabilities |
| **TypeScript strict** | Passes (tsc --noEmit) |
| **ESLint** | Config missing (not runnable) |

**Overall posture:** Above average for an MVP. Strong defense-in-depth (RLS + RBAC + Zod + Vault encryption + immutable audit logs). Several payroll-specific gaps and one critical bypass in soft-delete authorization.

---

## CRITICAL FINDINGS

### C-01: HR Staff Can Soft-Delete Employees via Direct Update (RLS Bypass)

**File:** `src/features/employees/hooks/useEmployees.ts:209-221`  
**RLS Policy:** `supabase/migrations/002_employees.sql:68-72` (`employees_update`)  
**Severity:** **CRITICAL**  
**Reference:** OWASP API Security Top 10 #1 (Broken Object Level Authorization), CWE-284 (Improper Access Control)

**Issue:** The `deleteEmployee()` function uses `supabase.from('employees').update({ is_active: false, deleted_at: ... })` which is gated by the `employees_update` RLS policy. This policy allows **both Owner AND HR Staff** to update employees. The dedicated `soft_delete_employee()` RPC function (in `007_security_fixes.sql:154-175`) has an explicit Owner-only check, but the client-side code bypasses it entirely.

```
Client → UPDATE employees SET is_active=false → RLS allows HR Staff → Employee deactivated
```

The intended design (per migration 007) is that only Owner can soft-delete. HR Staff can exploit this to deactivate employees without authorization.

**Impact:** HR Staff can permanently deactivate employees without Owner approval. No audit trail via `logEmployeeChange` with `employee_delete` action type is generated for this path (the client-side code calls the delete function without logging).

**Fix:**
1. Change `deleteEmployee()` to call `soft_delete_employee` RPC instead of direct update
2. OR tighten `employees_update` RLS to exclude `is_active` and `deleted_at` columns for HR Staff
3. OR remove the `deleteEmployee` function and use RPC exclusively

```sql
-- Option 2: Column-level RLS (requires Supabase column permissions)
REVOKE UPDATE (is_active, deleted_at) ON employees FROM authenticated;
-- And create a separate RPC for soft-delete that Owner-only can call
```

---

## HIGH FINDINGS

### H-01: Edge Function CORS Allows Any Origin

**File:** `supabase/functions/send-email/index.ts:21-23`  
**Severity:** **HIGH**  
**Reference:** OWASP API Security Top 10 #6 (Unrestricted Access to Sensitive Business Flows), CWE-942 (Permissive Cross-domain Policy with Untrusted Domains)

**Issue:** The Edge Function sets `Access-Control-Allow-Origin: '*'` with a TODO comment. While JWT verification prevents unauthorized access, permissive CORS enables:
- Pre-flight requests from any domain
- CSRF-like attack surface (though mitigated by JWT)
- Information leakage about endpoint existence

**Fix:**
```ts
const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://taxready.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### H-02: MFA Not Enforced for Privileged Accounts

**Files:** `supabase/migrations/008_security_hardening_2.sql:40-68`, `src/features/auth/context/AuthContext.tsx`  
**Severity:** **HIGH**  
**Reference:** NIST 800-63B (AAL2/AAL3), OWASP ASVS V2 (Authentication), Payroll Security Best Practices 2026

**Issue:** The `check_user_mfa_status()` function exists but is **never called** in the auth flow. Owner and HR Staff accounts (which can process payroll, export sensitive data, and change settings) can operate without MFA.

Payroll industry recommendations (Cintriq 2026, Securafy 2025, Zellis 2026) all emphasize MFA enforcement as the #1 defense against credential theft.

**Fix:**
```tsx
// In AuthContext.tsx, after login:
const mfaStatus = await supabase.rpc('check_user_mfa_status', { p_user_id: user.id });
if (!mfaStatus && user.role !== 'regular_staff') {
  // Force MFA enrollment or show warning
  // Consider blocking high-risk actions until MFA is enabled
}
```

### H-03: Rate Limiting Bypass via Direct Table Access

**File:** `supabase/migrations/010_security_hardening_critical.sql:105-162`  
**Severity:** **HIGH**  
**Reference:** OWASP API Security Top 10 #4 (Rate Limiting), CWE-799 (Improper Control of Interaction Frequency)

**Issue:** The `check_rate_limit()` RPC checks and increments `api_rate_limits` table. However, the `api_rate_limits` table has **no RLS policy** that prevents direct inserts/updates. A malicious user could:
1. Call `check_rate_limit` legitimately (uses SECURITY DEFINER)
2. OR directly `INSERT INTO api_rate_limits` to exhaust quota
3. OR `DELETE FROM api_rate_limits` to reset their own rate limit

```sql
-- Missing RLS:
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
-- Policy: users can only see/manipulate their own rows
CREATE POLICY "rate_limit_own" ON api_rate_limits
  FOR ALL USING (user_id = auth.uid());
```

**Fix:**
```sql
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rate_limit_select_own" ON api_rate_limits
  FOR SELECT USING (user_id = auth.uid());
REVOKE INSERT, UPDATE, DELETE ON api_rate_limits FROM authenticated;
-- Only the SECURITY DEFINER RPC should modify this table
```

### H-04: Regular Staff Triggers Decryption of All Employees

**File:** `src/features/employees/hooks/useEmployees.ts:80-107, 112-132`  
**Severity:** **HIGH**  
**Reference:** OWASP Top 10 A04 (Insecure Design), CWE-359 (Exposure of Private Information)

**Issue:** The `fetchEmployees()` function fetches ALL employees and decrypts ALL their NIK and gaji_pokok fields, even for Regular Staff. While the UI shows masked NIK (`maskNIK()`), the decryption RPC is still called server-side for every employee record. This means:
- The `decrypt_value` RPC is invoked N times even when the user can only see masked data
- Audit trail in `decrypt_audit_logs` should still log these accesses
- If any error occurs in masking logic, raw NIK could leak

**Fix:**
- For Regular Staff, skip decryption entirely and use a server-side masked view
- OR create a `get_employees_masked()` RPC that returns pre-masked data
- OR modify the SELECT query to not fetch `nik_encrypted` and `gaji_pokok_encrypted` for Regular Staff

---

## MEDIUM FINDINGS

### M-01: Soft-Delete Employee Has No Audit Logging

**File:** `src/features/employees/hooks/useEmployees.ts:209-221`  
**Severity:** **MEDIUM**  
**Reference:** OWASP Top 10 A09 (Security Logging and Monitoring Failures)

**Issue:** The `deleteEmployee()` function directly updates the employees table without logging to `audit_logs`. Compare with `createEmployee()` and `updateEmployee()` which call `logEmployeeChange()` with appropriate action_type. Employee deletion is a high-risk operation that must be audited.

**Fix:**
```ts
async function deleteEmployee(id: string): Promise<void> {
  // First, call the RPC which handles authorization
  const { error } = await supabase.rpc('soft_delete_employee', { employee_id: id });
  if (error) throw new Error(`Gagal menonaktifkan data karyawan: ${error.message}`);
}
```

### M-02: No Dual-Control for Payroll Processing

**Files:** `src/features/payroll/engine/batchProcessor.ts:132-231`, `src/features/payroll/pages/PayrollProcessPage.tsx`  
**Severity:** **MEDIUM**  
**Reference:** Payroll Security Best Practices (Cintriq 2026, Securafy 2025), ADP Hardening Guide, SOC 2 CC6.2

**Issue:** A single HR Staff user can process payroll, overwrite periods, and make unlimited changes without a second approver. Payroll industry best practices require:
- Separation of duties: payroll setup ≠ payroll approval
- Dual control for payroll runs over a threshold
- Out-of-band verification for payroll changes

**Fix:**
- Add a `payroll_approvals` table requiring Owner approval before payroll finalization
- Add "pending_approval" status to payroll periods
- Implement threshold alerts: if total payroll changes >20% from previous period, require dual approval

### M-03: No Bank Detail Change Verification

**Severity:** **MEDIUM**  
**Reference:** Payroll Fraud Prevention (payroll diversion attacks)

**Issue:** The system has no workflow for verifying changes to bank account/transfer details. Payroll diversion fraud (where attackers change bank details to redirect salary payments) is the most common payroll fraud vector.

**Note:** Bank details are not stored in the current schema (export-only). But if added later, must require:
- Out-of-band verification (phone call to verified contact)
- Dual approval for bank detail changes
- Email notification to employee AND owner when bank details change

### M-04: Ghost Employee Detection Missing

**Severity:** **MEDIUM**  
**Reference:** Payroll Fraud Prevention

**Issue:** No detection for ghost employees (employees in the payroll who don't actually work for the company). Common fraud indicators:
- Employees with no bank account changes (never noticed)
- Duplicate NIK across different employees
- Employees with no login activity

**Fix:** Add a periodic report that flags:
- Employees with no `updated_at` changes in >6 months
- Duplicate NIK checks
- Employees without user accounts

### M-05: Password Reset Script Exposes Supabase URL and Privileged Operations

**File:** `scripts/reset-password.mjs`  
**Severity:** **MEDIUM**  
**Reference:** CWE-798 (Hard-coded Credentials), OWASP Top 10 A05 (Security Misconfiguration)

**Issue:** The admin password reset script contains the hardcoded Supabase project URL and makes admin API calls using the `service_role` key. If this script is leaked:
1. The Supabase URL is exposed (though this is somewhat public)
2. The `service_role` key usage pattern is documented, making it easier for attackers to craft malicious requests if they obtain the key

**Fix:**
```mjs
const SUPABASE_URL = process.env.SUPABASE_URL;
if (!SUPABASE_URL) throw new Error('Set SUPABASE_URL environment variable');
```

### M-06: Audit Logger Silently Swallows Errors

**File:** `src/lib/auditLogger.ts:38-56`  
**Severity:** **MEDIUM**  
**Reference:** OWASP Top 10 A09 (Security Logging and Monitoring Failures)

**Issue:** `logAuditEntry()` catches all errors and only logs to `console.error`. For a payroll system, audit failures should be detectable:
- If the audit database is unavailable, sensitive operations proceed without logging
- No monitoring/alerting on audit failures

**Fix:** Implement a circuit-breaker pattern: if audit logging fails repeatedly, halt sensitive operations and alert administrators.

### M-07: NIK Validation Leaks Valid Province Codes and Age Range

**File:** `src/features/employees/validators/employeeSchema.ts:99-188`  
**Severity:** **MEDIUM**  
**Reference:** CWE-203 (Observable Discrepancy), UU PDP Pasal 15

**Issue:** The `validateNIK()` function reveals:
1. Complete list of valid province codes (all 37 valid codes)
2. Age range check (15-80 years)
3. Gender encoding via date-of-birth range

This enables NIK enumeration: an attacker can brute-force which NIKs are valid for which regions.

**Fix:** Move province code validation server-side. On the client, only check: 16 numeric digits, no structural validation.

### M-08: ESLint Configuration Missing

**File:** (missing `eslint.config.*` file)  
**Severity:** **MEDIUM**  
**Reference:** OWASP Top 10 A06 (Vulnerable and Outdated Components), CWE-1104

**Issue:** The project has `eslint` v9 as a devDependency and a `"lint": "eslint ."` script, but no ESLint configuration file exists. This means:
- `npm run lint` fails with "ESLint couldn't find an eslint.config.* file"
- Security-relevant patterns are not caught automatically
- Devs can commit code with potential vulnerabilities

**Fix:** Create `eslint.config.js` with TypeScript-aware security rules.

---

## LOW / INFORMATIONAL FINDINGS

### L-01: CSP `unsafe-inline` for Styles

**File:** `public/_headers:10`, `vercel.json:14`  
**Severity:** **LOW**  
**Reference:** OWASP ASVS V14 (Security Configuration)

**Issue:** `style-src 'self' 'unsafe-inline'` is required for Tailwind/shadcn but weakens CSP. If an XSS vulnerability is found, inline style injection is possible.

### L-02: Supabase Anon Key in `.env` File on Disk

**File:** `.env`  
**Severity:** **LOW** (Informational)

**Issue:** The `.env` file with anon key exists on disk. While anon keys are designed to be public for Supabase SPAs, and the file is gitignored, local disk exposure is still a risk for multi-user environments.

### L-03: No Automated SAST/DAST in CI/CD

**Severity:** **LOW** (Informational)

**Issue:** No Semgrep, CodeQL, SonarQube, or OWASP ZAP integration in the build pipeline. Security scanning relies on manual reviews.

**Fix:** Add to CI:
```yaml
- name: SAST
  run: npx semgrep --config=auto .
```

### L-04: No Incident Response Plan Documentation

**Severity:** **LOW** (Informational)

**Issue:** The project has no documented incident response plan for payroll/security incidents. Payroll-specific IR should include: notification templates for affected employees, regulatory reporting (UU PDP), contingency payroll processing, and communication templates.

### L-05: `reset-password.mjs` Exposes User List on Error

**File:** `scripts/reset-password.mjs:45-48`  
**Severity:** **LOW**

**Issue:** If the target email is not found, the script lists all registered user emails. This information disclosure could be useful to an attacker who gains access to the script.

---

## PAYROLL-SPECIFIC SECURITY GAPS (Beyond OWASP)

Based on industry research (Cintriq 2026, Securafy 2025, Zellis 2026, ADP Hardening Guide 2026, Payrun 2026):

| Gap | Priority | Status |
|-----|----------|--------|
| Dual-control for payroll processing | HIGH | Missing |
| Bank detail change verification | HIGH | N/A (not stored yet) |
| Ghost employee detection | MEDIUM | Missing |
| Payroll run reconciliation reports | MEDIUM | Missing |
| Self-service payslip access | DONE | Implemented (MyPayslipsPage) |
| Payroll audit trail | DONE | Implemented (immutable audit_logs) |
| RBAC with least privilege | DONE | Three-tier (Owner/HR/Staff) |
| Encryption at rest (AES-256) | DONE | Via pgcrypto + Vault |
| Data minimization in exports | DONE | Only 4 fields in Coretax export |
| MFA enforcement | HIGH | Partial (function exists, not enforced) |
| Session timeout / auto-logout | LOW | Missing (no session timeout) |
| IP-based access restrictions | LOW | Missing (not applicable for SPA) |
| Payroll processing rate limiting | DONE | Via check_payroll_rate_limit() |

---

## END-TO-END ATTACK SCENARIOS

### Scenario 1: HR Staff → Payroll Fraud
1. HR Staff user `jane@company.com` logs in (no MFA)
2. Modifies employee `budi`'s NIK (via `encrypt_value` RPC)
3. Creates a ghost employee with their own bank details
4. Processes payroll — system processes all employees including the ghost
5. Salary is paid to attacker's account
6. Deletes the ghost employee (via `employees_update` RLS — see C-01)
7. **Detection:** Audit log shows payroll_process and employee_delete, but no alert triggers on ghost patterns

**Mitigations needed:** Dual-control, ghost detection, MFA enforcement, soft-delete audit logging, threshold alerts.

### Scenario 2: Regular Staff → Data Enumeration
1. Regular staff user logs in
2. Fetches employee list — decryption RPC is called for ALL employees (H-04)
3. Though NIK is masked in UI, the decrypt_audit_logs table records the access
4. Payroll results show personal net pay data
5. **Detection:** decrypt_audit_logs can identify the pattern of excessive decryption calls

**Mitigation:** Skip server-side decryption for Regular Staff entirely.

---

## RECOMMENDATIONS (Priority Order)

### Immediate (24h):
1. **C-01:** Fix soft-delete authorization — switch to RPC-only with Owner check
2. **H-01:** Restrict Edge Function CORS to specific domain

### Short-Term (7 days):
3. **H-02:** Enforce MFA for Owner and HR Staff accounts
4. **H-03:** Add RLS to `api_rate_limits` table
5. **H-04:** Create a masked employee view for Regular Staff to avoid unnecessary decryption
6. **M-01:** Add audit logging to soft-delete operations

### Medium-Term (30 days):
7. **M-02:** Implement dual-control approval workflow for payroll processing
8. **M-06:** Add audit failure monitoring with circuit-breaker
9. **M-07:** Move NIK structural validation to server-side
10. **M-08:** Create ESLint config with security rules

### Long-Term (90 days):
11. **M-03/M-04:** Add bank detail verification and ghost employee detection
12. **L-02:** Implement CI/CD security scanning (SAST + SCA)
13. **L-03:** Document incident response plan
14. **L-05:** Session timeout and inactivity auto-logout

---

## WHAT'S DONE WELL

- **Defense in depth:** RLS (database) + RBAC (frontend) + Zod validation (forms)
- **Encryption:** AES-256 via pgp_sym_encrypt with key in Supabase Vault (never client-side)
- **Immutable audit logs:** REVOKE UPDATE/DELETE on audit_logs prevents tampering
- **RLS on all tables:** Every table has `ENABLE ROW LEVEL SECURITY`
- **Employee data isolation:** All queries filter by `company_id`
- **XML/CSV escaping:** Proper `escapeXML()` and `escapeCSVField()` functions
- **HTML escaping in emails:** `escapeHtml()` prevents email template injection
- **Rate limiting:** Infrastructure exists for email (50/hr) and payroll (1/min)
- **npm audit:** 0 known vulnerabilities in dependencies
- **Decrypt authorization wrapper:** `decrypt_employee_field()` enforces role + company check
- **Error boundary:** No stack traces exposed to users
- **Security headers:** CSP, HSTS, X-Frame-Options, etc. configured
- **Content Security Policy:** Comprehensive `connect-src`, `frame-ancestors`, `base-uri`, `form-action`
- **TypeScript strict mode:** Catches type-related vulnerabilities at compile time

---

## SCORING SUMMARY

| Domain | Score | Status |
|--------|-------|--------|
| Authentication & Session Mgmt | 7/10 | MFA enforcement missing |
| Access Control (RBAC + RLS) | 8/10 | One critical RLS bypass found |
| Data Encryption | 9/10 | Strong Vault-based implementation |
| API Security | 7/10 | CORS wildcard, rate limiting gaps |
| Input Validation & Output Encoding | 9/10 | Zod + escaping solid |
| Security Headers | 8/10 | CSP unsafe-inline for styles |
| Payroll-Specific Controls | 4/10 | Dual-control, ghost detection missing |
| Audit & Monitoring | 7/10 | Silent failure in audit logger |
| Dependency Security | 10/10 | 0 npm vulnerabilities |
| **Overall** | **7.7/10** | Strong foundation, payroll-specific gaps |

---

## TOOLS USED

| Tool | Purpose |
|------|---------|
| Manual code review | JSX/SQL/TS analysis |
| npm audit v9 | Dependency vulnerability scan |
| TypeScript (tsc --noEmit) | Type safety verification |
| web search | Industry standards research 2024-2026 |
| Git history analysis | Secrets exposure, change patterns |

*SAST (Semgrep/CodeQL) and DAST (OWASP ZAP) not available in current environment — recommended for CI/CD pipeline.*

---

*Audit performed 2026-05-15. Frameworks referenced: OWASP ASVS v4, OWASP API Security Top 10, CWE/SANS Top 25, NIST 800-63B, PCI DSS v4.0, UU PDP No. 27/2022, SOC 2, ISO 27001, Payroll Security Best Practices (Cintriq 2026, Securafy 2025, Zellis 2026, ADP Hardening Guide 2026, Payrun 2026).*
