import { TableDefinition } from "../../../platform/db/api";

// One row per request authenticated with an api key
export const ApiCallsDefinition: TableDefinition = {
  name: "api_calls",
  columns: {
    id: "VARCHAR(64)",
    client_id: "VARCHAR(64)",
    api_key_id: "VARCHAR(64)",
    user_id: "VARCHAR(64)",
    req_id: "VARCHAR(64)",
    method: "VARCHAR(16)",
    url: "TEXT",
    status: "INTEGER",
    duration_ms: "INTEGER",
    ip: "VARCHAR(64)",
    user_agent: "TEXT",
    request_body: "TEXT",
    request_size: "INTEGER",
    response_body: "TEXT",
    response_size: "INTEGER",
    created_at: "BIGINT",
  },
  pk: ["id"],
  indexes: [
    ["client_id", "created_at"],
    ["client_id", "api_key_id", "created_at"],
  ],
  // No "rest" configuration: this table is never exposed through the generic REST api
  auditable: false,
};

export default class ApiCalls {
  public id: string;
  public client_id: string;
  public api_key_id: string;
  public user_id: string; // Owner of the api key
  public req_id: string; // Also returned in error responses
  public method: string;
  public url: string;
  public status: number;
  public duration_ms: number;
  public ip: string;
  public user_agent: string;
  public request_body: string | null; // Truncated JSON
  public request_size: number;
  public response_body: string | null; // Truncated JSON
  public response_size: number;
  public created_at: number;
}
