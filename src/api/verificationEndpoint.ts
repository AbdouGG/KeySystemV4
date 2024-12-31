import { supabase } from '../config/supabase';
import { getHWID } from '../utils/hwid';

const RATE_LIMIT_WINDOW = 300000; // 5 minutes
const MAX_ATTEMPTS = 3;

export const createVerificationEndpoint = async (checkpointNumber: number) => {
  const hwid = getHWID();
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW);

  try {
    // Check rate limit
    const { count, error: countError } = await supabase
      .from('checkpoint_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('hwid', hwid)
      .eq('checkpoint_number', checkpointNumber)
      .gte('created_at', windowStart.toISOString());

    if (countError) throw countError;

    if (count && count >= MAX_ATTEMPTS) {
      throw new Error('Rate limit exceeded. Please wait before trying again.');
    }

    // Create verification record
    const { data, error } = await supabase
      .from('checkpoint_verifications')
      .insert([
        {
          checkpoint_number: checkpointNumber,
          hwid,
          verified: false,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating verification endpoint:', error);
    throw error;
  }
};

export const updateVerificationStatus = async (checkpointNumber: number) => {
  const hwid = getHWID();

  try {
    const { error } = await supabase
      .from('checkpoint_verifications')
      .update({
        verified: true,
        verification_time: new Date().toISOString(),
      })
      .eq('checkpoint_number', checkpointNumber)
      .eq('hwid', hwid)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating verification status:', error);
    return false;
  }
};
