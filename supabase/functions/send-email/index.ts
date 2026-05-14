/**
 * Supabase Edge Function: send-email
 * Mengirim email notifikasi menggunakan Resend API.
 *
 * Deploy via Supabase Dashboard → Edge Functions → New Function
 * atau via CLI: supabase functions deploy send-email
 *
 * Environment variables yang dibutuhkan (set di Supabase Dashboard → Settings → Edge Functions):
 * - RESEND_API_KEY: API key dari resend.com (gratis, 3000 email/bulan)
 * - FROM_EMAIL: email pengirim (misal: noreply@taxready.app)
 *
 * Cara mendapatkan RESEND_API_KEY:
 * 1. Daftar di https://resend.com (gratis)
 * 2. Dashboard → API Keys → Create API Key
 * 3. Copy key dan set di Supabase Dashboard → Settings → Edge Functions → Secrets
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailPayload {
  to: string
  subject: string
  html: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html }: EmailPayload = await req.json()

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'noreply@taxready.app'

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Tax-Ready Payroll <${FROM_EMAIL}>`,
        to: [to],
        subject,
        html,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.message ?? 'Failed to send email' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
