/**
 * Hook autentikasi: login, logout, register company, get current user + role
 * Validates: Persyaratan 9.1, 7.4
 *
 * Flow Register:
 *   1. Supabase Auth signUp (email + password)
 *   2. Insert ke tabel `companies`
 *   3. Insert ke tabel `users` dengan role 'owner'
 *   4. Auto-create bpjs_config default
 *
 * Flow Login:
 *   1. Supabase Auth signInWithPassword
 *   2. Fetch user record dari tabel `users` untuk mendapatkan role dan company_id
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DEFAULT_BPJS_CONFIG } from '@/lib/constants';
import type { AuthState, LoginCredentials, RegisterData, User } from '@/types/auth';

export type { AuthState, LoginCredentials, RegisterData };

/**
 * Fetch user profile dari tabel `users` berdasarkan auth uid
 */
async function fetchUserProfile(authUserId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, company_id, email, nama, role, created_at')
    .eq('id', authUserId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as User;
}

/**
 * Hook utama untuk autentikasi
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  /**
   * Inisialisasi: cek session aktif dan subscribe ke auth state changes
   */
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (mounted) {
            setState({
              user: profile,
              loading: false,
              error: profile ? null : 'User profile not found',
            });
          }
        } else {
          if (mounted) {
            setState({ user: null, loading: false, error: null });
          }
        }
      } catch {
        if (mounted) {
          setState({ user: null, loading: false, error: 'Failed to initialize auth' });
        }
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setState({
            user: profile,
            loading: false,
            error: profile ? null : 'User profile not found',
          });
        } else if (event === 'SIGNED_OUT') {
          setState({ user: null, loading: false, error: null });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Login: Supabase Auth signInWithPassword → fetch user role dari tabel users
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (authError) {
      const errorMessage = authError.message === 'Invalid login credentials'
        ? 'Email atau password salah'
        : authError.message;
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }

    if (!authData.user) {
      const errorMessage = 'Login gagal: user tidak ditemukan';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }

    const profile = await fetchUserProfile(authData.user.id);

    if (!profile) {
      // User exists in auth but not in users table — sign out
      await supabase.auth.signOut();
      const errorMessage = 'Akun belum terdaftar dalam sistem. Silakan hubungi admin.';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }

    setState({ user: profile, loading: false, error: null });
    return profile;
  }, []);

  /**
   * Register: buat company → buat user dengan role 'owner' → auto-create bpjs_config default
   */
  const register = useCallback(async (data: RegisterData): Promise<User> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    // Step 1: Supabase Auth signUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      const errorMessage = authError.message.includes('already registered')
        ? 'Email sudah terdaftar'
        : authError.message;
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }

    if (!authData.user) {
      const errorMessage = 'Registrasi gagal: tidak dapat membuat akun';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }

    const authUserId = authData.user.id;

    try {
      // Step 2: Insert ke tabel companies
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          nama_perusahaan: data.nama_perusahaan,
          npwp_badan: data.npwp_badan,
          alamat: data.alamat ?? null,
          jkk_risk_class: data.jkk_risk_class ?? 1,
        })
        .select('id')
        .single();

      if (companyError) {
        // Rollback: hapus auth user jika company gagal dibuat
        await supabase.auth.admin.deleteUser(authUserId).catch(() => {
          // Best effort rollback — admin API may not be available from client
        });
        const errorMessage = companyError.message.includes('npwp_badan')
          ? 'NPWP Badan sudah terdaftar'
          : `Gagal membuat perusahaan: ${companyError.message}`;
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
        throw new Error(errorMessage);
      }

      const companyId = companyData.id as string;

      // Step 3: Insert ke tabel users dengan role 'owner'
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          company_id: companyId,
          email: data.email,
          nama: data.nama,
          role: 'owner',
        });

      if (userError) {
        const errorMessage = `Gagal membuat profil pengguna: ${userError.message}`;
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
        throw new Error(errorMessage);
      }

      // Step 4: Auto-create bpjs_config default
      const { error: bpjsError } = await supabase
        .from('bpjs_config')
        .insert({
          company_id: companyId,
          jht_employer_rate: DEFAULT_BPJS_CONFIG.jht_employer_rate,
          jht_employee_rate: DEFAULT_BPJS_CONFIG.jht_employee_rate,
          jp_employer_rate: DEFAULT_BPJS_CONFIG.jp_employer_rate,
          jp_employee_rate: DEFAULT_BPJS_CONFIG.jp_employee_rate,
          jkm_employer_rate: DEFAULT_BPJS_CONFIG.jkm_employer_rate,
          jkk_rate: DEFAULT_BPJS_CONFIG.jkk_rate,
          jkp_employer_rate: DEFAULT_BPJS_CONFIG.jkp_employer_rate,
          kes_employer_rate: DEFAULT_BPJS_CONFIG.kesehatan_employer_rate,
          kes_employee_rate: DEFAULT_BPJS_CONFIG.kesehatan_employee_rate,
          jp_wage_ceiling: DEFAULT_BPJS_CONFIG.jp_wage_ceiling,
          kes_wage_ceiling: DEFAULT_BPJS_CONFIG.kesehatan_wage_ceiling,
          jkk_discount_start: DEFAULT_BPJS_CONFIG.jkk_discount_start,
          jkk_discount_end: DEFAULT_BPJS_CONFIG.jkk_discount_end,
        });

      if (bpjsError) {
        // Non-fatal: log warning but don't fail registration
        console.warn('Gagal membuat konfigurasi BPJS default:', bpjsError.message);
      }

      // Fetch the complete user profile
      const profile = await fetchUserProfile(authUserId);

      if (!profile) {
        const errorMessage = 'Registrasi berhasil tetapi gagal memuat profil';
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
        throw new Error(errorMessage);
      }

      setState({ user: profile, loading: false, error: null });
      return profile;
    } catch (error) {
      // Re-throw if already handled
      if (error instanceof Error && state.error) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Registrasi gagal';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [state.error]);

  /**
   * Logout: Supabase Auth signOut
   */
  const logout = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const { error } = await supabase.auth.signOut();

    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw new Error(error.message);
    }

    setState({ user: null, loading: false, error: null });
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    clearError,
  };
}
