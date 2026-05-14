import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RegisterCompanyPage } from './RegisterCompanyPage'

// Mock useAuth hook
const mockRegister = vi.fn()
const mockClearError = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    register: mockRegister,
    loading: false,
    error: null,
    clearError: mockClearError,
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderRegisterPage() {
  return render(
    <MemoryRouter>
      <RegisterCompanyPage />
    </MemoryRouter>
  )
}

function fillForm(overrides: Partial<{
  namaPerusahaan: string
  npwpBadan: string
  namaLengkap: string
  email: string
  password: string
  konfirmasiPassword: string
}> = {}) {
  const defaults = {
    namaPerusahaan: 'PT Test Indonesia',
    npwpBadan: '1234567890123456',
    namaLengkap: 'John Doe',
    email: 'john@test.com',
    password: 'password123',
    konfirmasiPassword: 'password123',
  }

  const values = { ...defaults, ...overrides }

  fireEvent.change(screen.getByLabelText(/nama perusahaan/i), { target: { value: values.namaPerusahaan } })
  fireEvent.change(screen.getByLabelText(/npwp badan/i), { target: { value: values.npwpBadan } })
  fireEvent.change(screen.getByLabelText(/nama lengkap/i), { target: { value: values.namaLengkap } })
  fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: values.email } })
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: values.password } })
  fireEvent.change(screen.getByLabelText(/konfirmasi password/i), { target: { value: values.konfirmasiPassword } })
}

describe('RegisterCompanyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders registration form with all required fields', () => {
    renderRegisterPage()

    expect(screen.getByLabelText(/nama perusahaan/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/npwp badan/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nama lengkap/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/konfirmasi password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /daftar perusahaan/i })).toBeInTheDocument()
  })

  it('renders link to login page', () => {
    renderRegisterPage()

    const link = screen.getByRole('link', { name: /masuk/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/login')
  })

  it('shows error when nama perusahaan is empty', async () => {
    renderRegisterPage()

    fireEvent.click(screen.getByRole('button', { name: /daftar perusahaan/i }))

    expect(await screen.findByText('Nama perusahaan wajib diisi')).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('shows error when NPWP is not 16 digits', async () => {
    renderRegisterPage()

    fillForm({ npwpBadan: '12345' })
    fireEvent.click(screen.getByRole('button', { name: /daftar perusahaan/i }))

    expect(await screen.findByText('NPWP Badan harus terdiri dari 16 digit angka')).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('shows error when NPWP contains non-numeric characters', async () => {
    renderRegisterPage()

    fillForm({ npwpBadan: '12345678901234ab' })
    fireEvent.click(screen.getByRole('button', { name: /daftar perusahaan/i }))

    expect(await screen.findByText('NPWP Badan harus terdiri dari 16 digit angka')).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('shows error when password is less than 8 characters', async () => {
    renderRegisterPage()

    fillForm({ password: '1234567', konfirmasiPassword: '1234567' })
    fireEvent.click(screen.getByRole('button', { name: /daftar perusahaan/i }))

    expect(await screen.findByText('Password minimal 8 karakter')).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('shows error when passwords do not match', async () => {
    renderRegisterPage()

    fillForm({ konfirmasiPassword: 'different123' })
    fireEvent.click(screen.getByRole('button', { name: /daftar perusahaan/i }))

    expect(await screen.findByText('Konfirmasi password tidak cocok')).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('calls register and redirects to /dashboard on success', async () => {
    mockRegister.mockResolvedValue({ role: 'owner', id: '1', company_id: 'c1', email: 'john@test.com', nama: 'John Doe', created_at: '' })

    renderRegisterPage()
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: /daftar perusahaan/i }))

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        nama_perusahaan: 'PT Test Indonesia',
        npwp_badan: '1234567890123456',
        nama: 'John Doe',
        email: 'john@test.com',
        password: 'password123',
      })
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })
  })

  it('does not navigate when register throws an error', async () => {
    mockRegister.mockRejectedValue(new Error('Email sudah terdaftar'))

    renderRegisterPage()
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: /daftar perusahaan/i }))

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled()
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
