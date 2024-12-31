/*
  # Update key system for empty HWID support
  
  1. Changes
    - Remove NOT NULL constraint from hwid column
    - Add trigger to validate HWID updates
    - Update policies to allow HWID updates
*/

-- Remove NOT NULL constraint from hwid column
ALTER TABLE keys ALTER COLUMN hwid DROP NOT NULL;

-- Create function to validate HWID updates
CREATE OR REPLACE FUNCTION validate_hwid_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow setting HWID if it's currently NULL or empty
  IF (OLD.hwid IS NULL OR OLD.hwid = '') THEN
    RETURN NEW;
  END IF;

  -- If HWID is already set, only allow updates to the same HWID
  IF NEW.hwid = OLD.hwid THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'HWID cannot be changed once set';
END;
$$ LANGUAGE plpgsql;

-- Create trigger for HWID validation
CREATE TRIGGER validate_hwid_update_trigger
  BEFORE UPDATE ON keys
  FOR EACH ROW
  EXECUTE FUNCTION validate_hwid_update();

-- Update policies to allow HWID updates
CREATE POLICY "Allow HWID updates"
  ON keys
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);