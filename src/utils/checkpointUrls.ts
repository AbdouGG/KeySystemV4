import { LINKVERTISE_URLS } from './constants';
import { getHWID } from './hwid';

export const getCheckpointUrl = async (checkpoint: number): Promise<string> => {
  const baseUrl = LINKVERTISE_URLS[checkpoint as keyof typeof LINKVERTISE_URLS];
  return baseUrl;
};
