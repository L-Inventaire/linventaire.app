import { TableDefinition } from "../../../platform/db/api";

export const WEBHOOK_EVENTS = ["created", "updated", "deleted"] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export const WebhooksDefinition: TableDefinition = {
  name: "webhooks",
  columns: {
    id: "VARCHAR(64)",
    client_id: "VARCHAR(64)",
    user_id: "VARCHAR(64)",
    name: "VARCHAR(256)",
    url: "TEXT",
    secret: "VARCHAR(128)",
    entities: "VARCHAR(64)[]",
    events: "VARCHAR(64)[]",
    enabled: "BOOLEAN",
    disabled_reason: "TEXT",
    consecutive_failures: "INTEGER",
    last_delivery_at: "BIGINT",
    last_delivery_status: "VARCHAR(16)",
    created_at: "BIGINT",
    updated_at: "BIGINT",
  },
  pk: ["id"],
  indexes: [["client_id", "enabled"]],
  // No "rest" configuration: this table is never exposed through the generic REST api
  auditable: false,
};

export default class Webhooks {
  public id: string;
  public client_id: string;
  public user_id: string; // Events are only sent for documents this user can read
  public name: string;
  public url: string;
  public secret: string; // Used to sign the deliveries (HMAC SHA-256)
  public entities: string[]; // Tables to listen to
  public events: WebhookEvent[];
  public enabled: boolean;
  public disabled_reason: string | null; // Set when automatically disabled after too many failures
  public consecutive_failures: number;
  public last_delivery_at: number | null;
  public last_delivery_status: "success" | "failed" | null;
  public created_at: number;
  public updated_at: number;
}

export type PublicWebhook = Omit<Webhooks, "secret">;
