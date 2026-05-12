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
  const { register, loading, error, clearError } = useAuth()

  const [namaPerusahaan, setNamaPerusahaan] = useState('')
  const [npwpBadan, setNpwpBadan] = useState('')
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

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
    if (password.length < 6) {
      return 'Password minimal 6 karakter'
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
    }
  }

  const displayError = formError || error

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-8">
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
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
              {loading ? 'Memproses...' : 'Daftar Perusahaan'}
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
