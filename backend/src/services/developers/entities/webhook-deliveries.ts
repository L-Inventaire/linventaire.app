import { TableDefinition } from "../../../platform/db/api";

export const WebhookDeliveriesDefinition: TableDefinition = {
  name: "webhook_deliveries",
  columns: {
    id: "VARCHAR(64)",
    client_id: "VARCHAR(64)",
    webhook_id: "VARCHAR(64)",
    event: "VARCHAR(128)",
    entity_table: "VARCHAR(64)",
    entity_id: "VARCHAR(64)",
    payload: "JSONB",
    status: "VARCHAR(16)",
    attempts: "INTEGER",
    attempts_log: "JSONB",
    next_attempt_at: "BIGINT",
    locked_until: "BIGINT",
    last_attempt_at: "BIGINT",
    response_status: "INTEGER",
    duration_ms: "INTEGER",
    error: "TEXT",
    created_at: "BIGINT",
    completed_at: "BIGINT",
  },
  pk: ["id"],
  indexes: [
    ["status", "next_attempt_at"],
    ["client_id", "webhook_id", "created_at"],
  ],
  // No "rest" configuration: this table is never exposed through the generic REST api
  auditable: false,
};

export type WebhookAttempt = {
  at: number;
  status: number | null; // HTTP status, null when the request failed
  duration_ms: number;
  error: string | null;
  response_body: string | null; // Truncated
  manual?: boolean; // Retried from the interface
};

export default class WebhookDeliveries {
  public id: string;
  public client_id: string;
  public webhook_id: string;
  public event: string; // "{table}.{created|updated|deleted}" or "ping"
  public entity_table: string | null;
  public entity_id: string | null;
  public payload: any; // Body sent to the webhook url
  public status: "pending" | "sending" | "success" | "failed";
  public attempts: number;
  public attempts_log: { list: WebhookAttempt[] };
  public next_attempt_at: number | null;
  public locked_until: number | null;
  public last_attempt_at: number | null;
  public response_status: number | null; // Of the last attempt
  public duration_ms: number | null; // Of the last attempt
  public error: string | null; // Of the last attempt
  public created_at: number;
  public completed_at: number | null;
}
