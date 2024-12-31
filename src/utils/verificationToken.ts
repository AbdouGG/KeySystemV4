import { supabase } from '../config/supabase';
import { getHWID } from './hwid';
import { v4 as uuidv4 } from 'uuid';

export const generateVerificationToken = async (
  checkpointNumber: number
): Promise<string> => {
  const hwid = getHWID();
  const timestamp = Date.now();
  // Add more entropy to the token
  const randomString = uuidv4();
  const token = Buffer.from(
    `${hwid}-${checkpointNumber}-${timestamp}-${randomString}`
  ).toString('base64');

  try {
    // Check for recent token generations to prevent spam
    const { count } = await supabase
      .from('verification_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('hwid', hwid)
      .eq('checkpoint_number', checkpointNumber)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if (count && count >= 3) {
      throw new Error('Too many verification attempts. Please wait 5 minutes.');
    }

    const { error } = await supabase.from('verification_tokens').insert([
      {
        token,
        hwid,
        checkpoint_number: checkpointNumber,
        expires_at: new Date(timestamp + 2 * 60 * 1000), // 2 minutes expiry
        used: false,
      },
    ]);

    if (error) throw error;
    return token;
  } catch (error) {
    console.error('Error generating verification token:', error);
    throw new Error('Failed to generate verification token');
  }
};
