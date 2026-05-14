/**
 * Unit tests untuk DashboardLayout component
 * Validates: Persyaratan 9.2, 9.3, 9.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock ThemeToggle to avoid ThemeProvider dependency
vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => null,
}));

function renderDashboardLayout(props = {}) {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<DashboardLayout {...props} />}>
          <Route path="/dashboard" element={<div data-testid="page-content">Dashboard Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('DashboardLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', company_id: 'c1', role: 'owner', email: 'owner@test.com', nama: 'Admin' },
      loading: false,
      logout: vi.fn(),
    });
  });

  it('render Sidebar, Header, dan konten halaman', () => {
    renderDashboardLayout({ companyName: 'PT Test' });

    // Header shows company name
    expect(screen.getByText('PT Test')).toBeInTheDocument();

    // Page content renders via Outlet
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });

  it('menampilkan navigasi sidebar', () => {
    renderDashboardLayout();

    // Sidebar nav items for Owner
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Karyawan').length).toBeGreaterThan(0);
  });

  it('toggle mobile sidebar saat hamburger diklik', () => {
    renderDashboardLayout();

    // Initially, mobile overlay should not be present
    expect(document.querySelector('div[aria-hidden="true"]')).toBeNull();

    // Click hamburger
    const menuButton = screen.getByLabelText('Buka menu navigasi');
    fireEvent.click(menuButton);

    // Mobile overlay should appear (it's a div, not an SVG)
    expect(document.querySelector('div[aria-hidden="true"]')).not.toBeNull();
  });

  it('menutup mobile sidebar saat overlay diklik', () => {
    renderDashboardLayout();

    // Open mobile sidebar
    const menuButton = screen.getByLabelText('Buka menu navigasi');
    fireEvent.click(menuButton);

    // Click overlay to close
    const overlay = document.querySelector('div[aria-hidden="true"]');
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay!);

    // Overlay should disappear
    expect(document.querySelector('div[aria-hidden="true"]')).toBeNull();
  });

  it('memiliki elemen main untuk konten', () => {
    renderDashboardLayout();

    const mainElement = document.querySelector('main');
    expect(mainElement).not.toBeNull();
    expect(mainElement).toContainElement(screen.getByTestId('page-content'));
  });
});
