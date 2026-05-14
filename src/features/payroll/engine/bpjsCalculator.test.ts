/**
 * Unit tests untuk BPJS Calculator
 * Validates: Persyaratan 3.1, 3.2, 3.3, 3.4
 */

import { describe, it, expect } from 'vitest';
import { calculateBPJS, isWithinDiscountPeriod } from './bpjsCalculator';
import { ValidationError } from './pph21Calculator';
import type { BPJSConfig, BPJSInput } from '@/types/payroll';
import { DEFAULT_BPJS_CONFIG } from '@/lib/constants';

/** Helper: buat config default untuk testing */
function makeConfig(overrides: Partial<BPJSConfig> = {}): BPJSConfig {
  return { ...DEFAULT_BPJS_CONFIG, ...overrides };
}

/** Helper: buat input untuk testing */
function makeInput(base_wage: number, period: Date = new Date(2026, 2, 1)): BPJSInput {
  return { base_wage, payroll_period: period };
}

describe('isWithinDiscountPeriod', () => {
  const config = makeConfig();

  it('returns true for January 2026 (start of discount period)', () => {
    const period = new Date(2026, 0, 1); // Jan 2026
    expect(isWithinDiscountPeriod(period, config)).toBe(true);
  });

  it('returns true for June 2026 (end of discount period)', () => {
    const period = new Date(2026, 5, 1); // Jun 2026
    expect(isWithinDiscountPeriod(period, config)).toBe(true);
  });

  it('returns true for March 2026 (middle of discount period)', () => {
    const period = new Date(2026, 2, 15); // Mar 2026 (day ignored)
    expect(isWithinDiscountPeriod(period, config)).toBe(true);
  });

  it('returns false for July 2026 (after discount period)', () => {
    const period = new Date(2026, 6, 1); // Jul 2026
    expect(isWithinDiscountPeriod(period, config)).toBe(false);
  });

  it('returns false for December 2025 (before discount period)', () => {
    const period = new Date(2025, 11, 1); // Dec 2025
    expect(isWithinDiscountPeriod(period, config)).toBe(false);
  });

  it('returns false when jkk_discount_start is undefined', () => {
    const noDiscountConfig = makeConfig({ jkk_discount_start: undefined });
    const period = new Date(2026, 2, 1);
    expect(isWithinDiscountPeriod(period, noDiscountConfig)).toBe(false);
  });

  it('returns false when jkk_discount_end is undefined', () => {
    const noDiscountConfig = makeConfig({ jkk_discount_end: undefined });
    const period = new Date(2026, 2, 1);
    expect(isWithinDiscountPeriod(period, noDiscountConfig)).toBe(false);
  });
});

describe('calculateBPJS', () => {
  describe('Normal calculation with default rates', () => {
    it('calculates all components correctly for wage 10,000,000', () => {
      const config = makeConfig();
      const input = makeInput(10_000_000, new Date(2026, 6, 1)); // Jul 2026 (no discount)

      const result = calculateBPJS(input, config);

      // BPJS Kesehatan: min(10M, 12M) = 10M
      // Employer: 10M * 4% = 400,000
      // Employee: 10M * 1% = 100,000
      expect(result.employer.kesehatan).toBe(400_000);
      expect(result.employee.kesehatan).toBe(100_000);

      // JHT: no ceiling, full wage
      // Employer: 10M * 3.7% = 370,000
      // Employee: 10M * 2% = 200,000
      expect(result.employer.jht).toBe(370_000);
      expect(result.employee.jht).toBe(200_000);

      // JP: min(10M, 10,042,300) = 10M (below ceiling)
      // Employer: 10M * 2% = 200,000
      // Employee: 10M * 1% = 100,000
      expect(result.employer.jp).toBe(200_000);
      expect(result.employee.jp).toBe(100_000);

      // JKM: 10M * 0.3% = 30,000
      expect(result.employer.jkm).toBe(30_000);

      // JKK: 10M * 0.24% = 24,000 (no discount in Jul 2026)
      expect(result.employer.jkk).toBe(24_000);

      // JKP: 10M * 0.36% = 36,000
      expect(result.employer.jkp).toBe(36_000);

      // Totals
      expect(result.employer.total).toBe(400_000 + 370_000 + 200_000 + 30_000 + 24_000 + 36_000);
      expect(result.employee.total).toBe(100_000 + 200_000 + 100_000);
    });

    it('calculates correctly for wage 5,000,000', () => {
      const config = makeConfig();
      const input = makeInput(5_000_000, new Date(2026, 6, 1)); // Jul 2026

      const result = calculateBPJS(input, config);

      expect(result.employer.kesehatan).toBe(200_000); // 5M * 4%
      expect(result.employee.kesehatan).toBe(50_000);  // 5M * 1%
      expect(result.employer.jht).toBe(185_000);       // 5M * 3.7%
      expect(result.employee.jht).toBe(100_000);       // 5M * 2%
      expect(result.employer.jp).toBe(100_000);        // 5M * 2%
      expect(result.employee.jp).toBe(50_000);         // 5M * 1%
      expect(result.employer.jkm).toBe(15_000);        // 5M * 0.3%
      expect(result.employer.jkk).toBe(12_000);        // 5M * 0.24%
      expect(result.employer.jkp).toBe(18_000);        // 5M * 0.36%
    });
  });

  describe('Ceiling application (wage above ceiling)', () => {
    it('applies kesehatan ceiling when wage exceeds it', () => {
      const config = makeConfig({ kesehatan_wage_ceiling: 12_000_000 });
      const input = makeInput(15_000_000, new Date(2026, 6, 1));

      const result = calculateBPJS(input, config);

      // Kesehatan uses ceiling: min(15M, 12M) = 12M
      expect(result.employer.kesehatan).toBe(Math.round(12_000_000 * 4 / 100)); // 480,000
      expect(result.employee.kesehatan).toBe(Math.round(12_000_000 * 1 / 100)); // 120,000

      // JHT uses full wage (no ceiling)
      expect(result.employer.jht).toBe(Math.round(15_000_000 * 3.7 / 100)); // 555,000
      expect(result.employee.jht).toBe(Math.round(15_000_000 * 2 / 100));   // 300,000
    });

    it('applies JP ceiling when wage exceeds it', () => {
      const config = makeConfig({ jp_wage_ceiling: 10_042_300 });
      const input = makeInput(15_000_000, new Date(2026, 6, 1));

      const result = calculateBPJS(input, config);

      // JP uses ceiling: min(15M, 10,042,300) = 10,042,300
      expect(result.employer.jp).toBe(Math.round(10_042_300 * 2 / 100)); // 200,846
      expect(result.employee.jp).toBe(Math.round(10_042_300 * 1 / 100)); // 100,423
    });

    it('does not apply ceiling when wage is below it', () => {
      const config = makeConfig({
        kesehatan_wage_ceiling: 12_000_000,
        jp_wage_ceiling: 10_042_300,
      });
      const input = makeInput(8_000_000, new Date(2026, 6, 1));

      const result = calculateBPJS(input, config);

      // Both below ceiling, use full wage
      expect(result.employer.kesehatan).toBe(Math.round(8_000_000 * 4 / 100)); // 320,000
      expect(result.employer.jp).toBe(Math.round(8_000_000 * 2 / 100));        // 160,000
    });

    it('uses exact ceiling when wage equals ceiling', () => {
      const config = makeConfig({
        kesehatan_wage_ceiling: 12_000_000,
        jp_wage_ceiling: 10_042_300,
      });
      const input = makeInput(12_000_000, new Date(2026, 6, 1));

      const result = calculateBPJS(input, config);

      // Kesehatan: wage == ceiling, use wage
      expect(result.employer.kesehatan).toBe(Math.round(12_000_000 * 4 / 100)); // 480,000
      expect(result.employee.kesehatan).toBe(Math.round(12_000_000 * 1 / 100)); // 120,000

      // JP: wage > ceiling, use ceiling
      expect(result.employer.jp).toBe(Math.round(10_042_300 * 2 / 100)); // 200,846
      expect(result.employee.jp).toBe(Math.round(10_042_300 * 1 / 100)); // 100,423
    });
  });

  describe('JKK discount active vs inactive', () => {
    it('applies 50% discount when period is within discount range', () => {
      const config = makeConfig({ jkk_rate: 1.74 }); // highest risk class
      const input = makeInput(10_000_000, new Date(2026, 2, 1)); // Mar 2026 (within discount)

      const result = calculateBPJS(input, config);

      // JKK with 50% discount: 10M * (1.74 * 0.5)% = 10M * 0.87% = 87,000
      expect(result.employer.jkk).toBe(Math.round(10_000_000 * 0.87 / 100));
    });

    it('does not apply discount when period is outside discount range', () => {
      const config = makeConfig({ jkk_rate: 1.74 });
      const input = makeInput(10_000_000, new Date(2026, 6, 1)); // Jul 2026 (outside discount)

      const result = calculateBPJS(input, config);

      // JKK without discount: 10M * 1.74% = 174,000
      expect(result.employer.jkk).toBe(Math.round(10_000_000 * 1.74 / 100));
    });

    it('applies discount for January 2026 (first month)', () => {
      const config = makeConfig({ jkk_rate: 0.54 });
      const input = makeInput(8_000_000, new Date(2026, 0, 1)); // Jan 2026

      const result = calculateBPJS(input, config);

      // JKK with 50% discount: 8M * (0.54 * 0.5)% = 8M * 0.27% = 21,600
      expect(result.employer.jkk).toBe(Math.round(8_000_000 * 0.27 / 100));
    });

    it('applies discount for June 2026 (last month)', () => {
      const config = makeConfig({ jkk_rate: 0.54 });
      const input = makeInput(8_000_000, new Date(2026, 5, 1)); // Jun 2026

      const result = calculateBPJS(input, config);

      // JKK with 50% discount: 8M * (0.54 * 0.5)% = 8M * 0.27% = 21,600
      expect(result.employer.jkk).toBe(Math.round(8_000_000 * 0.27 / 100));
    });

    it('does not apply discount when discount dates are not configured', () => {
      const config = makeConfig({
        jkk_rate: 1.0,
        jkk_discount_start: undefined,
        jkk_discount_end: undefined,
      });
      const input = makeInput(10_000_000, new Date(2026, 2, 1)); // Mar 2026

      const result = calculateBPJS(input, config);

      // No discount: 10M * 1.0% = 100,000
      expect(result.employer.jkk).toBe(100_000);
    });
  });

  describe('Edge cases', () => {
    it('throws ValidationError when base_wage is 0', () => {
      const config = makeConfig();
      const input = makeInput(0);

      expect(() => calculateBPJS(input, config)).toThrow(ValidationError);
      expect(() => calculateBPJS(input, config)).toThrow('Upah dasar harus lebih dari 0');
    });

    it('throws ValidationError when base_wage is negative', () => {
      const config = makeConfig();
      const input = makeInput(-1_000_000);

      expect(() => calculateBPJS(input, config)).toThrow(ValidationError);
    });

    it('handles wage exactly at JP ceiling', () => {
      const config = makeConfig({ jp_wage_ceiling: 10_042_300 });
      const input = makeInput(10_042_300, new Date(2026, 6, 1));

      const result = calculateBPJS(input, config);

      // JP: wage == ceiling, use full wage
      expect(result.employer.jp).toBe(Math.round(10_042_300 * 2 / 100));
      expect(result.employee.jp).toBe(Math.round(10_042_300 * 1 / 100));
    });

    it('rounds all results using Math.round', () => {
      // Use a wage that produces fractional results
      const config = makeConfig({ jkk_rate: 0.89 });
      const input = makeInput(7_777_777, new Date(2026, 6, 1)); // Jul 2026

      const result = calculateBPJS(input, config);

      // Verify all values are integers (rounded)
      expect(Number.isInteger(result.employer.kesehatan)).toBe(true);
      expect(Number.isInteger(result.employee.kesehatan)).toBe(true);
      expect(Number.isInteger(result.employer.jht)).toBe(true);
      expect(Number.isInteger(result.employee.jht)).toBe(true);
      expect(Number.isInteger(result.employer.jp)).toBe(true);
      expect(Number.isInteger(result.employee.jp)).toBe(true);
      expect(Number.isInteger(result.employer.jkm)).toBe(true);
      expect(Number.isInteger(result.employer.jkk)).toBe(true);
      expect(Number.isInteger(result.employer.jkp)).toBe(true);

      // Verify specific rounding: 7,777,777 * 3.7% = 287,777.749 → 287,778
      expect(result.employer.jht).toBe(Math.round(7_777_777 * 3.7 / 100));
    });

    it('handles very small wage (minimum valid)', () => {
      const config = makeConfig();
      const input = makeInput(1, new Date(2026, 6, 1));

      const result = calculateBPJS(input, config);

      // All components should be 0 due to rounding of tiny amounts
      expect(result.employer.kesehatan).toBe(Math.round(1 * 4 / 100)); // 0
      expect(result.employee.kesehatan).toBe(Math.round(1 * 1 / 100)); // 0
      expect(result.employer.jht).toBe(Math.round(1 * 3.7 / 100));    // 0
      expect(result.employee.jht).toBe(Math.round(1 * 2 / 100));      // 0
    });
  });

  describe('Total calculations', () => {
    it('employer total equals sum of all employer components', () => {
      const config = makeConfig();
      const input = makeInput(9_500_000, new Date(2026, 6, 1));

      const result = calculateBPJS(input, config);

      const expectedTotal =
        result.employer.jht +
        result.employer.jp +
        result.employer.jkm +
        result.employer.jkk +
        result.employer.jkp +
        result.employer.kesehatan;

      expect(result.employer.total).toBe(expectedTotal);
    });

    it('employee total equals sum of all employee components', () => {
      const config = makeConfig();
      const input = makeInput(9_500_000, new Date(2026, 6, 1));

      const result = calculateBPJS(input, config);

      const expectedTotal =
        result.employee.jht +
        result.employee.jp +
        result.employee.kesehatan;

      expect(result.employee.total).toBe(expectedTotal);
    });

    it('totals are correct with ceiling applied', () => {
      const config = makeConfig({
        kesehatan_wage_ceiling: 12_000_000,
        jp_wage_ceiling: 10_042_300,
      });
      const input = makeInput(20_000_000, new Date(2026, 6, 1));

      const result = calculateBPJS(input, config);

      // Verify employer total
      const expectedEmployerTotal =
        result.employer.jht +
        result.employer.jp +
        result.employer.jkm +
        result.employer.jkk +
        result.employer.jkp +
        result.employer.kesehatan;
      expect(result.employer.total).toBe(expectedEmployerTotal);

      // Verify employee total
      const expectedEmployeeTotal =
        result.employee.jht +
        result.employee.jp +
        result.employee.kesehatan;
      expect(result.employee.total).toBe(expectedEmployeeTotal);
    });
  });
});
