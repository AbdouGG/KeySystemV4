/*
  # Add automatic deletion of expired tokens

  1. Changes
    - Creates a function to delete expired verification tokens
    - Sets up a scheduled job to run every minute
    - Adds an index to optimize the deletion query

  2. Security
    - Function runs with security definer to ensure proper permissions
    - Only deletes tokens that are expired
*/

-- Create the cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_verification_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_tokens 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure pg_cron extension exists
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing job if it exists
SELECT cron.unschedule('cleanup-expired-verification-tokens');

-- Schedule the cleanup to run every minute
SELECT cron.schedule(
  'cleanup-expired-verification-tokens',
  '* * * * *',
  $$SELECT cleanup_expired_verification_tokens()$$
);

-- Add index to optimize the deletion query
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at 
  ON verification_tokens(expires_at);