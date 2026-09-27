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

export const WEBHOOK_EVENTS = ["created", "updated", "deleted"] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export type Webhook = {
  id: string;
  client_id: string;
  user_id: string;
  name: string;
  url: string;
  entities: string[];
  events: WebhookEvent[];
  enabled: boolean;
  disabled_reason: string | null;
  consecutive_failures: number;
  last_delivery_at: number | null;
  last_delivery_status: "success" | "failed" | null;
  created_at: number;
  updated_at: number;
};

// The secret is only returned when the webhook is created or its secret rotated
export type WebhookWithSecret = Webhook & { secret: string };

export type WebhookAttempt = {
  at: number;
  status: number | null;
  duration_ms: number;
  error: string | null;
  response_body: string | null;
  manual?: boolean;
};

export type WebhookDelivery = {
  id: string;
  webhook_id: string;
  event: string;
  entity_table: string | null;
  entity_id: string | null;
  status: "pending" | "sending" | "success" | "failed";
  attempts: number;
  next_attempt_at: number | null;
  last_attempt_at: number | null;
  response_status: number | null;
  duration_ms: number | null;
  error: string | null;
  created_at: number;
  completed_at: number | null;
  // Only in the delivery details
  payload?: any;
  attempts_log?: { list: WebhookAttempt[] };
};

export type ApiCall = {
  id: string;
  api_key_id: string;
  user_id: string;
  req_id: string;
  method: string;
  url: string;
  status: number;
  duration_ms: number;
  ip: string;
  request_size: number;
  response_size: number;
  created_at: number;
  // Only in the call details
  user_agent?: string;
  request_body?: string | null;
  response_body?: string | null;
};

export type ApiCallsStats = {
  days: number;
  total: number;
  errors: number;
  error_rate: number;
  avg_duration_ms: number;
  per_day: {
    day: string;
    count: number;
    errors: number;
    avg_duration_ms: number;
  }[];
};

export type Paginated<T> = { total: number; list: T[] };
