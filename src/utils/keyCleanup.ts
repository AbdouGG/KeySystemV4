import { supabase } from '../config/supabase';

export const cleanExpiredKeys = async (): Promise<void> => {
  try {
    await supabase.rpc('clean_expired_keys');
  } catch (error) {
    console.error('Error cleaning expired keys:', error);
  }
};
