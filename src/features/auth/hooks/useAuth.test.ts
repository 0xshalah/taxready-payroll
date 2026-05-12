/**
 * Unit tests untuk useAuth hook
 * Validates: Persyaratan 9.1, 7.4
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from './useAuth';

// Mock Supabase client
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockFrom = vi.fn();
const mockAdminDeleteUser = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      admin: {
        deleteUser: (...args: unknown[]) => mockAdminDeleteUser(...args),
      },
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Helper to create a chainable mock for supabase.from()
function createQueryMock(resolvedData: unknown, resolvedError: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: resolvedData, error: resolvedError }),
  };
  return chain;
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: no active session
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  describe('initialization', () => {
    it('should start with loading=true and then resolve to no user when no session', async () => {
      const { result } = renderHook(() => useAuth());

      // Initially loading
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should load user profile when session exists', async () => {
      const mockUser = {
        id: 'user-123',
        company_id: 'company-456',
        email: 'test@example.com',
        nama: 'Test User',
        role: 'owner',
        created_at: '2026-01-01T00:00:00Z',
      };

      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      });

      const queryMock = createQueryMock(mockUser);
      mockFrom.mockReturnValue(queryMock);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.error).toBeNull();
    });
  });

  describe('login', () => {
    it('should login successfully and fetch user profile', async () => {
      const mockUser = {
        id: 'user-123',
        company_id: 'company-456',
        email: 'test@example.com',
        nama: 'Test User',
        role: 'owner',
        created_at: '2026-01-01T00:00:00Z',
      };

      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const queryMock = createQueryMock(mockUser);
      mockFrom.mockReturnValue(queryMock);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let loginResult: unknown;
      await act(async () => {
        loginResult = await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      expect(loginResult).toEqual(mockUser);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.error).toBeNull();
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle invalid credentials error', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(
          result.current.login({ email: 'bad@example.com', password: 'wrong' })
        ).rejects.toThrow('Email atau password salah');
      });

      expect(result.current.error).toBe('Email atau password salah');
    });

    it('should sign out if user exists in auth but not in users table', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: 'orphan-user' } },
        error: null,
      });

      const queryMock = createQueryMock(null, { message: 'not found' });
      mockFrom.mockReturnValue(queryMock);
      mockSignOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(
          result.current.login({ email: 'orphan@example.com', password: 'pass' })
        ).rejects.toThrow('Akun belum terdaftar dalam sistem');
      });

      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register company with full flow: signUp → company → user → bpjs_config', async () => {
      const mockProfile = {
        id: 'new-user-id',
        company_id: 'new-company-id',
        email: 'owner@company.com',
        nama: 'Owner Name',
        role: 'owner',
        created_at: '2026-01-01T00:00:00Z',
      };

      mockSignUp.mockResolvedValue({
        data: { user: { id: 'new-user-id' } },
        error: null,
      });

      // Mock for companies insert
      const companiesInsertMock = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'new-company-id' },
              error: null,
            }),
          }),
        }),
      };

      // Mock for users insert
      const usersInsertMock = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };

      // Mock for bpjs_config insert
      const bpjsInsertMock = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };

      // Mock for users select (fetchUserProfile)
      const usersSelectMock = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }),
        }),
      };

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'companies') return companiesInsertMock;
        if (table === 'users') {
          callCount++;
          // First call is insert, second is select (fetchUserProfile)
          if (callCount === 1) return usersInsertMock;
          return usersSelectMock;
        }
        if (table === 'bpjs_config') return bpjsInsertMock;
        return createQueryMock(null);
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let registerResult: unknown;
      await act(async () => {
        registerResult = await result.current.register({
          email: 'owner@company.com',
          password: 'securepass123',
          nama: 'Owner Name',
          nama_perusahaan: 'PT Test Company',
          npwp_badan: '1234567890123456',
        });
      });

      expect(registerResult).toEqual(mockProfile);
      expect(result.current.user).toEqual(mockProfile);
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'owner@company.com',
        password: 'securepass123',
      });
    });

    it('should handle duplicate email error', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(
          result.current.register({
            email: 'existing@example.com',
            password: 'pass123',
            nama: 'Test',
            nama_perusahaan: 'PT Test',
            npwp_badan: '1234567890123456',
          })
        ).rejects.toThrow('Email sudah terdaftar');
      });

      expect(result.current.error).toBe('Email sudah terdaftar');
    });
  });

  describe('logout', () => {
    it('should sign out and clear user state', async () => {
      const mockUser = {
        id: 'user-123',
        company_id: 'company-456',
        email: 'test@example.com',
        nama: 'Test User',
        role: 'owner',
        created_at: '2026-01-01T00:00:00Z',
      };

      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      });

      const queryMock = createQueryMock(mockUser);
      mockFrom.mockReturnValue(queryMock);
      mockSignOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.login({ email: 'bad@test.com', password: 'wrong' });
        } catch {
          // expected
        }
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
