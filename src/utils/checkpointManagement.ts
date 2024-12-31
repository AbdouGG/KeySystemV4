import { supabase } from '../config/supabase';
import { getHWID } from './hwid';
import type { CheckpointStatus } from '../types';

export const resetCheckpoints = async (): Promise<void> => {
  const hwid = getHWID();

  try {
    await supabase.rpc('set_hwid', { hwid });

    const { error } = await supabase.from('user_checkpoints').upsert({
      hwid,
      checkpoint1: false,
      checkpoint2: false,
      checkpoint3: false,
      last_verification: new Date().toISOString(),
    });

    if (error) throw error;
    window.dispatchEvent(new Event('checkpointsUpdated'));
  } catch (error) {
    console.error('Error resetting checkpoints:', error);
  }
};

export const getCheckpoints = async (): Promise<CheckpointStatus> => {
  const hwid = getHWID();

  try {
    await supabase.rpc('set_hwid', { hwid });

    const { data, error } = await supabase
      .from('user_checkpoints')
      .select('*')
      .eq('hwid', hwid)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const { error: insertError } = await supabase
        .from('user_checkpoints')
        .insert([
          {
            hwid,
            checkpoint1: false,
            checkpoint2: false,
            checkpoint3: false,
            last_verification: new Date().toISOString(),
          },
        ]);

      if (insertError) throw insertError;

      return {
        checkpoint1: false,
        checkpoint2: false,
        checkpoint3: false,
      };
    }

    return {
      checkpoint1: data.checkpoint1,
      checkpoint2: data.checkpoint2,
      checkpoint3: data.checkpoint3,
    };
  } catch (error) {
    console.error('Error getting checkpoints:', error);
    return {
      checkpoint1: false,
      checkpoint2: false,
      checkpoint3: false,
    };
  }
};

export const verifyToken = async (
  token: string,
  checkpointNumber: number
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .eq('checkpoint_number', checkpointNumber)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return false;

    // Mark token as used
    await supabase
      .from('verification_tokens')
      .update({ used: true })
      .eq('token', token);

    return true;
  } catch (error) {
    console.error('Error verifying token:', error);
    return false;
  }
};

export const completeCheckpoint = async (
  checkpointNumber: number,
  token: string
): Promise<void> => {
  const hwid = getHWID();

  try {
    // Verify token first
    const isValidToken = await verifyToken(token, checkpointNumber);
    if (!isValidToken) {
      throw new Error('Invalid or expired verification token');
    }

    await supabase.rpc('set_hwid', { hwid });

    // Get current checkpoints state
    const currentCheckpoints = await getCheckpoints();

    // Verify prerequisites
    if (
      (checkpointNumber === 2 && !currentCheckpoints.checkpoint1) ||
      (checkpointNumber === 3 &&
        (!currentCheckpoints.checkpoint1 || !currentCheckpoints.checkpoint2))
    ) {
      throw new Error('Previous checkpoints must be completed first');
    }

    const checkpointKey =
      `checkpoint${checkpointNumber}` as keyof CheckpointStatus;

    const { error } = await supabase.from('user_checkpoints').upsert({
      hwid,
      [checkpointKey]: true,
      last_verification: new Date().toISOString(),
    });

    if (error) throw error;

    // Verify the update was successful
    const updatedCheckpoints = await getCheckpoints();
    if (!updatedCheckpoints[checkpointKey]) {
      throw new Error('Failed to update checkpoint status');
    }

    window.dispatchEvent(new Event('checkpointsUpdated'));
  } catch (error) {
    console.error('Error completing checkpoint:', error);
    throw error;
  }
};
