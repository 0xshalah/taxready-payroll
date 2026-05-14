/**
 * Header — Dashboard top bar
 * Validates: Persyaratan 9.2, 9.3, 9.4
 *
 * Menampilkan:
 * - Kiri: Hamburger menu (mobile) + nama perusahaan
 * - Kanan: Avatar pengguna + role badge
 */

import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/auth';

/** Label role yang ditampilkan di badge */
const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  hr_staff: 'HR Staff',
  regular_staff: 'Staff',
};

export interface HeaderProps {
  /** Callback untuk membuka sidebar di mobile */
  onMenuClick?: () => void;
  /** Nama perusahaan yang ditampilkan */
  companyName?: string;
  /** Tambahan className */
  className?: string;
}

export function Header({ onMenuClick, companyName, className }: HeaderProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const displayName = user.nama || user.email;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header
      className={cn(
        'flex items-center justify-between bg-canvas border-b border-hairline px-4 py-3 md:px-6 dark:bg-canvas-card/50 dark:backdrop-blur-sm',
        className
      )}
    >
      {/* Left side: hamburger + company name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-sm text-ink-mute hover:text-ink hover:bg-canvas-soft md:hidden"
          aria-label="Buka menu navigasi"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-sm font-medium text-ink truncate max-w-[200px] sm:max-w-none">
          {companyName || 'Tax-Ready Payroll'}
        </h1>
      </div>

      {/* Right side: user info + role badge + logout */}
      <div className="flex items-center gap-3">
        <Badge variant="role" className="hidden sm:inline-flex">
          {ROLE_LABELS[user.role]}
        </Badge>

        {/* Avatar */}
        <div
          className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-xs font-medium"
          aria-label={`Avatar ${displayName}`}
          title={displayName}
        >
          {initials}
        </div>

        {/* User name (hidden on small screens) */}
        <span className="hidden lg:inline text-sm text-ink truncate max-w-[150px]">
          {displayName}
        </span>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Logout button */}
        <button
          onClick={() => logout()}
          className="p-1.5 rounded-sm text-ink-mute hover:text-ink hover:bg-canvas-soft"
          aria-label="Keluar"
          title="Keluar"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
