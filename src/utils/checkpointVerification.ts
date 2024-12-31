import { supabase } from '../config/supabase';
import { getHWID } from './hwid';

interface VerificationAttempt {
  checkpoint_number: number;
  timestamp: number;
  success: boolean;
}

const VERIFICATION_TIMEOUT = 30000; // 30 seconds minimum between checkpoints
const attempts: VerificationAttempt[] = [];

export const verifyCheckpoint = async (
  checkpointNumber: number
): Promise<boolean> => {
  const hwid = getHWID();
  const now = Date.now();

  // Check for recent attempts
  const recentAttempt = attempts.find(
    (attempt) =>
      attempt.checkpoint_number === checkpointNumber &&
      now - attempt.timestamp < VERIFICATION_TIMEOUT
  );

  if (recentAttempt) {
    throw new Error('Please wait before attempting verification again');
  }

  // Record this attempt
  attempts.push({
    checkpoint_number: checkpointNumber,
    timestamp: now,
    success: false,
  });

  // Clean up old attempts
  while (attempts.length > 100) attempts.shift();

  try {
    // Verify with server
    const { data, error } = await supabase
      .from('checkpoint_verifications')
      .select('verified, created_at')
      .eq('checkpoint_number', checkpointNumber)
      .eq('hwid', hwid)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    // Verify the timestamp is recent (within last minute)
    const verificationTime = new Date(data.created_at).getTime();
    const isRecent = now - verificationTime < 60000;

    if (!data?.verified || !isRecent) {
      throw new Error('Invalid or expired verification');
    }

    // Mark attempt as successful
    const attemptIndex = attempts.findIndex(
      (a) => a.checkpoint_number === checkpointNumber && a.timestamp === now
    );
    if (attemptIndex !== -1) {
      attempts[attemptIndex].success = true;
    }

    return true;
  } catch (error) {
    console.error('Error verifying checkpoint:', error);
    return false;
  }
};
