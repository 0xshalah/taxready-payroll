import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calculator, FileDown } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/lib/utils';
import { getAccessibleResources } from '@/lib/rbac';

interface BottomNavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  resource: string;
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, resource: 'employees' },
  { label: 'Karyawan', to: '/employees', icon: Users, resource: 'employees' },
  { label: 'Penggajian', to: '/payroll/process', icon: Calculator, resource: 'payroll' },
  { label: 'Ekspor', to: '/export', icon: FileDown, resource: 'export' },
];

export function BottomNav() {
  const { user } = useAuth();

  if (!user) return null;

  const accessibleResources = getAccessibleResources(user.role);

  // Filter items by RBAC permissions
  const visibleItems = BOTTOM_NAV_ITEMS.filter(
    (item) => accessibleResources.includes(item.resource as never)
  );

  if (visibleItems.length === 0) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-hairline bg-canvas dark:bg-canvas-card/90 dark:backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navigasi bawah"
    >
      <div className="flex items-stretch">
        {visibleItems.map((item) => (
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
