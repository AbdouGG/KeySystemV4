/*
  # Add verification tokens table

  1. New Tables
    - `verification_tokens`
      - `id` (uuid, primary key)
      - `token` (text, unique)
      - `hwid` (text)
      - `checkpoint_number` (smallint)
      - `expires_at` (timestamptz)
      - `used` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `verification_tokens` table
    - Add policy for public access
*/

-- Create verification tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  hwid text NOT NULL,
  checkpoint_number smallint NOT NULL CHECK (checkpoint_number BETWEEN 1 AND 3),
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Allow public verification token access"
  ON verification_tokens
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Add index for token lookups
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token 
  ON verification_tokens(token);

-- Add index for HWID and checkpoint number
CREATE INDEX IF NOT EXISTS idx_verification_tokens_hwid_checkpoint 
  ON verification_tokens(hwid, checkpoint_number);

-- Add index for expiration checks
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at 
  ON verification_tokens(expires_at);