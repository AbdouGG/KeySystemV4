/*
  # Update Keys Table RLS Policies

  1. Changes
    - Drop existing policies
    - Create new, more permissive policies for key claiming
    - Add policy for updating HWID
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read keys" ON keys;
DROP POLICY IF EXISTS "Anyone can create keys" ON keys;
DROP POLICY IF EXISTS "Allow HWID updates" ON keys;

-- Create new policies
CREATE POLICY "Public read access to keys"
  ON keys FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow key creation"
  ON keys FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow HWID updates on unclaimed keys"
  ON keys FOR UPDATE
  TO public
  USING (hwid IS NULL)
  WITH CHECK (true);