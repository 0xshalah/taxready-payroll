/**
 * BottomNav — Mobile bottom navigation bar
 * Visible only on mobile (<768px), hidden on desktop.
 * Provides quick access to the 4 most important sections.
 * Touch targets are minimum 44px as per Apple HIG / Material Design.
 */

import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calculator, FileDown } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/lib/utils';

const BOTTOM_NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Karyawan', to: '/employees', icon: Users },
  { label: 'Penggajian', to: '/payroll/process', icon: Calculator },
  { label: 'Ekspor', to: '/export', icon: FileDown },
];

export function BottomNav() {
  const { user } = useAuth();

  // Only show for owner and hr_staff (not regular_staff)
  if (!user || user.role === 'regular_staff') return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-hairline bg-canvas dark:bg-canvas-card/90 dark:backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navigasi bawah"
    >
      <div className="flex items-stretch">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-ink-mute hover:text-ink'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
