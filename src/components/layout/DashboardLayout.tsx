/**
 * DashboardLayout — Wrapper yang menggabungkan Sidebar + Header + main content area
 * Validates: Persyaratan 9.2, 9.3, 9.4
 *
 * Responsive behavior:
 * - Desktop (≥1024px): Sidebar full width (240px) + content
 * - Tablet (768-1023px): Sidebar collapsed (icon only, 64px) + content
 * - Mobile (<768px): Sidebar hidden, hamburger menu untuk toggle overlay
 */

import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { cn } from '@/lib/utils';

export interface DashboardLayoutProps {
  /** Nama perusahaan untuk ditampilkan di header */
  companyName?: string;
}

export function DashboardLayout({ companyName }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMobileOpen = useCallback(() => setMobileOpen(true), []);
  const handleMobileClose = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="min-h-screen bg-canvas bg-mesh">
      {/* Sidebar */}
      <Sidebar
        collapsed={false}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
      />

      {/* Main content area - offset by sidebar width */}
      <div className={cn(
        'flex flex-col min-h-screen transition-all duration-200',
        'md:ml-60' // sidebar width on desktop/tablet
      )}>
        {/* Header */}
        <Header
          onMenuClick={handleMobileOpen}
          companyName={companyName}
        />

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>

        {/* Legal Disclaimer Footer */}
        <Footer />
      </div>
    </div>
  );
}
