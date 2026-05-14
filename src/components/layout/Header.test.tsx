/**
 * Unit tests untuk Header component
 * Validates: Persyaratan 9.2, 9.3, 9.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';

// Mock useAuth hook
const mockLogout = vi.fn();
const mockUseAuth = vi.fn();
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock ThemeToggle to avoid ThemeProvider dependency in tests
vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => null,
}));

function renderHeader(props = {}) {
  return render(
    <MemoryRouter>
      <Header {...props} />
    </MemoryRouter>
  );
}

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Ketika user belum login', () => {
    it('tidak render apapun', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false, logout: mockLogout });

      const { container } = renderHeader();

      expect(container.innerHTML).toBe('');
    });
  });

  describe('Tampilan untuk Owner', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u1', company_id: 'c1', role: 'owner', email: 'owner@test.com', nama: 'John Doe' },
        loading: false,
        logout: mockLogout,
      });
    });

    it('menampilkan nama perusahaan', () => {
      renderHeader({ companyName: 'PT Maju Jaya' });

      expect(screen.getByText('PT Maju Jaya')).toBeInTheDocument();
    });

    it('menampilkan fallback jika nama perusahaan tidak diberikan', () => {
      renderHeader();

      expect(screen.getByText('Tax-Ready Payroll')).toBeInTheDocument();
    });

    it('menampilkan role badge "Owner"', () => {
      renderHeader();

      expect(screen.getByText('Owner')).toBeInTheDocument();
    });

    it('menampilkan avatar dengan inisial', () => {
      renderHeader();

      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  describe('Tampilan untuk HR Staff', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u2', company_id: 'c1', role: 'hr_staff', email: 'hr@test.com', nama: 'Siti Aminah' },
        loading: false,
        logout: mockLogout,
      });
    });

    it('menampilkan role badge "HR Staff"', () => {
      renderHeader();

      expect(screen.getByText('HR Staff')).toBeInTheDocument();
    });

    it('menampilkan avatar dengan inisial SA', () => {
      renderHeader();

      expect(screen.getByText('SA')).toBeInTheDocument();
    });
  });

  describe('Tampilan untuk Regular Staff', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u3', company_id: 'c1', role: 'regular_staff', email: 'staff@test.com', nama: 'Budi' },
        loading: false,
        logout: mockLogout,
      });
    });

    it('menampilkan role badge "Staff"', () => {
      renderHeader();

      expect(screen.getByText('Staff')).toBeInTheDocument();
    });

    it('menampilkan avatar dengan inisial B', () => {
      renderHeader();

      expect(screen.getByText('B')).toBeInTheDocument();
    });
  });

  describe('Interaksi', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u1', company_id: 'c1', role: 'owner', email: 'owner@test.com', nama: 'Admin' },
        loading: false,
        logout: mockLogout,
      });
    });

    it('memanggil onMenuClick saat hamburger diklik', () => {
      const onMenuClick = vi.fn();
      renderHeader({ onMenuClick });

      const menuButton = screen.getByLabelText('Buka menu navigasi');
      fireEvent.click(menuButton);

      expect(onMenuClick).toHaveBeenCalledTimes(1);
    });

    it('memanggil logout saat tombol keluar diklik', () => {
      renderHeader();

      const logoutButton = screen.getByLabelText('Keluar');
      fireEvent.click(logoutButton);

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u1', company_id: 'c1', role: 'owner', email: 'owner@test.com', nama: 'Admin' },
        loading: false,
        logout: mockLogout,
      });
    });

    it('hamburger button memiliki aria-label', () => {
      renderHeader();

      expect(screen.getByLabelText('Buka menu navigasi')).toBeInTheDocument();
    });

    it('logout button memiliki aria-label', () => {
      renderHeader();

      expect(screen.getByLabelText('Keluar')).toBeInTheDocument();
    });

    it('avatar memiliki aria-label dengan nama user', () => {
      renderHeader();

      expect(screen.getByLabelText('Avatar Admin')).toBeInTheDocument();
    });
  });
});
