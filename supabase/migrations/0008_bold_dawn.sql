/*
  # Add delayed key deletion trigger
  
  1. Changes
    - Creates a trigger function with 10-second delay before deleting expired keys
    - Adds trigger to automatically delete expired keys after delay
    - Updates clean_expired_keys function to include delay
  
  2. Security
    - No RLS changes needed
    - Functions execute with invoker's privileges
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