/**
 * Tests untuk client-side masking helpers
 * Validates: Persyaratan 8.7
 */

import { describe, it, expect } from 'vitest';
import { maskNIK, isNIKMasked, isValidNIKFormat } from '@/lib/encryption';

describe('maskNIK', () => {
  it('should mask NIK showing only last 4 digits', () => {
    expect(maskNIK('1234567890123456')).toBe('************3456');
  });

  it('should handle NIK with different last 4 digits', () => {
    expect(maskNIK('3201234567891234')).toBe('************1234');
  });

  it('should return empty string for empty input', () => {
    expect(maskNIK('')).toBe('');
  });

  it('should return empty string for input shorter than 4 characters', () => {
    expect(maskNIK('123')).toBe('');
  });

  it('should handle input with exactly 4 characters (no masking needed)', () => {
    expect(maskNIK('1234')).toBe('1234');
  });

  it('should produce masked string with correct length', () => {
    const nik = '1234567890123456';
    const masked = maskNIK(nik);
    expect(masked.length).toBe(nik.length);
  });
});

describe('isNIKMasked', () => {
  it('should return true for masked NIK', () => {
    expect(isNIKMasked('************3456')).toBe(true);
  });

  it('should return false for unmasked NIK', () => {
    expect(isNIKMasked('1234567890123456')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isNIKMasked('')).toBe(false);
  });
});

describe('isValidNIKFormat', () => {
  it('should return true for valid 16-digit NIK', () => {
    expect(isValidNIKFormat('1234567890123456')).toBe(true);
  });

  it('should return false for NIK with less than 16 digits', () => {
    expect(isValidNIKFormat('123456789012345')).toBe(false);
  });

  it('should return false for NIK with more than 16 digits', () => {
    expect(isValidNIKFormat('12345678901234567')).toBe(false);
  });

  it('should return false for NIK with non-numeric characters', () => {
    expect(isValidNIKFormat('12345678901234ab')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isValidNIKFormat('')).toBe(false);
  });

  it('should return false for NIK with spaces', () => {
    expect(isValidNIKFormat('1234 5678 9012 3456')).toBe(false);
  });
});
