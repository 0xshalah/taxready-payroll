-- Migration: Secure encryption functions using Supabase Vault
-- SECURITY FIX: Encryption key is now stored in Vault, not passed from client.
--
-- Prerequisites:
-- 1. Enable pgcrypto extension: CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- 2. Enable vault extension: CREATE EXTENSION IF NOT EXISTS supabase_vault;
-- 3. Store encryption key in Vault:
--    INSERT INTO vault.secrets (name, secret)
--    VALUES ('encryption_key', 'your-strong-random-key-min-32-chars');
--
-- These functions use SECURITY DEFINER so they run with the owner's privileges,
-- allowing them to access vault.secrets without exposing the key to the caller.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop old functions that accepted key as parameter (if they exist)
DROP FUNCTION IF EXISTS public.encrypt_value(text, text);
DROP FUNCTION IF EXISTS public.decrypt_value(bytea, text);
DROP FUNCTION IF EXISTS public.encrypt_value(text);
DROP FUNCTION IF EXISTS public.decrypt_value(bytea);

/**
 * Encrypt a plaintext value using AES-256 with key from Vault.
 * The encryption key is NEVER exposed to the client.
 *
 * Usage: SELECT encrypt_value('sensitive data');
 * Returns: encrypted bytea value
 */
CREATE OR REPLACE FUNCTION public.encrypt_value(plain_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  encryption_key text;
  encrypted_data bytea;
BEGIN
  -- Retrieve encryption key from Supabase Vault
  SELECT secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'encryption_key'
  LIMIT 1;

  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in Vault. Configure it via Supabase Dashboard.';
  END IF;

  -- Encrypt using pgcrypto AES-256
  encrypted_data := pgp_sym_encrypt(plain_text, encryption_key);

  -- Return as base64 encoded text for easy storage/transport
  RETURN encode(encrypted_data, 'base64');
END;
$$;

/**
 * Decrypt an encrypted value using AES-256 with key from Vault.
 * The encryption key is NEVER exposed to the client.
 *
 * Usage: SELECT decrypt_value('base64-encoded-encrypted-data');
 * Returns: decrypted plaintext
 */
CREATE OR REPLACE FUNCTION public.decrypt_value(encrypted_data text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  encryption_key text;
  raw_data bytea;
  decrypted_text text;
BEGIN
  -- Retrieve encryption key from Supabase Vault
  SELECT secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'encryption_key'
  LIMIT 1;

  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in Vault. Configure it via Supabase Dashboard.';
  END IF;

  -- Decode from base64
  raw_data := decode(encrypted_data, 'base64');

  -- Decrypt using pgcrypto
  decrypted_text := pgp_sym_decrypt(raw_data, encryption_key);

  RETURN decrypted_text;
END;
$$;

-- Revoke direct access to these functions from anon role
-- Only authenticated users can call them
REVOKE EXECUTE ON FUNCTION public.encrypt_value(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrypt_value(text) FROM anon;

-- Grant to authenticated users only
GRANT EXECUTE ON FUNCTION public.encrypt_value(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_value(text) TO authenticated;

-- IMPORTANT: After running this migration, store the encryption key in Vault:
-- Go to Supabase Dashboard → Settings → Vault → New Secret
-- Name: encryption_key
-- Value: (generate a strong random key, minimum 32 characters)
-- Example: openssl rand -base64 32
