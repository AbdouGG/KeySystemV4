/*
  # Add HWID support to keys table

  1. Changes
    - Add HWID column to keys table with a default value
    - Add index for HWID queries
    - Add unique constraint for valid keys per HWID
  
  2. Notes
    - Using a placeholder value 'legacy' for existing rows
    - New rows will require explicit HWID values
    - Using separate unique index and check constraint for expiration
*/

-- Add HWID column with a default value for existing rows
ALTER TABLE keys 
  ADD COLUMN IF NOT EXISTS hwid text DEFAULT 'legacy' NOT NULL;

-- Remove the default after adding the column
ALTER TABLE keys 
  ALTER COLUMN hwid DROP DEFAULT;

-- Add index for HWID queries
CREATE INDEX IF NOT EXISTS idx_keys_hwid 
  ON keys(hwid);

-- Add unique index for valid keys per HWID
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_valid_key_per_hwid 
  ON keys(hwid, is_valid)
  WHERE is_valid = true;

-- Add check constraint for expiration
ALTER TABLE keys
  ADD CONSTRAINT check_key_expiration
  CHECK (expires_at > created_at);