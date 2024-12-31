/*
  # Update RLS policies for keys table

  1. Security Changes
    - Allow anonymous users to create keys
    - Maintain read access for key validation
    - Add rate limiting by IP (future enhancement)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read keys" ON keys;
DROP POLICY IF EXISTS "Only authenticated users can create keys" ON keys;

-- Create new policies
CREATE POLICY "Anyone can read keys"
  ON keys
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create keys"
  ON keys
  FOR INSERT
  TO public
  WITH CHECK (true);