/**
 * ProtectedRoute — RBAC guard component
 * Validates: Persyaratan 9.2, 9.3, 9.4, 9.5
 *
 * Cek autentikasi dan role sebelum render halaman:
 * - Jika user belum login → redirect ke /login
 * - Jika user tidak punya izin → tampilkan "Akses ditolak" dan catat ke audit_logs
 * - SECURITY FIX (2026-05-15): Tampilkan warning MFA untuk Owner/HR Staff
 */

import { useEffect, useRef, useState } from 'react';
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
 * 3. SECURITY: Apakah Owner/HR Staff sudah aktifkan MFA
 *
 * Jika tidak terautentikasi → redirect ke /login
 * Jika tidak memiliki izin → tampilkan pesan "Akses ditolak" + log audit
 */
export function ProtectedRoute({ children, resource, action = 'read' }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const hasLoggedRef = useRef(false);
  const [showMFAWarning, setShowMFAWarning] = useState(false);

  const isAuthenticated = !!user;
  // Jika company_id kosong, profil belum lengkap (masih fallback dari session)
  const isProfileLoading = isAuthenticated && !user?.company_id;
  const hasPermission = user ? checkPermission(user.role, resource, action) : false;

  // SECURITY: Check MFA status untuk Owner dan HR Staff
  const needsMFA = user && (user.role === 'owner' || user.role === 'hr_staff') && user.mfa_enabled === false;

  // Catat unauthorized access ke audit_logs (sekali saja, hanya setelah profil lengkap)
  useEffect(() => {
    if (!loading && !isProfileLoading && isAuthenticated && !hasPermission && user && !hasLoggedRef.current) {
      hasLoggedRef.current = true;
      logUnauthorizedAccess({
        userId: user.id,
        companyId: user.company_id,
        userRole: user.role,
        attemptedResource: resource,
        attemptedAction: action,
      });
    }
  }, [loading, isProfileLoading, isAuthenticated, hasPermission, user, resource, action]);

  // Show MFA warning banner jika Owner/HR belum aktifkan MFA
  useEffect(() => {
    if (needsMFA && !showMFAWarning) {
      setShowMFAWarning(true);
    }
  }, [needsMFA, showMFAWarning]);

  // Loading state
  if (loading || isProfileLoading) {
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

  // Semua cek lolos → render children dengan MFA warning banner jika perlu
  return (
    <>
      {showMFAWarning && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-3">
          <div className="flex items-start justify-between max-w-7xl mx-auto">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Keamanan Akun: MFA Belum Aktif
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Untuk keamanan maksimal, aktifkan Multi-Factor Authentication (MFA) di halaman Profil. 
                  Akun {user.role === 'owner' ? 'Owner' : 'HR Staff'} sangat rentan terhadap serangan credential theft.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowMFAWarning(false)}
              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 ml-4"
              aria-label="Tutup peringatan"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
