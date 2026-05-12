/**
 * Unit tests untuk ProtectedRoute component
 * Validates: Persyaratan 9.2, 9.3, 9.4, 9.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock audit logger
const mockLogUnauthorizedAccess = vi.fn();
vi.mock('@/lib/auditLogger', () => ({
  logUnauthorizedAccess: (...args: unknown[]) => mockLogUnauthorizedAccess(...args),
}));

function renderProtectedRoute(resource: string, action?: string) {
  return render(
    <MemoryRouter>
      <ProtectedRoute resource={resource as never} action={action as never}>
        <div data-testid="protected-content">Konten Terlindungi</div>
      </ProtectedRoute>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('menampilkan loading saat auth sedang dimuat', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: true });

      renderProtectedRoute('employees');

      expect(screen.getByText('Memuat...')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated user', () => {
    it('redirect ke /login jika user belum login', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false });

      const { container } = render(
        <MemoryRouter initialEntries={['/employees']}>
          <ProtectedRoute resource="employees">
            <div data-testid="protected-content">Konten</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Navigate component renders nothing visible
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(container.innerHTML).toBe('');
    });
  });

  describe('Authenticated user with permission', () => {
    it('render children jika Owner akses employees', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u1', company_id: 'c1', role: 'owner', email: 'a@b.com', nama: 'Admin' },
        loading: false,
      });

      renderProtectedRoute('employees', 'read');

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Konten Terlindungi')).toBeInTheDocument();
    });

    it('render children jika HR Staff akses payroll (read)', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u2', company_id: 'c1', role: 'hr_staff', email: 'hr@b.com', nama: 'HR' },
        loading: false,
      });

      renderProtectedRoute('payroll', 'read');

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('render children jika Regular Staff akses profile (read)', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u3', company_id: 'c1', role: 'regular_staff', email: 'staff@b.com', nama: 'Staff' },
        loading: false,
      });

      renderProtectedRoute('profile', 'read');

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('default action adalah read', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u1', company_id: 'c1', role: 'owner', email: 'a@b.com', nama: 'Admin' },
        loading: false,
      });

      renderProtectedRoute('employees');

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Authenticated user WITHOUT permission', () => {
    it('tampilkan "Akses Ditolak" jika HR Staff akses settings', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u2', company_id: 'c1', role: 'hr_staff', email: 'hr@b.com', nama: 'HR' },
        loading: false,
      });

      renderProtectedRoute('settings', 'read');

      expect(screen.getByText('Akses Ditolak')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('tampilkan "Akses Ditolak" jika Regular Staff akses employees', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u3', company_id: 'c1', role: 'regular_staff', email: 'staff@b.com', nama: 'Staff' },
        loading: false,
      });

      renderProtectedRoute('employees', 'read');

      expect(screen.getByText('Akses Ditolak')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('tampilkan "Akses Ditolak" jika HR Staff coba delete employees', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u2', company_id: 'c1', role: 'hr_staff', email: 'hr@b.com', nama: 'HR' },
        loading: false,
      });

      renderProtectedRoute('employees', 'delete');

      expect(screen.getByText('Akses Ditolak')).toBeInTheDocument();
    });

    it('catat unauthorized access ke audit_logs', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u3', company_id: 'c1', role: 'regular_staff', email: 'staff@b.com', nama: 'Staff' },
        loading: false,
      });

      renderProtectedRoute('employees', 'read');

      expect(mockLogUnauthorizedAccess).toHaveBeenCalledWith({
        userId: 'u3',
        companyId: 'c1',
        userRole: 'regular_staff',
        attemptedResource: 'employees',
        attemptedAction: 'read',
      });
    });

    it('catat unauthorized access hanya sekali (tidak duplikat)', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u3', company_id: 'c1', role: 'regular_staff', email: 'staff@b.com', nama: 'Staff' },
        loading: false,
      });

      const { rerender } = render(
        <MemoryRouter>
          <ProtectedRoute resource="employees" action="read">
            <div>Konten</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Re-render to simulate re-render cycle
      rerender(
        <MemoryRouter>
          <ProtectedRoute resource="employees" action="read">
            <div>Konten</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(mockLogUnauthorizedAccess).toHaveBeenCalledTimes(1);
    });
  });
});
