/*
  # Automatic Key Deletion System
  
  1. New Functions
    - `delete_expired_keys()`: Automatically deletes expired keys
    
  2. New Triggers
    - Trigger that runs every minute to check and delete expired keys
*/

-- Function to delete expired keys
CREATE OR REPLACE FUNCTION delete_expired_keys()
RETURNS void AS $$
BEGIN
  DELETE FROM keys 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the deletion to run every minute
SELECT cron.schedule(
  'delete-expired-keys',   -- name of the cron job
  '* * * * *',            -- every minute
  'SELECT delete_expired_keys()'
);