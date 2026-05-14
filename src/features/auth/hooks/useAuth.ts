/**
 * Hook autentikasi: re-exports from AuthContext
 * Validates: Persyaratan 9.1, 7.4
 *
 * This hook now delegates to the shared AuthContext provider,
 * ensuring a single source of truth for auth state across the app.
 * This fixes the "stuck on Memuat..." issue caused by multiple
 * independent auth state instances racing against each other.
 */

import { useAuthContext } from '@/features/auth/context/AuthContext';
import type { AuthState, LoginCredentials, RegisterData } from '@/types/auth';

export type { AuthState, LoginCredentials, RegisterData };

/**
 * Hook utama untuk autentikasi.
 * Delegates to shared AuthContext — must be used within AuthProvider.
 */
export function useAuth() {
  return useAuthContext();
}
