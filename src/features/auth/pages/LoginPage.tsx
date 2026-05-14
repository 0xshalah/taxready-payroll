import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'

/**
 * Halaman Login — simplified, no useAuth dependency for the login action itself.
 * Calls Supabase directly to avoid any context/state race conditions.
 */
export function LoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [isSendingReset, setIsSendingReset] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) { setError('Email wajib diisi'); return }
    if (!password) { setError('Password wajib diisi'); return }

    setIsSubmitting(true)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          setError('Email atau password salah')
        } else if (authError.message === 'Email not confirmed') {
          setError('Email belum dikonfirmasi. Periksa inbox Anda atau hubungi admin.')
        } else {
          setError(authError.message)
        }
        return
      }

      // Login berhasil — langsung navigate. AuthContext akan pick up session dari onAuthStateChange.
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleForgotPassword(e: FormEvent) {
    e.preventDefault()
    setResetError(null)
    setResetSent(false)

    if (!email.trim()) { setResetError('Masukkan email terlebih dahulu'); return }

    setIsSendingReset(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      })
      if (error) { setResetError(error.message) }
      else { setResetSent(true) }
    } catch {
      setResetError('Gagal mengirim email reset password')
    } finally {
      setIsSendingReset(false)
    }
  }

  // ─── Forgot Password View ────────────────────────────────────────
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-canvas dark:bg-mesh flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Lupa Password</CardTitle>
            <CardDescription>Masukkan email untuk menerima link reset</CardDescription>
          </CardHeader>
          <CardContent>
            {resetSent ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-ink">Link reset dikirim ke <strong>{email}</strong>. Cek inbox/spam.</p>
                <Button variant="outline" className="w-full" onClick={() => { setShowForgotPassword(false); setResetSent(false) }}>
                  Kembali ke Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input id="reset-email" type="email" placeholder="nama@perusahaan.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSendingReset} />
                </div>
                {resetError && <p className="text-sm text-error">{resetError}</p>}
                <Button type="submit" variant="primary-green" className="w-full" disabled={isSendingReset}>
                  {isSendingReset ? 'Mengirim...' : 'Kirim Link Reset'}
                </Button>
                <button type="button" onClick={() => setShowForgotPassword(false)} className="w-full text-center text-sm text-ink-mute hover:text-ink">
                  Kembali ke Login
                </button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Login View ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-canvas dark:bg-mesh flex items-center justify-center px-4">
      <div className="fixed top-4 left-4">
        <Link to="/" className="flex items-center gap-1.5 text-sm text-ink-mute hover:text-ink transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali
        </Link>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Masuk ke Tax-Ready Payroll</CardTitle>
          <CardDescription>Masukkan email dan password untuk melanjutkan</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="nama@perusahaan.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" disabled={isSubmitting} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-primary-deep hover:underline">
                  Lupa password?
                </button>
              </div>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" disabled={isSubmitting} />
            </div>

            {error && <p className="text-sm text-error" role="alert">{error}</p>}

            <Button type="submit" variant="primary-green" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-ink-mute">
            Belum punya akun?{' '}
            <Link to="/register" className="text-primary-deep hover:underline font-medium">Daftar</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
