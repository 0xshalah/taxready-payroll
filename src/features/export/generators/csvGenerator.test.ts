/**
 * Unit tests untuk CSV/XML Generator Coretax
 * Validates: Persyaratan 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { describe, it, expect } from 'vitest';
import {
  generateCoretaxCSV,
  validateExportRecords,
  sanitizeFilename,
  ExportValidationError,
  type ExportRecord,
  type ExportPeriod,
} from './csvGenerator';
import { generateCoretaxXML } from './xmlGenerator';

// === Test Data ===

const validRecords: ExportRecord[] = [
  { nik: '3201234567890001', nama_lengkap: 'Budi Santoso', gross_income: 10000000, pph21: 250000 },
  { nik: '3201234567890002', nama_lengkap: 'Siti Rahayu', gross_income: 8000000, pph21: 160000 },
];

const validPeriod: ExportPeriod = { month: 3, year: 2026 };

// === sanitizeFilename Tests ===

describe('sanitizeFilename', () => {
  it('should remove special characters from company name', () => {
    expect(sanitizeFilename('PT. Maju Jaya!')).toBe('PT_Maju_Jaya');
  });

  it('should replace spaces with underscores', () => {
    expect(sanitizeFilename('Perusahaan Saya')).toBe('Perusahaan_Saya');
  });

  it('should handle multiple spaces', () => {
    expect(sanitizeFilename('PT   Maju   Jaya')).toBe('PT_Maju_Jaya');
  });

  it('should keep alphanumeric and dash', () => {
    expect(sanitizeFilename('PT Maju-Jaya 123')).toBe('PT_Maju-Jaya_123');
  });

  it('should handle empty string', () => {
    expect(sanitizeFilename('')).toBe('');
  });

  it('should remove leading/trailing underscores', () => {
    expect(sanitizeFilename(' PT Maju ')).toBe('PT_Maju');
  });
});

// === validateExportRecords Tests ===

describe('validateExportRecords', () => {
  it('should return valid for correct records', () => {
    const result = validateExportRecords(validRecords);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject empty records array', () => {
    const result = validateExportRecords([]);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.field).toBe('records');
  });

  it('should detect NIK with less than 16 digits', () => {
    const records: ExportRecord[] = [
      { nik: '12345', nama_lengkap: 'Test', gross_income: 5000000, pph21: 100000 },
    ];
    const result = validateExportRecords(records);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'nik')).toBe(true);
  });

  it('should detect NIK with non-numeric characters', () => {
    const records: ExportRecord[] = [
      { nik: '320123456789ABCD', nama_lengkap: 'Test', gross_income: 5000000, pph21: 100000 },
    ];
    const result = validateExportRecords(records);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'nik')).toBe(true);
  });

  it('should detect empty NIK', () => {
    const records: ExportRecord[] = [
      { nik: '', nama_lengkap: 'Test', gross_income: 5000000, pph21: 100000 },
    ];
    const result = validateExportRecords(records);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'nik')).toBe(true);
  });

  it('should detect empty nama_lengkap', () => {
    const records: ExportRecord[] = [
      { nik: '3201234567890001', nama_lengkap: '', gross_income: 5000000, pph21: 100000 },
    ];
    const result = validateExportRecords(records);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'nama_lengkap')).toBe(true);
  });

  it('should detect negative gross_income', () => {
    const records: ExportRecord[] = [
      { nik: '3201234567890001', nama_lengkap: 'Test', gross_income: -1000, pph21: 100000 },
    ];
    const result = validateExportRecords(records);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'gross_income')).toBe(true);
  });

  it('should detect negative pph21', () => {
    const records: ExportRecord[] = [
      { nik: '3201234567890001', nama_lengkap: 'Test', gross_income: 5000000, pph21: -500 },
    ];
    const result = validateExportRecords(records);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'pph21')).toBe(true);
  });

  it('should collect multiple errors from multiple records', () => {
    const records: ExportRecord[] = [
      { nik: '123', nama_lengkap: '', gross_income: 5000000, pph21: 100000 },
      { nik: '3201234567890001', nama_lengkap: 'Valid', gross_income: -100, pph21: 0 },
    ];
    const result = validateExportRecords(records);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('should allow zero gross_income and zero pph21', () => {
    const records: ExportRecord[] = [
      { nik: '3201234567890001', nama_lengkap: 'Test', gross_income: 0, pph21: 0 },
    ];
    const result = validateExportRecords(records);
    expect(result.valid).toBe(true);
  });
});

// === generateCoretaxCSV Tests ===

describe('generateCoretaxCSV', () => {
  it('should generate correct filename format', () => {
    const result = generateCoretaxCSV('PT Maju Jaya', validPeriod, validRecords);
    expect(result.filename).toBe('PT_Maju_Jaya_2026_03.csv');
  });

  it('should generate filename with padded month', () => {
    const result = generateCoretaxCSV('PT Test', { month: 1, year: 2026 }, validRecords);
    expect(result.filename).toBe('PT_Test_2026_01.csv');
  });

  it('should generate filename without padding for month >= 10', () => {
    const result = generateCoretaxCSV('PT Test', { month: 12, year: 2026 }, validRecords);
    expect(result.filename).toBe('PT_Test_2026_12.csv');
  });

  it('should have correct CSV header with exactly 4 columns', () => {
    const result = generateCoretaxCSV('PT Test', validPeriod, validRecords);
    const lines = result.content.split('\n');
    // Skip metadata comment lines (starting with #)
    const dataLines = lines.filter(l => !l.startsWith('#'));
    expect(dataLines[0]).toBe('NIK,Nama Lengkap,Penghasilan Bruto,Potongan PPh 21');
  });

  it('should have correct number of data rows', () => {
    const result = generateCoretaxCSV('PT Test', validPeriod, validRecords);
    const lines = result.content.split('\n');
    // Skip metadata comment lines (starting with #)
    const dataLines = lines.filter(l => !l.startsWith('#'));
    // 1 header + 2 data rows
    expect(dataLines).toHaveLength(3);
  });

  it('should output correct data values', () => {
    const records: ExportRecord[] = [
      { nik: '3201234567890001', nama_lengkap: 'Budi', gross_income: 10000000, pph21: 250000 },
    ];
    const result = generateCoretaxCSV('PT Test', validPeriod, records);
    const lines = result.content.split('\n');
    const dataLines = lines.filter(l => !l.startsWith('#'));
    expect(dataLines[1]).toBe('3201234567890001,Budi,10000000,250000');
  });

  it('should round gross_income and pph21 to integers', () => {
    const records: ExportRecord[] = [
      { nik: '3201234567890001', nama_lengkap: 'Budi', gross_income: 10000000.7, pph21: 250000.3 },
    ];
    const result = generateCoretaxCSV('PT Test', validPeriod, records);
    const lines = result.content.split('\n');
    const dataLines = lines.filter(l => !l.startsWith('#'));
    expect(dataLines[1]).toBe('3201234567890001,Budi,10000001,250000');
  });

  it('should escape CSV fields containing commas', () => {
    const records: ExportRecord[] = [
      { nik: '3201234567890001', nama_lengkap: 'Budi, S.Kom', gross_income: 10000000, pph21: 250000 },
    ];
    const result = generateCoretaxCSV('PT Test', validPeriod, records);
    const lines = result.content.split('\n');
    const dataLines = lines.filter(l => !l.startsWith('#'));
    expect(dataLines[1]).toBe('3201234567890001,"Budi, S.Kom",10000000,250000');
  });

  it('should throw ExportValidationError for invalid records', () => {
    const invalidRecords: ExportRecord[] = [
      { nik: '123', nama_lengkap: 'Test', gross_income: 5000000, pph21: 100000 },
    ];
    expect(() => generateCoretaxCSV('PT Test', validPeriod, invalidRecords)).toThrow(ExportValidationError);
  });

  it('should throw ExportValidationError for empty records', () => {
    expect(() => generateCoretaxCSV('PT Test', validPeriod, [])).toThrow(ExportValidationError);
  });

  it('should only contain 4 fields per row (no extra fields)', () => {
    const result = generateCoretaxCSV('PT Test', validPeriod, validRecords);
    const lines = result.content.split('\n');
    // Skip metadata comment lines (starting with #)
    const dataLines = lines.filter(l => !l.startsWith('#'));
    for (const line of dataLines) {
      // Each line should have exactly 3 commas (4 fields)
      // Unless a field is quoted and contains a comma
      const fields = parseCSVLine(line);
      expect(fields).toHaveLength(4);
    }
  });
});

// === generateCoretaxXML Tests ===

describe('generateCoretaxXML', () => {
  it('should generate correct filename format', () => {
    const result = generateCoretaxXML('PT Maju Jaya', validPeriod, validRecords);
    expect(result.filename).toBe('PT_Maju_Jaya_2026_03.xml');
  });

  it('should start with XML declaration', () => {
    const result = generateCoretaxXML('PT Test', validPeriod, validRecords);
    expect(result.content).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  });

  it('should have coretax root element', () => {
    const result = generateCoretaxXML('PT Test', validPeriod, validRecords);
    expect(result.content).toContain('<coretax>');
    expect(result.content).toContain('</coretax>');
  });

  it('should have employees wrapper element', () => {
    const result = generateCoretaxXML('PT Test', validPeriod, validRecords);
    expect(result.content).toContain('<employees>');
    expect(result.content).toContain('</employees>');
  });

  it('should contain exactly 4 fields per employee (nik, nama_lengkap, penghasilan_bruto, pph21)', () => {
    const records: ExportRecord[] = [
      { nik: '3201234567890001', nama_lengkap: 'Budi', gross_income: 10000000, pph21: 250000 },
    ];
    const result = generateCoretaxXML('PT Test', validPeriod, records);
    expect(result.content).toContain('<nik>3201234567890001</nik>');
    expect(result.content).toContain('<nama_lengkap>Budi</nama_lengkap>');
    expect(result.content).toContain('<penghasilan_bruto>10000000</penghasilan_bruto>');
    expect(result.content).toContain('<pph21>250000</pph21>');
  });

  it('should not contain any extra fields beyond the 4 required', () => {
    const result = generateCoretaxXML('PT Test', validPeriod, validRecords);
    // Only these tags should appear inside <employee>
    const employeeContent = result.content.match(/<employee>([\s\S]*?)<\/employee>/g);
    expect(employeeContent).not.toBeNull();
    for (const emp of employeeContent!) {
      // Should only contain nik, nama_lengkap, penghasilan_bruto, pph21
      const tags = emp.match(/<(\w+)>/g)?.filter(t => t !== '<employee>') ?? [];
      expect(tags).toHaveLength(4);
      expect(tags).toContain('<nik>');
      expect(tags).toContain('<nama_lengkap>');
      expect(tags).toContain('<penghasilan_bruto>');
      expect(tags).toContain('<pph21>');
    }
  });

  it('should escape XML special characters in names', () => {
    const records: ExportRecord[] = [
      { nik: '3201234567890001', nama_lengkap: 'Budi & Siti <Corp>', gross_income: 10000000, pph21: 250000 },
    ];
    const result = generateCoretaxXML('PT Test', validPeriod, records);
    expect(result.content).toContain('<nama_lengkap>Budi &amp; Siti &lt;Corp&gt;</nama_lengkap>');
  });

  it('should round gross_income and pph21 to integers', () => {
    const records: ExportRecord[] = [
      { nik: '3201234567890001', nama_lengkap: 'Budi', gross_income: 10000000.7, pph21: 250000.3 },
    ];
    const result = generateCoretaxXML('PT Test', validPeriod, records);
    expect(result.content).toContain('<penghasilan_bruto>10000001</penghasilan_bruto>');
    expect(result.content).toContain('<pph21>250000</pph21>');
  });

  it('should throw ExportValidationError for invalid records', () => {
    const invalidRecords: ExportRecord[] = [
      { nik: '123', nama_lengkap: 'Test', gross_income: 5000000, pph21: 100000 },
    ];
    expect(() => generateCoretaxXML('PT Test', validPeriod, invalidRecords)).toThrow(ExportValidationError);
  });

  it('should throw ExportValidationError for empty records', () => {
    expect(() => generateCoretaxXML('PT Test', validPeriod, [])).toThrow(ExportValidationError);
  });

  it('should generate correct number of employee elements', () => {
    const result = generateCoretaxXML('PT Test', validPeriod, validRecords);
    const matches = result.content.match(/<employee>/g);
    expect(matches).toHaveLength(2);
  });
});

// === Helper for CSV parsing ===

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}
