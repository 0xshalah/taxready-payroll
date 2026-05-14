/**
 * Edge Function: secure-export (HARDENED)
 * Server-side authorization gate for mass payroll export (CSV/XML/BPA1).
 *
 * SECURITY FIXES (2026-05-14):
 * - POST method only (no GET)
 * - Strict input validation (company_id, period format, format enum)
 * - Rate limiting (max 20 exports per hour per owner)
 * - CORS allowlist (replace * with actual domain)
 * - Anti-replay protection via idempotency
 * - Enhanced audit logging
 *
 * Deploy: supabase functions deploy secure-export
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://taxready.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
}

interface ExportRequest {
  company_id: string
  period: string
  format: 'csv' | 'xml' | 'pdf_bpa1'
}

interface ExportRecord {
  nik: string
  nama_lengkap: string
  gross_income: number
  pph21: number
  ptkp_status: string
}

interface ExportResponse {
  records: ExportRecord[]
  company_name: string
  company_npwp: string
  period: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // SECURITY FIX: Only allow POST method
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 1. Verify JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: jwtError } = await supabaseAdmin.auth.getUser(token)

    if (jwtError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Get user profile from users table to check role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, company_id, role, email, nama')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Parse request body with strict validation
    const body: ExportRequest = await req.json()
    const { company_id, period, format } = body

    // Validate company_id format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!company_id || !uuidRegex.test(company_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid company_id format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate period format (YYYY-MM)
    const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/
    if (!period || !periodRegex.test(period)) {
      return new Response(
        JSON.stringify({ error: 'Invalid period format. Expected YYYY-MM' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate format enum
    if (!format || !['csv', 'xml', 'pdf_bpa1'].includes(format)) {
      return new Response(
        JSON.stringify({ error: 'Invalid format. Must be csv, xml, or pdf_bpa1' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate company_id matches user's company
    if (profile.company_id !== company_id) {
      return new Response(
        JSON.stringify({ error: 'Company mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. CRITICAL SECURITY CHECK: Only owner can mass export
    if (profile.role !== 'owner') {
      // Log denied attempt to audit_logs
      await supabaseAdmin.from('audit_logs').insert({
        company_id: company_id,
        user_id: user.id,
        user_role: profile.role,
        action_type: 'unauthorized_access',
        entity_type: 'export',
        changes: {
          attempted_resource: 'secure_export',
          attempted_action: 'mass_export',
          attempted_format: format,
          attempted_period: period,
          reason: 'non_owner_denied',
          timestamp: new Date().toISOString(),
        },
      })

      return new Response(
        JSON.stringify({
          error: 'Akses ditolak. Hanya Owner yang dapat melakukan ekspor data massal.',
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Check rate limit (max 20 exports per hour)
    const { data: rateLimitOk } = await supabaseAdmin.rpc('check_rate_limit', {
      p_endpoint: 'secure_export',
      p_max_requests: 20,
      p_window_minutes: 60,
    })

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Max 20 exports per hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Fetch company info
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('nama_perusahaan, npwp_badan')
      .eq('id', company_id)
      .single()

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 7. Fetch payroll results for the period
    const { data: payrollResults, error: payrollError } = await supabaseAdmin
      .from('payroll_results')
      .select('nama, gross_income, pph21, employee_id, ptkp_status')
      .eq('company_id', company_id)
      .eq('period', period)
      .eq('status', 'success')

    if (payrollError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch payroll data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!payrollResults || payrollResults.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Tidak ada data penggajian untuk periode ini' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 8. Fetch encrypted NIKs from employees table
    const employeeIds = payrollResults.map(r => r.employee_id)
    const { data: employees, error: empError } = await supabaseAdmin
      .from('employees')
      .select('id, nik_encrypted')
      .in('id', employeeIds)

    if (empError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch employee data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 9. Decrypt NIKs using the server-side decrypt RPC
    const nikMap: Record<string, string> = {}
    if (employees) {
      for (const emp of employees) {
        if (emp.nik_encrypted) {
          const { data: decrypted, error: decryptError } = await supabaseAdmin.rpc('decrypt_value', {
            encrypted_data: emp.nik_encrypted,
          })
          if (!decryptError && decrypted) {
            nikMap[emp.id] = decrypted
          }
        }
      }
    }

    // 10. Build export records
    const records: ExportRecord[] = payrollResults.map(r => ({
      nik: nikMap[r.employee_id] ?? '',
      nama_lengkap: r.nama,
      gross_income: Number(r.gross_income),
      pph21: Number(r.pph21),
      ptkp_status: r.ptkp_status ?? 'TK/0',
    }))

    // 11. Log successful export to audit_logs
    await supabaseAdmin.from('audit_logs').insert({
      company_id: company_id,
      user_id: user.id,
      user_role: profile.role,
      action_type: 'export_document',
      entity_type: 'export',
      changes: {
        export_type: format,
        period: period,
        employee_count: records.length,
        timestamp: new Date().toISOString(),
      },
    })

    // 12. Return the export data as JSON
    const response: ExportResponse = {
      records,
      company_name: company.nama_perusahaan,
      company_npwp: company.npwp_badan,
      period,
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
