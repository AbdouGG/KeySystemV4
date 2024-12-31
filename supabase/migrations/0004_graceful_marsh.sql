/*
  # Create checkpoint verifications system
  
  1. New Tables
    - `checkpoint_verifications`
      - Tracks verification status for each checkpoint
      - Includes audit timestamps
  
  2. Security
    - Enables RLS
    - Adds policy for public read access
*/

-- Create the checkpoint verifications table
CREATE TABLE IF NOT EXISTS checkpoint_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  checkpoint_number smallint NOT NULL CHECK (checkpoint_number BETWEEN 1 AND 3),
  verified boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_checkpoint_verifications_updated_at
  BEFORE UPDATE ON checkpoint_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE checkpoint_verifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON checkpoint_verifications;
DROP POLICY IF EXISTS "Allow system updates" ON checkpoint_verifications;

-- Create policies
CREATE POLICY "Allow public read access"
  ON checkpoint_verifications
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow system updates"
  ON checkpoint_verifications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);