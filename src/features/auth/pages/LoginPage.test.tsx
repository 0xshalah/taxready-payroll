import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from './LoginPage'

// Mock supabase client (LoginPage calls supabase directly)
const mockSignInWithPassword = vi.fn()
const mockResetPasswordForEmail = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
    },
  },
}))

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form with email and password fields', () => {
    renderLoginPage()

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /masuk/i })).toBeInTheDocument()
  })

  it('renders link to register page', () => {
    renderLoginPage()

    const link = screen.getByRole('link', { name: /daftar/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/register')
  })

  it('shows error when email is empty', async () => {
    renderLoginPage()

    fireEvent.click(screen.getByRole('button', { name: /masuk/i }))

    expect(await screen.findByText('Email wajib diisi')).toBeInTheDocument()
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('shows error when password is empty', async () => {
    renderLoginPage()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /masuk/i }))

    expect(await screen.findByText('Password wajib diisi')).toBeInTheDocument()
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('calls signInWithPassword and redirects to /dashboard on success', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { user: { id: '1' } }, error: null })

    renderLoginPage()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /masuk/i }))

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })
  })

  it('shows error message on invalid credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    })

    renderLoginPage()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    })
    fireEvent.click(screen.getByRole('button', { name: /masuk/i }))

    expect(await screen.findByText('Email atau password salah')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('shows error for unconfirmed email', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Email not confirmed' },
    })

    renderLoginPage()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /masuk/i }))

    expect(await screen.findByText(/email belum dikonfirmasi/i)).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('shows forgot password form when link clicked', async () => {
    renderLoginPage()

    fireEvent.click(screen.getByText(/lupa password/i))

    expect(screen.getByText(/lupa password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /kirim link reset/i })).toBeInTheDocument()
  })

  it('does not navigate when login fails', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Some error' },
    })

    renderLoginPage()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /masuk/i }))

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalled()
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
