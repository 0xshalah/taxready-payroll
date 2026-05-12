/**
 * Tests untuk useAuditLogs hook — filter logic dan query key building
 * Validates: Persyaratan 10.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildAuditLogsQueryKey, fetchAuditLogs } from './useAuditLogs';
import type { AuditLogFilters } from './useAuditLogs';

// ============================================================
// Mock Supabase — chainable query builder
// ============================================================

const mockRange = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();

/**
 * Setup chainable mock — setiap method mengembalikan builder yang sama,
 * kecuali range() yang mengembalikan hasil akhir (terminal).
 */
function setupMockChain(responseData: unknown[] | null = [], count: number = 0, error: unknown = null) {
  const terminalResult = { data: responseData, error, count };

  // Satu builder object yang digunakan oleh semua chainable methods
  const builder = {
    range: mockRange,
    gte: mockGte,
    lte: mockLte,
    eq: mockEq,
    order: mockOrder,
    select: mockSelect,
  };

  // range() adalah terminal — mengembalikan hasil akhir
  mockRange.mockReturnValue(terminalResult);

  // Semua method lain mengembalikan builder (chainable)
  mockGte.mockReturnValue(builder);
  mockLte.mockReturnValue(builder);
  mockEq.mockReturnValue(builder);
  mockOrder.mockReturnValue(builder);
  mockSelect.mockReturnValue(builder);
  mockFrom.mockReturnValue(builder);
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// ============================================================
// Tests: buildAuditLogsQueryKey
// ============================================================

describe('buildAuditLogsQueryKey', () => {
  it('should return query key with empty filters', () => {
    const key = buildAuditLogsQueryKey({});
    expect(key).toEqual(['audit_logs', {}]);
  });

  it('should include all provided filters in query key', () => {
    const filters: AuditLogFilters = {
      start_date: '2026-01-01T00:00:00+07:00',
      end_date: '2026-01-31T23:59:59+07:00',
      action_type: 'payroll_process',
      user_id: 'user-123',
      limit: 10,
      offset: 20,
    };
    const key = buildAuditLogsQueryKey(filters);
    expect(key).toEqual(['audit_logs', filters]);
  });

  it('should produce different keys for different filters', () => {
    const key1 = buildAuditLogsQueryKey({ action_type: 'payroll_process' });
    const key2 = buildAuditLogsQueryKey({ action_type: 'employee_create' });
    expect(key1).not.toEqual(key2);
  });

  it('should produce different keys for different pagination', () => {
    const key1 = buildAuditLogsQueryKey({ offset: 0 });
    const key2 = buildAuditLogsQueryKey({ offset: 20 });
    expect(key1).not.toEqual(key2);
  });
});

// ============================================================
// Tests: fetchAuditLogs
// ============================================================

describe('fetchAuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch audit logs with default pagination (limit=20, offset=0)', async () => {
    setupMockChain([], 0);

    await fetchAuditLogs({});

    expect(mockFrom).toHaveBeenCalledWith('audit_logs');
    expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact' });
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(mockRange).toHaveBeenCalledWith(0, 19); // offset=0, limit=20 → range(0, 19)
  });

  it('should apply custom pagination', async () => {
    setupMockChain([], 0);

    await fetchAuditLogs({ limit: 10, offset: 30 });

    expect(mockRange).toHaveBeenCalledWith(30, 39); // offset=30, limit=10 → range(30, 39)
  });

  it('should apply start_date filter using gte', async () => {
    setupMockChain([], 0);

    await fetchAuditLogs({ start_date: '2026-01-01T00:00:00+07:00' });

    expect(mockGte).toHaveBeenCalledWith('created_at', '2026-01-01T00:00:00+07:00');
  });

  it('should apply end_date filter using lte', async () => {
    setupMockChain([], 0);

    await fetchAuditLogs({ end_date: '2026-01-31T23:59:59+07:00' });

    expect(mockLte).toHaveBeenCalledWith('created_at', '2026-01-31T23:59:59+07:00');
  });

  it('should apply action_type filter using eq', async () => {
    setupMockChain([], 0);

    await fetchAuditLogs({ action_type: 'payroll_process' });

    expect(mockEq).toHaveBeenCalledWith('action_type', 'payroll_process');
  });

  it('should apply user_id filter using eq', async () => {
    setupMockChain([], 0);

    await fetchAuditLogs({ user_id: 'user-abc-123' });

    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-abc-123');
  });

  it('should apply all filters together', async () => {
    setupMockChain([], 0);

    await fetchAuditLogs({
      start_date: '2026-01-01T00:00:00+07:00',
      end_date: '2026-01-31T23:59:59+07:00',
      action_type: 'employee_create',
      user_id: 'user-xyz',
      limit: 5,
      offset: 10,
    });

    expect(mockGte).toHaveBeenCalledWith('created_at', '2026-01-01T00:00:00+07:00');
    expect(mockLte).toHaveBeenCalledWith('created_at', '2026-01-31T23:59:59+07:00');
    expect(mockEq).toHaveBeenCalledWith('action_type', 'employee_create');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-xyz');
    expect(mockRange).toHaveBeenCalledWith(10, 14);
  });

  it('should return data and count on success', async () => {
    const mockData = [
      {
        id: 'log-1',
        company_id: 'company-1',
        user_id: 'user-1',
        user_role: 'owner',
        action_type: 'payroll_process',
        entity_type: 'payroll_period',
        entity_id: 'period-1',
        changes: { period: '2026-01' },
        ip_address: '192.168.1.1',
        created_at: '2026-01-15T10:30:00+07:00',
      },
    ];
    setupMockChain(mockData, 1);

    const result = await fetchAuditLogs({});

    expect(result.data).toEqual(mockData);
    expect(result.count).toBe(1);
  });

  it('should return empty array when data is null', async () => {
    setupMockChain(null, 0);

    const result = await fetchAuditLogs({});

    expect(result.data).toEqual([]);
    expect(result.count).toBe(0);
  });

  it('should throw error when supabase query fails', async () => {
    setupMockChain([], 0, { message: 'RLS policy violation' });

    await expect(fetchAuditLogs({})).rejects.toThrow(
      'Gagal mengambil audit logs: RLS policy violation'
    );
  });
});
