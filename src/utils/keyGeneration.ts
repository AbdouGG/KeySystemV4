import { v4 as uuidv4 } from 'uuid';
import { addHours } from 'date-fns';
import { supabase } from '../config/supabase';
import { getHWID } from './hwid';

export const generateKey = async () => {
  const key = uuidv4();
  const now = new Date();
  const expiresAt = addHours(now, 24);
  const hwid = getHWID();

  // Check if there's an existing valid key for this HWID
  const { data: existingKeys, error: fetchError } = await supabase
    .from('keys')
    .select('*')
    .eq('hwid', hwid)
    .eq('is_valid', true)
    .gte('expires_at', now.toISOString());

  if (fetchError) throw fetchError;
  
  // If there's an existing valid key, prevent creating a new one
  if (existingKeys && existingKeys.length > 0) {
    throw new Error('You already have a valid key');
  }

  // Create new key
  const { data, error } = await supabase
    .from('keys')
    .insert([
      {
        key,
        hwid,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_valid: true
      }
    ])
    .select();

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Failed to generate key');
  
  return data[0];
};