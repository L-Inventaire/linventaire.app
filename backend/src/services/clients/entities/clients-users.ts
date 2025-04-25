import { TableDefinition } from "../../../platform/db/api";

export const ClientsUsersDefinition: TableDefinition = {
  name: "clients_users",
  columns: {
    client_id: "VARCHAR(64)",
    user_id: "VARCHAR(64)",
    created_at: "BIGINT",
    updated_at: "BIGINT",
    updated_by: "VARCHAR(64)",
    roles: "JSONB",
    active: "BOOLEAN",
  },
  pk: ["user_id", "client_id"],
  indexes: [["client_id", "user_id"]],
  auditable: true,
};

export default class ClientsUsers {
  public client_id: string;
  public user_id: string; // Or an email (for invitations)
  public created_at: number;
  public updated_at: number;
  public updated_by: string;
  public roles: { list: Role[] };
  public active: boolean;
}

// Roles are mainly read / write / manage
// read: can read and export data
// write: can write data
// manage: can manage data, e.g. delete, massive edits, configurations, etc.

export const Roles = [
  "ANY", // Anyone in the company can access it
  "CLIENT_MANAGE",
  "CLIENT_READ",
  "CONTACTS_READ",
  "CONTACTS_WRITE",
  "CONTACTS_MANAGE",
  "ARTICLES_READ",
  "ARTICLES_WRITE",
  "ARTICLES_MANAGE",
  "INVOICES_READ",
  "INVOICES_WRITE",
  "INVOICES_MANAGE",
  "QUOTES_READ",
  "QUOTES_WRITE",
  "QUOTES_MANAGE",
  "SUPPLIER_INVOICES_READ",
  "SUPPLIER_INVOICES_WRITE",
  "SUPPLIER_INVOICES_MANAGE",
  "SUPPLIER_QUOTES_READ",
  "SUPPLIER_QUOTES_WRITE",
  "SUPPLIER_QUOTES_MANAGE",
  "STOCK_READ",
  "STOCK_WRITE",
  "STOCK_MANAGE",
  "ACCOUNTING_READ",
  "ACCOUNTING_WRITE",
  "ACCOUNTING_MANAGE",
  "ONSITE_SERVICES_READ",
  "ONSITE_SERVICES_WRITE",
  "ONSITE_SERVICES_MANAGE",
  "COMMENTS_READ",
  "COMMENTS_WRITE",
  "COMMENTS_MANAGE",
  "DATA_ANALYSIS_READ",
  "DATA_ANALYSIS_WRITE",
  "DATA_ANALYSIS_MANAGE",
  "SIGNING_SESSIONS_READ",
  "SIGNING_SESSIONS_WRITE",
  "SIGNING_SESSIONS_MANAGE",
  "TAGS_READ",
  "TAGS_WRITE",
  "TAGS_MANAGE",
  "FIELDS_READ",
  "FIELDS_WRITE",
  "FIELDS_MANAGE",
  "FILES_READ",
  "FILES_WRITE",
  "FILES_MANAGE",
  "USERS_READ",
  "USERS_WRITE",
  "USERS_MANAGE",
  "EVENTS_READ",
  "EVENTS_WRITE",
  "EVENTS_MANAGE",
  "CRM_READ",
  "CRM_WRITE",
  "CRM_MANAGE",
] as const;

export type Role = (typeof Roles)[number];
