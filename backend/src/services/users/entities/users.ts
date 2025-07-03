import { TableDefinition } from "../../../platform/db/api";

export const UsersDefinition: TableDefinition = {
  name: "users",
  columns: {
    id: "VARCHAR(64)",
    id_email: "VARCHAR(64)",
    id_phone: "VARCHAR(64)",
    created_at: "BIGINT",
    mfas: "JSONB",
    role: "VARCHAR(64)",
    full_name: "VARCHAR(64)",
    preferences: "JSONB",
    display_name: "VARCHAR(64)",
    operation: "VARCHAR(64)",
  },
  pk: ["id"],
  indexes: [["id_email"], ["id_phone"]],
  auditable: true,
  rest: {
    label: "full_name",
  },
};

export default class Users {
  public id: string;
  public id_email: string;
  public id_phone: string;
  public role: "USER" | "DISABLED" | "SYSADMIN" | "SYSAGENT";
  public created_at: number;
  public mfas: { list: MFA[] };

  public full_name: string;
  public preferences: Preferences;
}

type MFA = {
  id: string;
  type: "email" | "phone" | "app" | "password";
  value: string;
};

type Preferences = {
  avatar?: string;
  language?: string;
};
