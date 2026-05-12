/**
 * Input khusus NIK dengan validasi 16 digit inline
 * Validates: Persyaratan 1.1, 1.2, 1.3
 *
 * Fitur:
 * - Hanya menerima input angka
 * - Validasi real-time (16 digit)
 * - Pesan error inline
 * - Indikator visual valid/invalid
 */

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui';
import { Label } from '@/components/ui';
import { validateNIK } from '@/features/employees/validators/employeeSchema';
import { NIK_LENGTH } from '@/lib/constants';

interface NIKValidationInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Error dari parent (misalnya duplikat NIK) */
  externalError?: string;
}

export function NIKValidationInput({
  value,
  onChange,
  disabled = false,
  externalError,
}: NIKValidationInputProps) {
  const [touched, setTouched] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Hanya izinkan angka
      const rawValue = e.target.value.replace(/\D/g, '');
      // Batasi maksimal 16 karakter
      const trimmed = rawValue.slice(0, NIK_LENGTH);
      onChange(trimmed);
    },
    [onChange]
  );

  const handleBlur = useCallback(() => {
    setTouched(true);
  }, []);

  // Validasi NIK
  const validation = validateNIK(value);
  const showError = touched && !validation.valid;
  const errorMessage = externalError || (showError ? validation.error : undefined);
  const isValid = validation.valid && !externalError;

  return (
    <div className="space-y-1.5">
      <Label htmlFor="nik">NIK (Nomor Induk Kependudukan)</Label>
      <div className="relative">
        <Input
          id="nik"
          type="text"
          inputMode="numeric"
          placeholder="Masukkan 16 digit NIK"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          maxLength={NIK_LENGTH}
          aria-invalid={!!errorMessage}
          aria-describedby={errorMessage ? 'nik-error' : undefined}
          className={
            errorMessage
              ? 'border-error focus-visible:border-error focus-visible:ring-error/15'
              : isValid && touched
                ? 'border-primary focus-visible:border-primary'
                : ''
          }
        />
        {/* Digit counter */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-mute">
          {value.length}/{NIK_LENGTH}
        </span>
      </div>
      {errorMessage && (
        <p id="nik-error" className="text-xs text-error" role="alert">
          {errorMessage}
        </p>
      )}
      {isValid && touched && (
        <p className="text-xs text-success-foreground">NIK valid</p>
      )}
    </div>
  );
}
