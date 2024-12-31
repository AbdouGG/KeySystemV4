/*
  # Secure checkpoint storage system

  1. New Tables
    - `user_checkpoints`
      - `hwid` (text, primary key)
      - `checkpoint1` (boolean)
      - `checkpoint2` (boolean)
      - `checkpoint3` (boolean)
      - `last_verification` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for checkpoint access
*/

CREATE TABLE IF NOT EXISTS user_checkpoints (
  hwid text PRIMARY KEY,
  checkpoint1 boolean DEFAULT false,
  checkpoint2 boolean DEFAULT false,
  checkpoint3 boolean DEFAULT false,
  last_verification timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_checkpoints ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own checkpoints"
  ON user_checkpoints
  FOR SELECT
  TO public
  USING (hwid = current_setting('app.current_hwid', TRUE));

CREATE POLICY "Users can update their own checkpoints"
  ON user_checkpoints
  FOR UPDATE
  TO public
  USING (hwid = current_setting('app.current_hwid', TRUE));

-- Create function to set HWID
CREATE OR REPLACE FUNCTION set_hwid(hwid text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_hwid', hwid, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;