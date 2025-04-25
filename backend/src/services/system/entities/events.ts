import { TableDefinition } from "../../../platform/db/api";
import { schemaFromEntity } from "../../../platform/schemas/utils";

export const EventsDefinition: TableDefinition = {
  name: "events",
  columns: {
    client_id: "VARCHAR(64)",
    created_at: "BIGINT",
    created_by: "VARCHAR(64)",
    req_id: "VARCHAR(64)",
    path: "JSONB",
    doc_table: "VARCHAR(64)",
    doc_action: "VARCHAR(64)",
    doc_pk: "JSONB",
    doc_before: "JSONB",
    doc_after: "JSONB",
  },
  pk: ["client_id", "created_at", "req_id", "doc_table"],
  indexes: [["client_id", "req_id"]],
  auditable: false,
};

export const EventsSchema = schemaFromEntity<Event>(EventsDefinition.columns);

export default class Event {
  client_id: string;
  created_at: number;
  created_by: string;
  req_id: string;
  path: { list: string[] };
  doc_table: string;
  doc_action: "create" | "update" | "delete";
  doc_pk: any;
  doc_before: any;
  doc_after: any;
}
