/**
 * Unit tests untuk validasi pengaturan tarif TER dan BPJS
 * Validates: Persyaratan 2.8, 3.5, 3.7
 */

import { describe, it, expect } from 'vitest';
import {
  validateTERRate,
  validateTERRates,
  validateBPJSConfig,
} from './settingsValidators';
import { DEFAULT_BPJS_CONFIG } from '@/lib/constants';
import type { BPJSConfig } from '@/types/payroll';

describe('validateTERRate', () => {
  it('should accept valid TER rate', () => {
    const result = validateTERRate({
      category: 'A',
      lower_bound: 0,
      upper_bound: 5400000,
      rate_percent: 0,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept rate_percent at boundaries (0 and 100)', () => {
    const resultZero = validateTERRate({
      category: 'B',
      lower_bound: 0,
      upper_bound: 1000000,
      rate_percent: 0,
    });
    expect(resultZero.valid).toBe(true);

    const resultHundred = validateTERRate({
      category: 'C',
      lower_bound: 0,
      upper_bound: 1000000,
      rate_percent: 100,
    });
    expect(resultHundred.valid).toBe(true);
  });

  it('should reject rate_percent > 100', () => {
    const result = validateTERRate({
      category: 'A',
      lower_bound: 0,
      upper_bound: 5400000,
      rate_percent: 100.01,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'rate_percent')).toBe(true);
  });

  it('should reject rate_percent < 0', () => {
    const result = validateTERRate({
      category: 'A',
      lower_bound: 0,
      upper_bound: 5400000,
      rate_percent: -1,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'rate_percent')).toBe(true);
  });

  it('should reject upper_bound <= 0', () => {
    const result = validateTERRate({
      category: 'A',
      lower_bound: 0,
      upper_bound: 0,
      rate_percent: 5,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'upper_bound')).toBe(true);
  });

  it('should reject upper_bound <= lower_bound', () => {
    const result = validateTERRate({
      category: 'A',
      lower_bound: 5000000,
      upper_bound: 5000000,
      rate_percent: 5,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'upper_bound')).toBe(true);
  });

  it('should reject negative lower_bound', () => {
    const result = validateTERRate({
      category: 'A',
      lower_bound: -1,
      upper_bound: 5000000,
      rate_percent: 5,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'lower_bound')).toBe(true);
  });

  it('should reject invalid category', () => {
    const result = validateTERRate({
      category: 'D' as 'A',
      lower_bound: 0,
      upper_bound: 5000000,
      rate_percent: 5,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'category')).toBe(true);
  });

  it('should collect multiple errors', () => {
    const result = validateTERRate({
      category: 'X' as 'A',
      lower_bound: -100,
      upper_bound: -50,
      rate_percent: 150,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe('validateTERRates', () => {
  it('should accept valid array of TER rates', () => {
    const result = validateTERRates([
      { category: 'A', lower_bound: 0, upper_bound: 5400000, rate_percent: 0 },
      { category: 'A', lower_bound: 5400001, upper_bound: 5650000, rate_percent: 0.25 },
      { category: 'B', lower_bound: 0, upper_bound: 6200000, rate_percent: 0 },
    ]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept empty array', () => {
    const result = validateTERRates([]);
    expect(result.valid).toBe(true);
  });

  it('should report errors with index prefix', () => {
    const result = validateTERRates([
      { category: 'A', lower_bound: 0, upper_bound: 5400000, rate_percent: 5 },
      { category: 'A', lower_bound: 5000000, upper_bound: 3000000, rate_percent: 5 }, // invalid
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field.startsWith('rates[1]'))).toBe(true);
  });
});

describe('validateBPJSConfig', () => {
  const validConfig: BPJSConfig = { ...DEFAULT_BPJS_CONFIG };

  it('should accept valid default BPJS config', () => {
    const result = validateBPJSConfig(validConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept jkk_rate at minimum (0.24)', () => {
    const result = validateBPJSConfig({ ...validConfig, jkk_rate: 0.24 });
    expect(result.valid).toBe(true);
  });

  it('should accept jkk_rate at maximum (1.74)', () => {
    const result = validateBPJSConfig({ ...validConfig, jkk_rate: 1.74 });
    expect(result.valid).toBe(true);
  });

  it('should reject jkk_rate below 0.24', () => {
    const result = validateBPJSConfig({ ...validConfig, jkk_rate: 0.23 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'jkk_rate')).toBe(true);
  });

  it('should reject jkk_rate above 1.74', () => {
    const result = validateBPJSConfig({ ...validConfig, jkk_rate: 1.75 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'jkk_rate')).toBe(true);
  });

  it('should reject jp_wage_ceiling <= 0', () => {
    const result = validateBPJSConfig({ ...validConfig, jp_wage_ceiling: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'jp_wage_ceiling')).toBe(true);
  });

  it('should reject negative jp_wage_ceiling', () => {
    const result = validateBPJSConfig({ ...validConfig, jp_wage_ceiling: -1000 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'jp_wage_ceiling')).toBe(true);
  });

  it('should reject kesehatan_wage_ceiling <= 0', () => {
    const result = validateBPJSConfig({ ...validConfig, kesehatan_wage_ceiling: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'kesehatan_wage_ceiling')).toBe(true);
  });

  it('should reject negative kesehatan_wage_ceiling', () => {
    const result = validateBPJSConfig({ ...validConfig, kesehatan_wage_ceiling: -5000 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'kesehatan_wage_ceiling')).toBe(true);
  });

  it('should reject rate > 100%', () => {
    const result = validateBPJSConfig({ ...validConfig, jht_employer_rate: 101 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'jht_employer_rate')).toBe(true);
  });

  it('should reject rate < 0%', () => {
    const result = validateBPJSConfig({ ...validConfig, kesehatan_employee_rate: -1 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'kesehatan_employee_rate')).toBe(true);
  });

  it('should collect multiple errors', () => {
    const result = validateBPJSConfig({
      ...validConfig,
      jkk_rate: 5, // > 1.74
      jp_wage_ceiling: -100, // <= 0
      kesehatan_wage_ceiling: 0, // <= 0
      jht_employer_rate: 200, // > 100
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  it('should accept all rates at 0% (except jkk_rate)', () => {
    const result = validateBPJSConfig({
      ...validConfig,
      jht_employer_rate: 0,
      jht_employee_rate: 0,
      jp_employer_rate: 0,
      jp_employee_rate: 0,
      jkm_employer_rate: 0,
      jkp_employer_rate: 0,
      kesehatan_employer_rate: 0,
      kesehatan_employee_rate: 0,
      // jkk_rate stays at 0.24 (minimum)
    });
    expect(result.valid).toBe(true);
  });
});
