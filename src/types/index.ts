export interface Key {
  id: string;
  key: string;
  hwid: string;
  created_at: string;
  expires_at: string;
  is_valid: boolean;
}

export interface CheckpointStatus {
  checkpoint1: boolean;
  checkpoint2: boolean;
  checkpoint3: boolean;
}