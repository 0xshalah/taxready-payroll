/**
 * Sidebar — Dashboard navigation sidebar
 * Validates: Persyaratan 9.2, 9.3, 9.4
 *
 * Menampilkan menu navigasi berdasarkan role pengguna:
 * - Owner: Dashboard, Karyawan, Penggajian, Ekspor, Pengaturan, Audit Trail
 * - HR Staff: Dashboard, Karyawan, Penggajian, Ekspor
 * - Regular Staff: Profil Saya, Slip Gaji Saya
 */

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calculator,
  FileDown,
  Settings,
  Shield,
  User,
  FileText,
  History,
  X,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getAccessibleResources } from '@/lib/rbac';
import { cn } from '@/lib/utils';
import type { Resource, UserRole } from '@/types/auth';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  resource: Resource;
}

/**
 * Definisi menu navigasi lengkap.
 * Ditampilkan berdasarkan resource yang dapat diakses oleh role pengguna.
 */
const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, resource: 'employees' },
  { label: 'Karyawan', to: '/employees', icon: Users, resource: 'employees' },
  { label: 'Penggajian', to: '/payroll/process', icon: Calculator, resource: 'payroll' },
  { label: 'Riwayat Gaji', to: '/payroll/history', icon: FileText, resource: 'payroll' },
  { label: 'Ekspor', to: '/export', icon: FileDown, resource: 'export' },
  { label: 'Changelog Tarif', to: '/tarif-changelog', icon: History, resource: 'tarif_changelog' },
  { label: 'Pengaturan', to: '/settings', icon: Settings, resource: 'settings' },
  { label: 'Audit Trail', to: '/audit', icon: Shield, resource: 'audit' },
  { label: 'Profil Saya', to: '/profile', icon: User, resource: 'profile' },
  { label: 'Slip Gaji Saya', to: '/my-payslips', icon: FileText, resource: 'my_payslips' },
];

/**
 * Filter menu items yang ditampilkan berdasarkan role.
 * Regular Staff hanya melihat Profil Saya dan Slip Gaji Saya.
 * Owner/HR Staff melihat menu utama tanpa Profil Saya/Slip Gaji Saya.
 */
function getNavItemsForRole(role: UserRole): NavItem[] {
  const accessibleResources = getAccessibleResources(role);

  if (role === 'regular_staff') {
    // Regular Staff hanya melihat profil dan slip gaji
    return NAV_ITEMS.filter(
      (item) => item.resource === 'profile' || item.resource === 'my_payslips'
    );
  }

  // Owner dan HR Staff melihat menu utama (tanpa profil/slip gaji)
  return NAV_ITEMS.filter(
    (item) =>
      accessibleResources.includes(item.resource) &&
      item.resource !== 'profile' &&
      item.resource !== 'my_payslips'
  );
}

export interface SidebarProps {
  /** Apakah sidebar dalam mode collapsed (icon only) untuk tablet */
  collapsed?: boolean;
  /** Apakah sidebar terbuka di mobile (overlay) */
  mobileOpen?: boolean;
  /** Callback untuk menutup sidebar di mobile */
  onMobileClose?: () => void;
}

export function Sidebar({ collapsed = false, mobileOpen = false, onMobileClose }: SidebarProps) {
  const { user } = useAuth();

  if (!user) return null;

  const navItems = getNavItemsForRole(user.role);

  const sidebarContent = (
    <nav className="flex flex-col h-full" aria-label="Navigasi utama">
      {/* Logo / Brand area */}
      <div className={cn(
        'flex items-center border-b border-hairline',
        collapsed ? 'justify-center px-2 py-4' : 'px-4 py-4'
      )}>
        {collapsed ? (
          <span className="text-primary font-medium text-lg">TP</span>
        ) : (
          <span className="text-ink font-medium text-base tracking-tight">
            Tax-Ready Payroll
          </span>
        )}
      </div>

      {/* Navigation items */}
      <ul className="flex-1 py-2 px-2 space-y-1" role="list">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              onClick={onMobileClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-sm transition-colors',
                  collapsed ? 'justify-center px-2 py-2' : 'px-4 py-2',
                  isActive
                    ? 'bg-canvas-soft text-ink font-medium'
                    : 'text-ink-mute hover:bg-canvas-soft hover:text-ink'
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar (slide-in) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 bg-canvas border-r border-hairline transform transition-transform duration-200 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Navigasi sidebar mobile"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
          <span className="text-ink font-medium text-base">Menu</span>
          <button
            onClick={onMobileClose}
            className="p-1 rounded-sm text-ink-mute hover:text-ink hover:bg-canvas-soft"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop/Tablet sidebar */}
      <aside
        className={cn(
          'hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 bg-canvas border-r border-hairline transition-all duration-200 dark:bg-canvas-card dark:backdrop-blur-sm',
          collapsed ? 'md:w-16' : 'md:w-60'
        )}
        aria-label="Navigasi sidebar"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
