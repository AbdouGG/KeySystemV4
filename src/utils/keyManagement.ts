import { supabase } from '../config/supabase';
import { getHWID } from './hwid';
import { resetCheckpoints } from './checkpointManagement';
import { checkKeyExpiration } from './keyExpiration';
import { cleanExpiredKeys } from './keyCleanup';
import type { Key } from '../types';

export const getExistingValidKey = async (): Promise<Key | null> => {
  try {
    const isInvalid = await checkKeyExpiration();
    if (isInvalid) {
      return null;
    }

    const hwid = getHWID();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('keys')
      .select('*')
      .eq('hwid', hwid)
      .eq('is_valid', true)
      .gte('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('Error fetching key:', error);
      }
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching existing key:', error);
    return null;
  }
};

export const claimKey = async (key: string, hwid: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('keys')
      .update({ hwid })
      .match({ key, hwid: null })
      .is('hwid', null);

    if (error) {
      console.error('Error claiming key:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in claimKey:', error);
    return false;
  }
};

export const startKeyValidityCheck = () => {
  const checkKeyValidity = async () => {
    await checkKeyExpiration();
    await cleanExpiredKeys();
  };

  // Initial check
  checkKeyValidity();

  // Check every minute
  const intervalId = setInterval(checkKeyValidity, 60000);
  return () => clearInterval(intervalId);
};