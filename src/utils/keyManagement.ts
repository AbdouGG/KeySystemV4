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
    // First check if key exists and is unclaimed
    const { data: keyData, error: checkError } = await supabase
      .from('keys')
      .select('*')
      .eq('key', key)
      .maybeSingle();

    if (checkError || !keyData) {
      console.error('Error checking key:', checkError);
      return false;
    }

    // If key is already claimed
    if (keyData.hwid) {
      if (keyData.hwid === hwid) {
        return true; // Already claimed by this user
      }
      return false; // Claimed by someone else
    }

    // Claim the key
    const { error: updateError } = await supabase
      .from('keys')
      .update({ hwid })
      .eq('key', key)
      .is('hwid', null);

    if (updateError) {
      console.error('Error claiming key:', updateError);
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