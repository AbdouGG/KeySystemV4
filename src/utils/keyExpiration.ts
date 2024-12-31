import { supabase } from '../config/supabase';
import { resetCheckpoints } from './checkpointManagement';
import { getHWID } from './hwid';

export const checkKeyExpiration = async (): Promise<boolean> => {
  const hwid = getHWID();

  try {
    // Only check for invalid keys (is_valid = false)
    const { data: keys, error } = await supabase
      .from('keys')
      .select('*')
      .eq('hwid', hwid)
      .eq('is_valid', false);

    if (error) throw error;

    // Reset checkpoints only if we found an invalid key
    if (keys && keys.length > 0) {
      resetCheckpoints();
      localStorage.removeItem('had_valid_key');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking key validity:', error);
    return false;
  }
};
