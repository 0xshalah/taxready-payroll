/**
 * AuthContext — Shared authentication state provider
 * 
 * Optimized for speed:
 * - No unnecessary retries/delays
 * - Short timeouts (2s for init, 8s for login)
 * - Single fetch path, no race conditions
 */

import { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { DEFAULT_BPJS_CONFIG } from '@/lib/constants';
import type { AuthState, LoginCredentials, RegisterData, User } from '@/types/auth';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Fetch user profile — simple and fast, no extra timeout wrapper.
 * Supabase queries have their own internal timeout.
 */
async function fetchUserProfile(authUserId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, company_id, email, nama, role, created_at')
    .eq('id', authUserId)
    .single();

  if (error || !data) return null;
  return data as User;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const manualAuthInProgress = useRef(false);
  const logoutIntended = useRef(false);

  useEffect(() => {
    let mounted = true;

    // Timeout fallback: hanya jika getSession() sendiri hang (sangat jarang)
    // Diperpanjang ke 10 detik — getSession() baca localStorage, harusnya instan
    const timeout = setTimeout(() => {
      if (mounted) {
        setState(prev => prev.loading ? { user: null, loading: false, error: null } : prev);
      }
    }, 10_000);

    // Fast init: getSession() baca dari localStorage — biasanya < 50ms
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted || manualAuthInProgress.current) return;

      if (session?.user) {
        // LANGSUNG set user dari session data (tanpa tunggu DB query)
        // Ini yang mencegah redirect ke login saat refresh
        const immediateUser: User = {
          id: session.user.id,
          company_id: (session.user.user_metadata?.company_id as string) ?? '',
          email: session.user.email ?? '',
          nama: (session.user.user_metadata?.nama as string) ?? session.user.email?.split('@')[0] ?? 'User',
          role: (session.user.user_metadata?.role as User['role']) ?? 'regular_staff',
          created_at: session.user.created_at ?? new Date().toISOString(),
        };

        // Set loading: false SEGERA dengan data dari session
        if (mounted && !manualAuthInProgress.current) {
          setState({ user: immediateUser, loading: false, error: null });
        }

        // Kemudian fetch profil lengkap dari DB di background (non-blocking)
        fetchUserProfile(session.user.id).then(profile => {
          if (mounted && !manualAuthInProgress.current && profile) {
            setState({ user: profile, loading: false, error: null });
          }
        }).catch(() => {
          // Profile fetch gagal — tetap pakai immediateUser dari session
        });
      } else {
        setState({ user: null, loading: false, error: null });
      }
    }).catch(() => {
      if (mounted) setState({ user: null, loading: false, error: null });
    });

    // Listen for subsequent changes only
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted || manualAuthInProgress.current) return;
        if (event === 'INITIAL_SESSION') return;

        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (mounted && !manualAuthInProgress.current) {
            if (profile) {
              setState({ user: profile, loading: false, error: null });
            } else {
              const fallbackUser: User = {
                id: session.user.id,
                company_id: (session.user.user_metadata?.company_id as string) ?? '',
                email: session.user.email ?? '',
                nama: (session.user.user_metadata?.nama as string) ?? session.user.email?.split('@')[0] ?? 'User',
                role: (session.user.user_metadata?.role as User['role']) ?? 'regular_staff',
                created_at: session.user.created_at ?? new Date().toISOString(),
              };
              setState({ user: fallbackUser, loading: false, error: null });
            }
          }
        } else if (event === 'SIGNED_OUT') {
          // Hanya clear user jika logout memang disengaja
          // (SIGNED_OUT bisa fire spuriously saat token refresh / page load)
          if (logoutIntended.current && mounted) {
            setState({ user: null, loading: false, error: null });
            logoutIntended.current = false;
          }
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    setState(prev => ({ ...prev, error: null }));
    manualAuthInProgress.current = true;

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        const errorMessage = authError.message === 'Invalid login credentials'
          ? 'Email atau password salah'
          : authError.message;
        setState(prev => ({ ...prev, error: errorMessage }));
        throw new Error(errorMessage);
      }

      if (!authData.user) {
        const errorMessage = 'Login gagal: user tidak ditemukan';
        setState(prev => ({ ...prev, error: errorMessage }));
        throw new Error(errorMessage);
      }

      // Try to fetch full profile from users table
      const profile = await fetchUserProfile(authData.user.id);

      if (profile) {
        // Update user_metadata di Supabase Auth agar session refresh punya data lengkap
        void supabase.auth.updateUser({
          data: {
            role: profile.role,
            company_id: profile.company_id,
            nama: profile.nama,
          },
        });
        setState({ user: profile, loading: false, error: null });
        return profile;
      }

      // If profile fetch fails (RLS, table not ready, etc.),
      // construct a minimal user from auth data with LEAST PRIVILEGE (regular_staff).
      // The full profile will be fetched on next page load.
      const fallbackUser: User = {
        id: authData.user.id,
        company_id: (authData.user.user_metadata?.company_id as string) ?? '',
        email: authData.user.email ?? credentials.email,
        nama: (authData.user.user_metadata?.nama as string) ?? credentials.email.split('@')[0] ?? 'User',
        role: (authData.user.user_metadata?.role as User['role']) ?? 'regular_staff',
        created_at: authData.user.created_at ?? new Date().toISOString(),
      };

      setState({ user: fallbackUser, loading: false, error: null });
      return fallbackUser;
    } finally {
      manualAuthInProgress.current = false;
    }
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<User> => {
    setState(prev => ({ ...prev, error: null }));
    manualAuthInProgress.current = true;

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        const errorMessage = authError.message.includes('already registered')
          ? 'Email sudah terdaftar'
          : authError.message;
        setState(prev => ({ ...prev, error: errorMessage }));
        throw new Error(errorMessage);
      }

      if (!authData.user) {
        const errorMessage = 'Registrasi gagal: tidak dapat membuat akun';
        setState(prev => ({ ...prev, error: errorMessage }));
        throw new Error(errorMessage);
      }

      const authUserId = authData.user.id;

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
        // Note: orphaned auth user will be cleaned up by database trigger or manual admin action
        const errorMessage = companyError.message.includes('npwp_badan')
          ? 'NPWP Badan sudah terdaftar'
          : `Gagal membuat perusahaan: ${companyError.message}`;
        setState(prev => ({ ...prev, error: errorMessage }));
        throw new Error(errorMessage);
      }

      const companyId = companyData.id as string;

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
        setState(prev => ({ ...prev, error: errorMessage }));
        throw new Error(errorMessage);
      }

      // Store role & company_id in auth user_metadata for fallback access
      await supabase.auth.updateUser({
        data: { role: 'owner', company_id: companyId, nama: data.nama },
      });

      // Auto-create BPJS config (non-blocking)
      void supabase.from('bpjs_config').insert({
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

      const profile = await fetchUserProfile(authUserId);

      if (!profile) {
        const errorMessage = 'Registrasi berhasil tetapi gagal memuat profil';
        setState(prev => ({ ...prev, error: errorMessage }));
        throw new Error(errorMessage);
      }

      setState({ user: profile, loading: false, error: null });
      return profile;
    } catch (error) {
      if (error instanceof Error) {
        setState(prev => ({ ...prev, error: prev.error || error.message }));
      }
      throw error;
    } finally {
      manualAuthInProgress.current = false;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    logoutIntended.current = true;
    const { error } = await supabase.auth.signOut();
    if (error) {
      logoutIntended.current = false;
      setState(prev => ({ ...prev, error: error.message }));
      throw new Error(error.message);
    }
    setState({ user: null, loading: false, error: null });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        loading: state.loading,
        error: state.error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
