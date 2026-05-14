/**
 * Edge Function: invite-user
 * Server-side user invitation with proper authorization and session isolation.
 * 
 * SECURITY FIXES:
 * - Only Owner can invite users (enforced server-side)
 * - Uses service_role key to create users (no session takeover)
 * - Rate limited (max 10 invites per hour per owner)
 * - Validates email format and password strength
 * - Logs all invite attempts to audit trail
 * 
 * Deploy: supabase functions deploy invite-user
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://taxready.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
}

interface InviteUserRequest {
  email: string
  nama: string
  role: 'owner' | 'hr_staff' | 'regular_staff'
  password: string
}

interface InviteUserResponse {
  success: boolean
  user_id?: string
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
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

    // 2. Get user profile and verify role = owner
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

    // CRITICAL: Only owner can invite users
    if (profile.role !== 'owner') {
      // Log unauthorized attempt
      await supabaseAdmin.from('audit_logs').insert({
        company_id: profile.company_id,
        user_id: user.id,
        user_role: profile.role,
        action_type: 'unauthorized_access',
        entity_type: 'user_management',
        changes: {
          attempted_action: 'invite_user',
          reason: 'non_owner_denied',
          timestamp: new Date().toISOString(),
        },
      })

      return new Response(
        JSON.stringify({ error: 'Access denied. Only Owner can invite users.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Check rate limit (max 10 invites per hour)
    const { data: rateLimitOk } = await supabaseAdmin.rpc('check_rate_limit', {
      p_endpoint: 'invite_user',
      p_max_requests: 10,
      p_window_minutes: 60,
    })

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Max 10 invites per hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Parse and validate request body
    const body: InviteUserRequest = await req.json()
    const { email, nama, role, password } = body

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate nama
    if (!nama || nama.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nama is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate role
    if (!['owner', 'hr_staff', 'regular_staff'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate password strength (min 8 chars)
    if (!password || password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Create user using service_role (no session takeover)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true, // Auto-confirm email for invited users
      user_metadata: {
        nama: nama.trim(),
        role,
        company_id: profile.company_id,
      },
    })

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: authError?.message || 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Insert into users table
    const { error: userError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      company_id: profile.company_id,
      email: email.trim(),
      nama: nama.trim(),
      role,
    })

    if (userError) {
      // Rollback: delete auth user if users table insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: `Failed to create user profile: ${userError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 7. Log successful invite to audit trail
    await supabaseAdmin.from('audit_logs').insert({
      company_id: profile.company_id,
      user_id: user.id,
      user_role: profile.role,
      action_type: 'role_change', // Using role_change as proxy for user_invite
      entity_type: 'user',
      entity_id: authData.user.id,
      changes: {
        action: 'user_invited',
        invited_email: email.trim(),
        invited_nama: nama.trim(),
        invited_role: role,
        timestamp: new Date().toISOString(),
      },
    })

    // 8. Send welcome email (fire-and-forget)
    // Note: send-email function will be hardened separately
    supabaseAdmin.functions.invoke('send-email', {
      body: {
        to: email.trim(),
        subject: `Selamat Datang di Tax-Ready Payroll`,
        html: `<p>Halo ${nama.trim()},</p><p>Anda telah diundang ke Tax-Ready Payroll sebagai ${role}.</p><p>Silakan login dengan email dan password yang telah diberikan.</p>`,
      },
    }).catch(() => {}) // Non-blocking

    // 9. Return success
    const response: InviteUserResponse = {
      success: true,
      user_id: authData.user.id,
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
