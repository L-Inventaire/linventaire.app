import { TableDefinition } from "../../../platform/db/api";

export const ApiKeysDefinition: TableDefinition = {
  name: "api_keys",
  columns: {
    id: "VARCHAR(64)",
    client_id: "VARCHAR(64)",
    user_id: "VARCHAR(64)",
    name: "VARCHAR(256)",
    key_prefix: "VARCHAR(32)",
    key_hash: "VARCHAR(128)",
    created_at: "BIGINT",
    expires_at: "BIGINT",
    last_used_at: "BIGINT",
    revoked_at: "BIGINT",
    revoked_by: "VARCHAR(64)",
  },
  pk: ["id"],
  indexes: [["key_hash"], ["client_id", "user_id"]],
  // No "rest" configuration: this table is never exposed through the generic REST api
  auditable: false,
};

export default class ApiKeys {
  public id: string;
  public client_id: string;
  public user_id: string; // The key acts on behalf of this user, with the same permissions
  public name: string;
  public key_prefix: string; // First characters of the key, used to recognise it in the UI
  public key_hash: string; // sha256 of the full key, the key itself is never stored
  public created_at: number;
  public expires_at: number | null;
  public last_used_at: number | null;
  public revoked_at: number | null;
  public revoked_by: string | null;
}

export type PublicApiKey = Omit<ApiKeys, "key_hash">;
