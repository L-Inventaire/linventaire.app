import { TableDefinition } from "../../../platform/db/api";
import { schemaFromEntity } from "../../../platform/schemas/utils";

/**
 * This will contain delayed tasks while keeping the original events path and req_id for auditing purposes.
 */

export const TasksDefinition: TableDefinition = {
  name: "tasks",
  columns: {
    type: "VARCHAR(64)",
    executed: "BOOLEAN",
    planned_at: "BIGINT",
    id: "VARCHAR(64)",

    client_id: "VARCHAR(64)",
    created_at: "BIGINT",
    created_by: "VARCHAR(64)",
    req_id: "VARCHAR(64)",
    path: "JSONB",
    data: "JSONB",
  },
  pk: ["type", "executed", "planned_at", "id"],
  auditable: false,
};

export const TasksSchema = schemaFromEntity<Tasks>(TasksDefinition.columns);

export default class Tasks {
  type: string;
  executed: boolean;
  planned_at: Date;
  id: string;

  client_id: string;
  created_at: Date;
  created_by: string;
  req_id: string;
  path: { list: string[] };
  data: any;
}
