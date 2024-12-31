/*
  # Fix key deletion mechanism
  
  1. Changes
    - Implement a scheduled job for key deletion
    - Remove problematic triggers
    - Add reliable cleanup function
    
  2. Details
    - Uses pg_cron for scheduled deletion
    - Implements proper grace period
    - Adds error handling
*/

-- Drop existing objects
DROP TRIGGER IF EXISTS cleanup_expired_keys_trigger ON keys;
DROP TRIGGER IF EXISTS delete_expired_keys_trigger ON keys;
DROP FUNCTION IF EXISTS schedule_expired_keys_cleanup();
DROP FUNCTION IF EXISTS process_expired_keys();
DROP FUNCTION IF EXISTS clean_expired_keys();

-- Create the cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_keys()
RETURNS void AS $$
BEGIN
  -- Delete keys that have been expired for more than 10 seconds
  DELETE FROM keys 
  WHERE expires_at < (NOW() - INTERVAL '10 seconds');
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error cleaning expired keys: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Make sure pg_cron extension exists
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop existing job if it exists
SELECT cron.unschedule('cleanup-expired-keys');

-- Schedule the cleanup to run every minute
SELECT cron.schedule(
  'cleanup-expired-keys',
  '* * * * *',
  $$SELECT cleanup_expired_keys()$$
);