/*
  # Fix key deletion timeout issue
  
  1. Changes
    - Remove pg_sleep that was causing timeouts
    - Implement a more reliable deletion approach
    - Add grace period using timestamp comparison
  
  2. Details
    - Uses timestamp comparison instead of sleep
    - Adds 10 second buffer to expiration check
    - More reliable and won't cause timeouts
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS delete_expired_keys_trigger ON keys;
DROP FUNCTION IF EXISTS delete_expired_keys_trigger_fn();
DROP FUNCTION IF EXISTS clean_expired_keys();

-- Create new function for expired key deletion with grace period
CREATE OR REPLACE FUNCTION delete_expired_keys_with_grace()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete keys that have been expired for more than 10 seconds
  DELETE FROM keys 
  WHERE expires_at < (NOW() - INTERVAL '10 seconds');
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER delete_expired_keys_trigger
  AFTER INSERT OR UPDATE ON keys
  FOR EACH STATEMENT
  EXECUTE FUNCTION delete_expired_keys_with_grace();

-- Function for manual cleanup
CREATE OR REPLACE FUNCTION clean_expired_keys()
RETURNS void AS $$
BEGIN
  DELETE FROM keys 
  WHERE expires_at < (NOW() - INTERVAL '10 seconds');
END;
$$ LANGUAGE plpgsql;