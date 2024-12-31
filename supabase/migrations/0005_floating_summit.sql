/*
  # Add checkpoint progress tracking

  1. New Tables
    - `checkpoint_progress`
      - `hwid` (text, primary key)
      - `checkpoint1` (boolean)
      - `checkpoint2` (boolean)
      - `checkpoint3` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `checkpoint_progress` table
    - Add policies for public access
*/

CREATE TABLE IF NOT EXISTS checkpoint_progress (
  hwid text PRIMARY KEY,
  checkpoint1 boolean DEFAULT false,
  checkpoint2 boolean DEFAULT false,
  checkpoint3 boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create updated_at trigger
CREATE TRIGGER update_checkpoint_progress_updated_at
  BEFORE UPDATE ON checkpoint_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE checkpoint_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to checkpoint_progress"
  ON checkpoint_progress
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert/update to checkpoint_progress"
  ON checkpoint_progress
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);