/**
 * ProtectedRoute — RBAC guard component
 * Validates: Persyaratan 9.2, 9.3, 9.4, 9.5
 *
 * Cek autentikasi dan role sebelum render halaman:
 * - Jika user belum login → redirect ke /login
 * - Jika user tidak punya izin → tampilkan "Akses ditolak" dan catat ke audit_logs
 */

import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { checkPermission } from '@/lib/rbac';
import { logUnauthorizedAccess } from '@/lib/auditLogger';
import type { Resource, Action } from '@/types/auth';

export interface ProtectedRouteProps {
  /** Konten halaman yang dilindungi */
  children: React.ReactNode;
  /** Resource yang dibutuhkan untuk mengakses halaman ini */
  resource: Resource;
  /** Action minimum yang dibutuhkan (default: 'read') */
  action?: Action;
}

/**
 * Komponen guard yang membungkus route dan memeriksa:
 * 1. Apakah user sudah terautentikasi
 * 2. Apakah user memiliki permission yang sesuai
 *
 * Jika tidak terautentikasi → redirect ke /login
 * Jika tidak memiliki izin → tampilkan pesan "Akses ditolak" + log audit
 */
export function ProtectedRoute({ children, resource, action = 'read' }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const hasLoggedRef = useRef(false);

  const isAuthenticated = !!user;
  const hasPermission = user ? checkPermission(user.role, resource, action) : false;

  // Catat unauthorized access ke audit_logs (sekali saja)
  useEffect(() => {
    if (!loading && isAuthenticated && !hasPermission && user && !hasLoggedRef.current) {
      hasLoggedRef.current = true;
      logUnauthorizedAccess({
        userId: user.id,
        companyId: user.company_id,
        userRole: user.role,
        attemptedResource: resource,
        attemptedAction: action,
      });
    }
  }, [loading, isAuthenticated, hasPermission, user, resource, action]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
          <p className="text-sm text-ink-mute">Memuat...</p>
        </div>
      </div>
    );
  }

  // Belum login → redirect ke /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Tidak punya izin → tampilkan pesan akses ditolak
  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Akses Ditolak</h1>
          <p className="text-gray-600">
            Anda tidak memiliki izin untuk mengakses halaman ini.
            Silakan hubungi administrator jika Anda memerlukan akses.
          </p>
        </div>
      </div>
    );
  }

  // Semua cek lolos → render children
  return <>{children}</>;
}
