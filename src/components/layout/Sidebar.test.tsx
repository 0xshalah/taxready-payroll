/**
 * Unit tests untuk Sidebar component
 * Validates: Persyaratan 9.2, 9.3, 9.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderSidebar(props = {}) {
  return render(
    <MemoryRouter>
      <Sidebar {...props} />
    </MemoryRouter>
  );
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Ketika user belum login', () => {
    it('tidak render apapun', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false });

      const { container } = renderSidebar();

      expect(container.innerHTML).toBe('');
    });
  });

  describe('Menu navigasi untuk Owner', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u1', company_id: 'c1', role: 'owner', email: 'owner@test.com', nama: 'Owner' },
        loading: false,
      });
    });

    it('menampilkan semua menu Owner: Dashboard, Karyawan, Penggajian, Ekspor, Pengaturan, Audit Trail', () => {
      renderSidebar();

      expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Karyawan').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Penggajian').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Ekspor').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Pengaturan').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Audit Trail').length).toBeGreaterThan(0);
    });

    it('tidak menampilkan menu Regular Staff (Profil Saya, Slip Gaji Saya)', () => {
      renderSidebar();

      expect(screen.queryByText('Profil Saya')).not.toBeInTheDocument();
      expect(screen.queryByText('Slip Gaji Saya')).not.toBeInTheDocument();
    });
  });

  describe('Menu navigasi untuk HR Staff', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u2', company_id: 'c1', role: 'hr_staff', email: 'hr@test.com', nama: 'HR Staff' },
        loading: false,
      });
    });

    it('menampilkan menu HR Staff: Dashboard, Karyawan, Penggajian, Ekspor', () => {
      renderSidebar();

      expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Karyawan').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Penggajian').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Ekspor').length).toBeGreaterThan(0);
    });

    it('tidak menampilkan menu Pengaturan dan Audit Trail', () => {
      renderSidebar();

      expect(screen.queryByText('Pengaturan')).not.toBeInTheDocument();
      expect(screen.queryByText('Audit Trail')).not.toBeInTheDocument();
    });

    it('tidak menampilkan menu Regular Staff', () => {
      renderSidebar();

      expect(screen.queryByText('Profil Saya')).not.toBeInTheDocument();
      expect(screen.queryByText('Slip Gaji Saya')).not.toBeInTheDocument();
    });
  });

  describe('Menu navigasi untuk Regular Staff', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u3', company_id: 'c1', role: 'regular_staff', email: 'staff@test.com', nama: 'Staff' },
        loading: false,
      });
    });

    it('menampilkan hanya Profil Saya dan Slip Gaji Saya', () => {
      renderSidebar();

      expect(screen.getAllByText('Profil Saya').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Slip Gaji Saya').length).toBeGreaterThan(0);
    });

    it('tidak menampilkan menu Owner/HR Staff', () => {
      renderSidebar();

      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Karyawan')).not.toBeInTheDocument();
      expect(screen.queryByText('Penggajian')).not.toBeInTheDocument();
      expect(screen.queryByText('Ekspor')).not.toBeInTheDocument();
      expect(screen.queryByText('Pengaturan')).not.toBeInTheDocument();
      expect(screen.queryByText('Audit Trail')).not.toBeInTheDocument();
    });
  });

  describe('Mobile sidebar', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u1', company_id: 'c1', role: 'owner', email: 'owner@test.com', nama: 'Owner' },
        loading: false,
      });
    });

    it('memanggil onMobileClose saat tombol tutup diklik', () => {
      const onMobileClose = vi.fn();
      renderSidebar({ mobileOpen: true, onMobileClose });

      const closeButton = screen.getByLabelText('Tutup menu');
      fireEvent.click(closeButton);

      expect(onMobileClose).toHaveBeenCalledTimes(1);
    });

    it('memanggil onMobileClose saat overlay diklik', () => {
      const onMobileClose = vi.fn();
      renderSidebar({ mobileOpen: true, onMobileClose });

      // The overlay is the div with aria-hidden="true" (not SVG icons)
      const overlay = document.querySelector('div[aria-hidden="true"]');
      expect(overlay).not.toBeNull();
      fireEvent.click(overlay!);

      expect(onMobileClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u1', company_id: 'c1', role: 'owner', email: 'owner@test.com', nama: 'Owner' },
        loading: false,
      });
    });

    it('memiliki aria-label pada navigasi', () => {
      renderSidebar();

      expect(screen.getByLabelText('Navigasi sidebar')).toBeInTheDocument();
    });

    it('menggunakan elemen nav untuk navigasi', () => {
      renderSidebar();

      const navElements = document.querySelectorAll('nav');
      expect(navElements.length).toBeGreaterThan(0);
    });
  });
});
