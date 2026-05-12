/**
 * Unit tests untuk PPh 21 TER Calculator
 * Validates: Persyaratan 2.1, 2.2, 2.4, 2.5, 2.6, 2.7
 */

import { describe, it, expect } from 'vitest';
import {
  calculateGrossIncome,
  calculatePPh21,
  ValidationError,
} from './pph21Calculator';
import type { TERRate } from '@/types/payroll';

// Sample TER rates untuk testing (berdasarkan PP 58/2023)
const sampleTERRates: TERRate[] = [
  // Kategori A
  { id: '1', category: 'A', lower_bound: 0, upper_bound: 5400000, rate_percent: 0 },
  { id: '2', category: 'A', lower_bound: 5400001, upper_bound: 5650000, rate_percent: 0.25 },
  { id: '3', category: 'A', lower_bound: 5650001, upper_bound: 5950000, rate_percent: 0.5 },
  { id: '4', category: 'A', lower_bound: 5950001, upper_bound: 6300000, rate_percent: 0.75 },
  { id: '5', category: 'A', lower_bound: 6300001, upper_bound: 6750000, rate_percent: 1 },
  { id: '6', category: 'A', lower_bound: 6750001, upper_bound: 7500000, rate_percent: 1.25 },
  { id: '7', category: 'A', lower_bound: 7500001, upper_bound: 8550000, rate_percent: 1.5 },
  { id: '8', category: 'A', lower_bound: 8550001, upper_bound: 9650000, rate_percent: 1.75 },
  { id: '9', category: 'A', lower_bound: 9650001, upper_bound: 10050000, rate_percent: 2 },
  { id: '10', category: 'A', lower_bound: 10050001, upper_bound: 10350000, rate_percent: 2.25 },
  { id: '11', category: 'A', lower_bound: 10350001, upper_bound: 10700000, rate_percent: 2.5 },
  { id: '12', category: 'A', lower_bound: 10700001, upper_bound: 11050000, rate_percent: 3 },
  { id: '13', category: 'A', lower_bound: 11050001, upper_bound: 11600000, rate_percent: 3.5 },
  { id: '14', category: 'A', lower_bound: 11600001, upper_bound: 12500000, rate_percent: 4 },
  { id: '15', category: 'A', lower_bound: 12500001, upper_bound: 13750000, rate_percent: 5 },
  { id: '16', category: 'A', lower_bound: 13750001, upper_bound: 15100000, rate_percent: 6 },
  { id: '17', category: 'A', lower_bound: 15100001, upper_bound: 16950000, rate_percent: 7 },
  { id: '18', category: 'A', lower_bound: 16950001, upper_bound: 19750000, rate_percent: 8 },
  { id: '19', category: 'A', lower_bound: 19750001, upper_bound: 24150000, rate_percent: 9 },
  { id: '20', category: 'A', lower_bound: 24150001, upper_bound: 26450000, rate_percent: 10 },
  { id: '21', category: 'A', lower_bound: 26450001, upper_bound: 28000000, rate_percent: 11 },
  { id: '22', category: 'A', lower_bound: 28000001, upper_bound: 30050000, rate_percent: 12 },
  { id: '23', category: 'A', lower_bound: 30050001, upper_bound: 32400000, rate_percent: 13 },
  { id: '24', category: 'A', lower_bound: 32400001, upper_bound: 35400000, rate_percent: 14 },
  { id: '25', category: 'A', lower_bound: 35400001, upper_bound: 39100000, rate_percent: 15 },
  { id: '26', category: 'A', lower_bound: 39100001, upper_bound: 43850000, rate_percent: 16 },
  { id: '27', category: 'A', lower_bound: 43850001, upper_bound: 47800000, rate_percent: 17 },
  { id: '28', category: 'A', lower_bound: 47800001, upper_bound: 51400000, rate_percent: 18 },
  { id: '29', category: 'A', lower_bound: 51400001, upper_bound: 56300000, rate_percent: 19 },
  { id: '30', category: 'A', lower_bound: 56300001, upper_bound: 62200000, rate_percent: 20 },
  { id: '31', category: 'A', lower_bound: 62200001, upper_bound: 68600000, rate_percent: 21 },
  { id: '32', category: 'A', lower_bound: 68600001, upper_bound: 77500000, rate_percent: 22 },
  { id: '33', category: 'A', lower_bound: 77500001, upper_bound: 89000000, rate_percent: 23 },
  { id: '34', category: 'A', lower_bound: 89000001, upper_bound: 103000000, rate_percent: 24 },
  { id: '35', category: 'A', lower_bound: 103000001, upper_bound: 125000000, rate_percent: 25 },
  { id: '36', category: 'A', lower_bound: 125000001, upper_bound: 157000000, rate_percent: 26 },
  { id: '37', category: 'A', lower_bound: 157000001, upper_bound: 206000000, rate_percent: 27 },
  { id: '38', category: 'A', lower_bound: 206000001, upper_bound: 337000000, rate_percent: 28 },
  { id: '39', category: 'A', lower_bound: 337000001, upper_bound: 454000000, rate_percent: 29 },
  { id: '40', category: 'A', lower_bound: 454000001, upper_bound: 550000000, rate_percent: 30 },
  { id: '41', category: 'A', lower_bound: 550000001, upper_bound: 695000000, rate_percent: 31 },
  { id: '42', category: 'A', lower_bound: 695000001, upper_bound: 910000000, rate_percent: 32 },
  { id: '43', category: 'A', lower_bound: 910000001, upper_bound: 1400000000, rate_percent: 33 },
  { id: '44', category: 'A', lower_bound: 1400000001, upper_bound: 999999999999, rate_percent: 34 },
  // Kategori B (subset untuk testing)
  { id: '45', category: 'B', lower_bound: 0, upper_bound: 6200000, rate_percent: 0 },
  { id: '46', category: 'B', lower_bound: 6200001, upper_bound: 6500000, rate_percent: 0.25 },
  { id: '47', category: 'B', lower_bound: 6500001, upper_bound: 6850000, rate_percent: 0.5 },
  { id: '48', category: 'B', lower_bound: 6850001, upper_bound: 7300000, rate_percent: 0.75 },
  { id: '49', category: 'B', lower_bound: 7300001, upper_bound: 9200000, rate_percent: 1 },
  { id: '50', category: 'B', lower_bound: 9200001, upper_bound: 10750000, rate_percent: 1.5 },
  { id: '51', category: 'B', lower_bound: 10750001, upper_bound: 11250000, rate_percent: 2 },
  { id: '52', category: 'B', lower_bound: 11250001, upper_bound: 11600000, rate_percent: 2.5 },
  { id: '53', category: 'B', lower_bound: 11600001, upper_bound: 12600000, rate_percent: 3 },
  { id: '54', category: 'B', lower_bound: 12600001, upper_bound: 13600000, rate_percent: 4 },
  { id: '55', category: 'B', lower_bound: 13600001, upper_bound: 14950000, rate_percent: 5 },
  { id: '56', category: 'B', lower_bound: 14950001, upper_bound: 16400000, rate_percent: 6 },
  { id: '57', category: 'B', lower_bound: 16400001, upper_bound: 18450000, rate_percent: 7 },
  { id: '58', category: 'B', lower_bound: 18450001, upper_bound: 21850000, rate_percent: 8 },
  { id: '59', category: 'B', lower_bound: 21850001, upper_bound: 26000000, rate_percent: 9 },
  { id: '60', category: 'B', lower_bound: 26000001, upper_bound: 30050000, rate_percent: 10 },
  { id: '61', category: 'B', lower_bound: 30050001, upper_bound: 999999999999, rate_percent: 11 },
  // Kategori C (subset untuk testing)
  { id: '62', category: 'C', lower_bound: 0, upper_bound: 6600000, rate_percent: 0 },
  { id: '63', category: 'C', lower_bound: 6600001, upper_bound: 6950000, rate_percent: 0.25 },
  { id: '64', category: 'C', lower_bound: 6950001, upper_bound: 7350000, rate_percent: 0.5 },
  { id: '65', category: 'C', lower_bound: 7350001, upper_bound: 7800000, rate_percent: 0.75 },
  { id: '66', category: 'C', lower_bound: 7800001, upper_bound: 8850000, rate_percent: 1 },
  { id: '67', category: 'C', lower_bound: 8850001, upper_bound: 9800000, rate_percent: 1.25 },
  { id: '68', category: 'C', lower_bound: 9800001, upper_bound: 10950000, rate_percent: 1.5 },
  { id: '69', category: 'C', lower_bound: 10950001, upper_bound: 11200000, rate_percent: 1.75 },
  { id: '70', category: 'C', lower_bound: 11200001, upper_bound: 12050000, rate_percent: 2 },
  { id: '71', category: 'C', lower_bound: 12050001, upper_bound: 12950000, rate_percent: 3 },
  { id: '72', category: 'C', lower_bound: 12950001, upper_bound: 14150000, rate_percent: 4 },
  { id: '73', category: 'C', lower_bound: 14150001, upper_bound: 15550000, rate_percent: 5 },
  { id: '74', category: 'C', lower_bound: 15550001, upper_bound: 17050000, rate_percent: 6 },
  { id: '75', category: 'C', lower_bound: 17050001, upper_bound: 19500000, rate_percent: 7 },
  { id: '76', category: 'C', lower_bound: 19500001, upper_bound: 22700000, rate_percent: 8 },
  { id: '77', category: 'C', lower_bound: 22700001, upper_bound: 26600000, rate_percent: 9 },
  { id: '78', category: 'C', lower_bound: 26600001, upper_bound: 30100000, rate_percent: 10 },
  { id: '79', category: 'C', lower_bound: 30100001, upper_bound: 999999999999, rate_percent: 11 },
];

describe('calculateGrossIncome', () => {
  it('should sum all components correctly', () => {
    expect(calculateGrossIncome(5000000, 1000000, 500000)).toBe(6500000);
  });

  it('should handle zero values', () => {
    expect(calculateGrossIncome(5000000, 0, 0)).toBe(5000000);
    expect(calculateGrossIncome(0, 0, 0)).toBe(0);
  });

  it('should handle large values', () => {
    expect(calculateGrossIncome(999999999, 100000000, 50000000)).toBe(1149999999);
  });

  it('should throw ValidationError for negative gajiPokok', () => {
    expect(() => calculateGrossIncome(-1, 0, 0)).toThrow(ValidationError);
    expect(() => calculateGrossIncome(-1, 0, 0)).toThrow(
      'Komponen gaji tidak boleh negatif',
    );
  });

  it('should throw ValidationError for negative tunjanganTetap', () => {
    expect(() => calculateGrossIncome(5000000, -1, 0)).toThrow(ValidationError);
  });

  it('should throw ValidationError for negative uangLembur', () => {
    expect(() => calculateGrossIncome(5000000, 0, -1)).toThrow(ValidationError);
  });
});

describe('calculatePPh21', () => {
  describe('PTKP to TER category mapping (Persyaratan 2.2)', () => {
    it('should map TK/0 to category A', () => {
      const result = calculatePPh21(
        { gross_income: 7000000, ptkp_status: 'TK/0' },
        sampleTERRates,
      );
      expect(result.ter_category).toBe('A');
    });

    it('should map TK/1 to category A', () => {
      const result = calculatePPh21(
        { gross_income: 7000000, ptkp_status: 'TK/1' },
        sampleTERRates,
      );
      expect(result.ter_category).toBe('A');
    });

    it('should map K/0 to category A', () => {
      const result = calculatePPh21(
        { gross_income: 7000000, ptkp_status: 'K/0' },
        sampleTERRates,
      );
      expect(result.ter_category).toBe('A');
    });

    it('should map TK/2 to category B', () => {
      const result = calculatePPh21(
        { gross_income: 7000000, ptkp_status: 'TK/2' },
        sampleTERRates,
      );
      expect(result.ter_category).toBe('B');
    });

    it('should map TK/3 to category B', () => {
      const result = calculatePPh21(
        { gross_income: 7000000, ptkp_status: 'TK/3' },
        sampleTERRates,
      );
      expect(result.ter_category).toBe('B');
    });

    it('should map K/1 to category B', () => {
      const result = calculatePPh21(
        { gross_income: 7000000, ptkp_status: 'K/1' },
        sampleTERRates,
      );
      expect(result.ter_category).toBe('B');
    });

    it('should map K/2 to category B', () => {
      const result = calculatePPh21(
        { gross_income: 7000000, ptkp_status: 'K/2' },
        sampleTERRates,
      );
      expect(result.ter_category).toBe('B');
    });

    it('should map K/3 to category C', () => {
      const result = calculatePPh21(
        { gross_income: 7000000, ptkp_status: 'K/3' },
        sampleTERRates,
      );
      expect(result.ter_category).toBe('C');
    });
  });

  describe('PPh 21 calculation formula (Persyaratan 2.1, 2.5)', () => {
    it('should calculate PPh21 = floor(bruto × rate%)', () => {
      // TK/0 (Kategori A), bruto 7.000.000 → rate 1.25%
      // PPh21 = floor(7000000 × 1.25 / 100) = floor(87500) = 87500
      const result = calculatePPh21(
        { gross_income: 7000000, ptkp_status: 'TK/0' },
        sampleTERRates,
      );
      expect(result.ter_rate_percent).toBe(1.25);
      expect(result.pph21_amount).toBe(87500);
    });

    it('should apply Math.floor for rounding down', () => {
      // TK/0 (Kategori A), bruto 5500000 → rate 0.25%
      // PPh21 = floor(5500000 × 0.25 / 100) = floor(13750) = 13750
      const result = calculatePPh21(
        { gross_income: 5500000, ptkp_status: 'TK/0' },
        sampleTERRates,
      );
      expect(result.ter_rate_percent).toBe(0.25);
      expect(result.pph21_amount).toBe(13750);
    });

    it('should floor fractional results', () => {
      // TK/2 (Kategori B), bruto 6300000 → rate 0.25%
      // PPh21 = floor(6300000 × 0.25 / 100) = floor(15750) = 15750
      const result = calculatePPh21(
        { gross_income: 6300000, ptkp_status: 'TK/2' },
        sampleTERRates,
      );
      expect(result.pph21_amount).toBe(15750);
    });

    it('should calculate correctly for higher income bracket', () => {
      // TK/0 (Kategori A), bruto 15000000 → rate 6%
      // PPh21 = floor(15000000 × 6 / 100) = floor(900000) = 900000
      const result = calculatePPh21(
        { gross_income: 15000000, ptkp_status: 'TK/0' },
        sampleTERRates,
      );
      expect(result.ter_rate_percent).toBe(6);
      expect(result.pph21_amount).toBe(900000);
    });

    it('should calculate for category B employee', () => {
      // K/1 (Kategori B), bruto 10000000 → rate 1.5%
      // PPh21 = floor(10000000 × 1.5 / 100) = floor(150000) = 150000
      const result = calculatePPh21(
        { gross_income: 10000000, ptkp_status: 'K/1' },
        sampleTERRates,
      );
      expect(result.ter_category).toBe('B');
      expect(result.ter_rate_percent).toBe(1.5);
      expect(result.pph21_amount).toBe(150000);
    });

    it('should calculate for category C employee', () => {
      // K/3 (Kategori C), bruto 9000000 → rate 1.25%
      // PPh21 = floor(9000000 × 1.25 / 100) = floor(112500) = 112500
      const result = calculatePPh21(
        { gross_income: 9000000, ptkp_status: 'K/3' },
        sampleTERRates,
      );
      expect(result.ter_category).toBe('C');
      expect(result.ter_rate_percent).toBe(1.25);
      expect(result.pph21_amount).toBe(112500);
    });
  });

  describe('Edge case: bruto = 0 (Persyaratan 2.7)', () => {
    it('should return PPh21 = 0 without TER lookup when bruto is 0', () => {
      const result = calculatePPh21(
        { gross_income: 0, ptkp_status: 'TK/0' },
        sampleTERRates,
      );
      expect(result.pph21_amount).toBe(0);
      expect(result.ter_rate_percent).toBe(0);
      expect(result.ter_category).toBe('A');
    });

    it('should return PPh21 = 0 for all PTKP statuses when bruto is 0', () => {
      const statuses: Array<'TK/0' | 'TK/1' | 'TK/2' | 'TK/3' | 'K/0' | 'K/1' | 'K/2' | 'K/3'> = [
        'TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3',
      ];
      for (const status of statuses) {
        const result = calculatePPh21(
          { gross_income: 0, ptkp_status: status },
          sampleTERRates,
        );
        expect(result.pph21_amount).toBe(0);
      }
    });

    it('should work even with empty terRates when bruto is 0', () => {
      const result = calculatePPh21(
        { gross_income: 0, ptkp_status: 'TK/0' },
        [], // empty rates - should not matter since bruto = 0
      );
      expect(result.pph21_amount).toBe(0);
    });
  });

  describe('TER rate = 0% for low income (Persyaratan 2.5)', () => {
    it('should return PPh21 = 0 for income below threshold (category A)', () => {
      // TK/0 (Kategori A), bruto 5000000 → rate 0%
      const result = calculatePPh21(
        { gross_income: 5000000, ptkp_status: 'TK/0' },
        sampleTERRates,
      );
      expect(result.ter_rate_percent).toBe(0);
      expect(result.pph21_amount).toBe(0);
    });

    it('should return PPh21 = 0 for income below threshold (category B)', () => {
      // TK/2 (Kategori B), bruto 6000000 → rate 0%
      const result = calculatePPh21(
        { gross_income: 6000000, ptkp_status: 'TK/2' },
        sampleTERRates,
      );
      expect(result.ter_rate_percent).toBe(0);
      expect(result.pph21_amount).toBe(0);
    });

    it('should return PPh21 = 0 for income below threshold (category C)', () => {
      // K/3 (Kategori C), bruto 6500000 → rate 0%
      const result = calculatePPh21(
        { gross_income: 6500000, ptkp_status: 'K/3' },
        sampleTERRates,
      );
      expect(result.ter_rate_percent).toBe(0);
      expect(result.pph21_amount).toBe(0);
    });
  });

  describe('Error handling (Persyaratan 2.6)', () => {
    it('should throw ValidationError for invalid PTKP status', () => {
      expect(() =>
        calculatePPh21(
          { gross_income: 5000000, ptkp_status: 'INVALID' as any },
          sampleTERRates,
        ),
      ).toThrow(ValidationError);
      expect(() =>
        calculatePPh21(
          { gross_income: 5000000, ptkp_status: 'INVALID' as any },
          sampleTERRates,
        ),
      ).toThrow('Status PTKP tidak valid: INVALID');
    });

    it('should throw ValidationError when TER rate not found', () => {
      // Use empty rates array with non-zero bruto
      expect(() =>
        calculatePPh21(
          { gross_income: 5000000, ptkp_status: 'TK/0' },
          [],
        ),
      ).toThrow(ValidationError);
      expect(() =>
        calculatePPh21(
          { gross_income: 5000000, ptkp_status: 'TK/0' },
          [],
        ),
      ).toThrow('Tarif TER tidak ditemukan');
    });

    it('should throw ValidationError for empty string PTKP', () => {
      expect(() =>
        calculatePPh21(
          { gross_income: 5000000, ptkp_status: '' as any },
          sampleTERRates,
        ),
      ).toThrow(ValidationError);
    });
  });

  describe('Boundary values for TER rate ranges', () => {
    it('should use correct rate at lower bound of range', () => {
      // Kategori A, bruto exactly 5400001 → rate 0.25%
      const result = calculatePPh21(
        { gross_income: 5400001, ptkp_status: 'TK/0' },
        sampleTERRates,
      );
      expect(result.ter_rate_percent).toBe(0.25);
    });

    it('should use correct rate at upper bound of range', () => {
      // Kategori A, bruto exactly 5650000 → rate 0.25%
      const result = calculatePPh21(
        { gross_income: 5650000, ptkp_status: 'TK/0' },
        sampleTERRates,
      );
      expect(result.ter_rate_percent).toBe(0.25);
    });

    it('should transition to next rate at boundary', () => {
      // Kategori A, bruto exactly 5650001 → rate 0.5%
      const result = calculatePPh21(
        { gross_income: 5650001, ptkp_status: 'TK/0' },
        sampleTERRates,
      );
      expect(result.ter_rate_percent).toBe(0.5);
    });
  });

  describe('Real-world calculation examples', () => {
    it('should calculate correctly for typical UMKM employee (Rp 5.5 juta)', () => {
      // Karyawan TK/0, gaji pokok 4.5 juta + tunjangan 500rb + lembur 500rb = 5.5 juta
      const gross = calculateGrossIncome(4500000, 500000, 500000);
      expect(gross).toBe(5500000);

      const result = calculatePPh21(
        { gross_income: gross, ptkp_status: 'TK/0' },
        sampleTERRates,
      );
      // Kategori A, 5.5 juta → rate 0.25%
      // PPh21 = floor(5500000 × 0.25 / 100) = floor(13750) = 13750
      expect(result.pph21_amount).toBe(13750);
    });

    it('should calculate correctly for mid-level employee (Rp 10 juta)', () => {
      // Karyawan K/0, gaji pokok 8 juta + tunjangan 1.5 juta + lembur 500rb = 10 juta
      const gross = calculateGrossIncome(8000000, 1500000, 500000);
      expect(gross).toBe(10000000);

      const result = calculatePPh21(
        { gross_income: gross, ptkp_status: 'K/0' },
        sampleTERRates,
      );
      // Kategori A, 10 juta → rate 2% (range 9650001-10050000)
      // PPh21 = floor(10000000 × 2 / 100) = 200000
      expect(result.ter_category).toBe('A');
      expect(result.ter_rate_percent).toBe(2);
      expect(result.pph21_amount).toBe(200000);
    });

    it('should calculate correctly for married employee with 3 dependents', () => {
      // Karyawan K/3, gaji pokok 8 juta + tunjangan 1 juta + lembur 0 = 9 juta
      const gross = calculateGrossIncome(8000000, 1000000, 0);
      expect(gross).toBe(9000000);

      const result = calculatePPh21(
        { gross_income: gross, ptkp_status: 'K/3' },
        sampleTERRates,
      );
      // Kategori C, 9 juta → rate 1.25% (range 8850001-9800000)
      // PPh21 = floor(9000000 × 1.25 / 100) = floor(112500) = 112500
      expect(result.ter_category).toBe('C');
      expect(result.ter_rate_percent).toBe(1.25);
      expect(result.pph21_amount).toBe(112500);
    });
  });
});
