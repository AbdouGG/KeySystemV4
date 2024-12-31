/*
  # Update key deletion trigger with delay
  
  1. Changes
    - Add 10-second delay before deleting expired keys
    - Update trigger function to include delay
    - Update manual cleanup function to include delay
  
  2. Details
    - Uses pg_sleep(10) to add a 10-second delay
    - Maintains existing functionality but adds delay
    - Applies to both trigger and manual cleanup
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS delete_expired_keys_trigger ON keys;

-- Create or replace the trigger function with delay
CREATE OR REPLACE FUNCTION delete_expired_keys_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  -- Schedule deletion after 10 seconds
  PERFORM pg_sleep(10);
  DELETE FROM keys 
  WHERE expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER delete_expired_keys_trigger
  AFTER INSERT OR UPDATE ON keys
  FOR EACH STATEMENT
  EXECUTE FUNCTION delete_expired_keys_trigger_fn();

-- Function to manually clean expired keys with delay
CREATE OR REPLACE FUNCTION clean_expired_keys()
RETURNS void AS $$
BEGIN
  -- Add 10-second delay before deletion
  PERFORM pg_sleep(10);
  DELETE FROM keys 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;