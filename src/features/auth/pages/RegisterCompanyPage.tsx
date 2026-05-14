import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'

/**
 * Halaman Register Company
 * Route: /register
 * Validates: Persyaratan 9.1
 *
 * - Form: nama perusahaan, NPWP badan (16 digit), nama lengkap, email, password, konfirmasi password
 * - Validasi client-side sebelum submit
 * - Redirect ke /dashboard setelah berhasil
 * - Error handling dengan pesan di bawah form
 */
export function RegisterCompanyPage() {
  const navigate = useNavigate()
  const { register, error, clearError } = useAuth()

  const [namaPerusahaan, setNamaPerusahaan] = useState('')
  const [npwpBadan, setNpwpBadan] = useState('')
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validateForm(): string | null {
    if (!namaPerusahaan.trim()) {
      return 'Nama perusahaan wajib diisi'
    }
    if (!npwpBadan.trim()) {
      return 'NPWP Badan wajib diisi'
    }
    if (!/^\d{16}$/.test(npwpBadan.trim())) {
      return 'NPWP Badan harus terdiri dari 16 digit angka'
    }
    if (!nama.trim()) {
      return 'Nama lengkap wajib diisi'
    }
    if (!email.trim()) {
      return 'Email wajib diisi'
    }
    if (!password) {
      return 'Password wajib diisi'
    }
    if (password.length < 8) {
      return 'Password minimal 8 karakter'
    }
    if (password !== konfirmasiPassword) {
      return 'Konfirmasi password tidak cocok'
    }
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    clearError()

    const validationError = validateForm()
    if (validationError) {
      setFormError(validationError)
      return
    }

    try {
      setIsSubmitting(true)
      await register({
        nama_perusahaan: namaPerusahaan.trim(),
        npwp_badan: npwpBadan.trim(),
        nama: nama.trim(),
        email: email.trim(),
        password,
      })

      navigate('/dashboard', { replace: true })
    } catch {
      // Error sudah di-handle oleh useAuth hook (state.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayError = formError || error

  return (
    <div className="min-h-screen bg-canvas dark:bg-mesh flex items-center justify-center px-4 py-8">
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
          <CardTitle className="text-2xl">Daftar Perusahaan</CardTitle>
          <CardDescription>
            Buat akun baru untuk mulai mengelola penggajian
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama-perusahaan">Nama Perusahaan</Label>
              <Input
                id="nama-perusahaan"
                type="text"
                placeholder="PT Contoh Indonesia"
                value={namaPerusahaan}
                onChange={(e) => setNamaPerusahaan(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="npwp-badan">NPWP Badan (16 digit)</Label>
              <Input
                id="npwp-badan"
                type="text"
                placeholder="1234567890123456"
                value={npwpBadan}
                onChange={(e) => setNpwpBadan(e.target.value)}
                maxLength={16}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input
                id="nama"
                type="text"
                placeholder="Nama lengkap Anda"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@perusahaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="konfirmasi-password">Konfirmasi Password</Label>
              <Input
                id="konfirmasi-password"
                type="password"
                placeholder="Ulangi password"
                value={konfirmasiPassword}
                onChange={(e) => setKonfirmasiPassword(e.target.value)}
                autoComplete="new-password"
                disabled={isSubmitting}
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
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Memproses...' : 'Daftar Perusahaan'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-ink-mute">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-primary-deep hover:underline font-medium">
              Masuk
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
