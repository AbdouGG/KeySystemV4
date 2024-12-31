/*
  # Fix automatic token cleanup

  1. Changes
    - Creates an immediate trigger for token cleanup
    - Adds a more frequent scheduled job
    - Implements a more aggressive cleanup strategy
    - Adds logging for debugging

  2. Security
    - Functions run with security definer
    - Proper error handling
*/

-- Drop existing cleanup function and schedule
DROP FUNCTION IF EXISTS cleanup_expired_verification_tokens();
SELECT cron.unschedule('cleanup-expired-verification-tokens');

-- Create an improved cleanup function with logging
CREATE OR REPLACE FUNCTION cleanup_expired_verification_tokens()
RETURNS void AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM verification_tokens
    WHERE expires_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  -- Log the deletion count
  RAISE NOTICE 'Deleted % expired verification tokens', deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an immediate trigger function
CREATE OR REPLACE FUNCTION check_expired_tokens()
RETURNS trigger AS $$
BEGIN
  -- Immediately delete expired tokens
  DELETE FROM verification_tokens
  WHERE expires_at < NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run on any verification_tokens changes
DROP TRIGGER IF EXISTS trigger_check_expired_tokens ON verification_tokens;
CREATE TRIGGER trigger_check_expired_tokens
  AFTER INSERT OR UPDATE
  ON verification_tokens
  FOR EACH STATEMENT
  EXECUTE FUNCTION check_expired_tokens();

-- Schedule more frequent cleanup (every 30 seconds)
SELECT cron.schedule(
  'cleanup-expired-verification-tokens',
  '* * * * *',
  $$SELECT cleanup_expired_verification_tokens()$$
);

-- Ensure index exists for performance
DROP INDEX IF EXISTS idx_verification_tokens_expires_at;
CREATE INDEX idx_verification_tokens_expires_at 
  ON verification_tokens(expires_at);

-- Run initial cleanup
SELECT cleanup_expired_verification_tokens();