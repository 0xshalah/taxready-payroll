/**
 * Generator XML untuk ekspor laporan bulanan format Coretax
 * Validates: Persyaratan 5.1, 5.2, 5.3, 5.4
 *
 * File ekspor Coretax HANYA mengandung 4 field:
 * 1. NIK (16 digit)
 * 2. Nama Lengkap
 * 3. Penghasilan Bruto (angka bulat)
 * 4. Potongan PPh 21 (angka bulat)
 *
 * Struktur XML:
 * <coretax>
 *   <employees>
 *     <employee>
 *       <nik>...</nik>
 *       <nama_lengkap>...</nama_lengkap>
 *       <penghasilan_bruto>...</penghasilan_bruto>
 *       <pph21>...</pph21>
 *     </employee>
 *   </employees>
 * </coretax>
 */

import type { ExportRecord, ExportPeriod, GeneratedFile } from './csvGenerator';
import { validateExportRecords, sanitizeFilename, ExportValidationError } from './csvGenerator';

/**
 * Generate file XML format Coretax.
 * Struktur: <coretax><employees><employee>...</employee></employees></coretax>
 */
export function generateCoretaxXML(
  companyName: string,
  period: ExportPeriod,
  records: ExportRecord[]
): GeneratedFile {
  // Validasi pra-ekspor
  const validation = validateExportRecords(records);
  if (!validation.valid) {
    throw new ExportValidationError('Data tidak valid untuk ekspor', validation.errors);
  }

  // Generate filename: [NamaPerusahaan]_[YYYY]_[MM].xml
  const sanitizedName = sanitizeFilename(companyName);
  const monthStr = String(period.month).padStart(2, '0');
  const filename = `${sanitizedName}_${period.year}_${monthStr}.xml`;

  // Generate XML content
  const xmlLines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<coretax>',
    '  <employees>',
  ];

  for (const record of records) {
    xmlLines.push('    <employee>');
    xmlLines.push(`      <nik>${escapeXML(record.nik)}</nik>`);
    xmlLines.push(`      <nama_lengkap>${escapeXML(record.nama_lengkap)}</nama_lengkap>`);
    xmlLines.push(`      <penghasilan_bruto>${Math.round(record.gross_income)}</penghasilan_bruto>`);
    xmlLines.push(`      <pph21>${Math.round(record.pph21)}</pph21>`);
    xmlLines.push('    </employee>');
  }

  xmlLines.push('  </employees>');
  xmlLines.push('</coretax>');

  const content = xmlLines.join('\n');

  return { filename, content };
}

/**
 * Escape karakter spesial XML (&, <, >, ", ')
 */
function escapeXML(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
