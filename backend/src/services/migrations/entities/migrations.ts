import { TableDefinition } from "../../../platform/db/api";

export const MigrationsDefinition: TableDefinition = {
  name: "migrations",
  columns: {
    id: "VARCHAR(64)",
  },
  pk: ["id"],
  auditable: false,
};
