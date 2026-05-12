import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'

/**
 * Halaman Login
 * Route: /login
 * Validates: Persyaratan 9.1
 *
 * - Form email + password
 * - Redirect berdasarkan role setelah login:
 *   - Owner/HR Staff → /dashboard
 *   - Regular Staff → /profile
 * - Error handling dengan pesan di bawah form
 */
export function LoginPage() {
  const navigate = useNavigate()
  const { login, loading, error, clearError } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    clearError()

    // Validasi sederhana
    if (!email.trim()) {
      setFormError('Email wajib diisi')
      return
    }
    if (!password) {
      setFormError('Password wajib diisi')
      return
    }

    try {
      const user = await login({ email: email.trim(), password })

      // Redirect berdasarkan role
      if (user.role === 'regular_staff') {
        navigate('/profile', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch {
      // Error sudah di-handle oleh useAuth hook (state.error)
    }
  }

  const displayError = formError || error

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Masuk ke Tax-Ready Payroll</CardTitle>
          <CardDescription>
            Masukkan email dan password untuk melanjutkan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@perusahaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            {displayError && (
              <p className="text-sm text-error" role="alert">
                {displayError}
              </p>
            )}

            <Button
              type="submit"
              variant="primary-green"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-ink-mute">
            Belum punya akun?{' '}
            <Link to="/register" className="text-primary-deep hover:underline font-medium">
              Daftar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
