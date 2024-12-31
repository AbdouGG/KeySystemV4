/*
  # Create keys table for key system

  1. New Tables
    - `keys`
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `created_at` (timestamp)
      - `expires_at` (timestamp)
      - `is_valid` (boolean)

  2. Security
    - Enable RLS on `keys` table
    - Add policies for key management
*/

CREATE TABLE IF NOT EXISTS keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_valid boolean DEFAULT true
);

ALTER TABLE keys ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read keys (needed for validation)
CREATE POLICY "Anyone can read keys"
  ON keys
  FOR SELECT
  TO anon
  USING (true);

-- Only authenticated users can create keys
CREATE POLICY "Only authenticated users can create keys"
  ON keys
  FOR INSERT
  TO authenticated
  WITH CHECK (true);