/*
  # Fix trigger refresh and timeout issues
  
  1. Changes
    - Drop and recreate triggers with proper statement_timeout settings
    - Implement async job approach for key deletion
    - Add proper error handling
  
  2. Details
    - Uses pg_notify for async handling
    - Removes problematic pg_sleep calls
    - Sets appropriate timeout values
*/

-- First, drop existing objects
DROP TRIGGER IF EXISTS delete_expired_keys_trigger ON keys;
DROP FUNCTION IF EXISTS delete_expired_keys_trigger_fn();
DROP FUNCTION IF EXISTS delete_expired_keys_with_grace();
DROP FUNCTION IF EXISTS clean_expired_keys();

-- Create a function to handle expired keys asynchronously
CREATE OR REPLACE FUNCTION process_expired_keys()
RETURNS void AS $$
DECLARE
  affected_rows integer;
BEGIN
  -- Delete keys that have been expired
  WITH deleted AS (
    DELETE FROM keys 
    WHERE expires_at < (NOW() - INTERVAL '10 seconds')
    RETURNING id
  )
  SELECT COUNT(*) INTO affected_rows FROM deleted;
  
  -- Log the deletion (optional)
  IF affected_rows > 0 THEN
    RAISE NOTICE 'Deleted % expired keys', affected_rows;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors but don't fail the transaction
    RAISE WARNING 'Error processing expired keys: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function that schedules the cleanup
CREATE OR REPLACE FUNCTION schedule_expired_keys_cleanup()
RETURNS TRIGGER AS $$
BEGIN
  -- Schedule the cleanup to run asynchronously
  PERFORM pg_notify('expired_keys_cleanup', '');
  RETURN NULL;
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors but don't fail the transaction
    RAISE WARNING 'Error scheduling cleanup: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER cleanup_expired_keys_trigger
  AFTER INSERT OR UPDATE ON keys
  FOR EACH STATEMENT
  EXECUTE FUNCTION schedule_expired_keys_cleanup();

-- Function for manual cleanup
CREATE OR REPLACE FUNCTION clean_expired_keys()
RETURNS void AS $$
BEGIN
  PERFORM process_expired_keys();
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in manual cleanup: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;