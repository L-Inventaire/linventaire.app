export type ApiKey = {
  id: string;
  client_id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  created_at: number;
  expires_at: number | null;
  last_used_at: number | null;
  revoked_at: number | null;
  revoked_by: string | null;
};

// The full key is only returned once, when it is created
export type CreatedApiKey = ApiKey & { key: string };
