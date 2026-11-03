import { TableDefinition } from "../../../../platform/db/api";

/**
 * Copies of the invoices and credit notes sent by email to the accountant (see
 * ClientAccounting.email_export and services/accounting-email-export).
 *
 * One row per document, so a document is never sent twice. Kept apart from the
 * invoices so that the documents saved by the interface (full drafts) or
 * duplicated never overwrite nor copy it.
 */
export const AccountingEmailExportsDefinition: TableDefinition = {
  name: "accounting_email_exports",
  columns: {
    client_id: "VARCHAR(64)",
    invoice_id: "VARCHAR(64)",
    side: "VARCHAR(16)",
    status: "VARCHAR(16)",
    email: "TEXT",
    source: "VARCHAR(16)",
    received_e_invoice_id: "VARCHAR(64)",
    attempts: "INTEGER",
    next_attempt_at: "BIGINT",
    locked_until: "BIGINT",
    sent_at: "BIGINT",
    error: "TEXT",
    created_at: "BIGINT",
  },
  pk: ["client_id", "invoice_id"],
  indexes: [
    ["status", "next_attempt_at"],
    ["client_id", "received_e_invoice_id"],
  ],
  // No "rest" configuration: this table is never exposed through the generic REST api
  auditable: false,
};

export default class AccountingEmailExports {
  public client_id: string;
  public invoice_id: string;
  public side: "sales" | "purchases";
  //   "pending"  -> queued (or waiting for a retry, see next_attempt_at)
  //   "sending"  -> being sent (until locked_until)
  //   "sent"     -> sent to `email`
  //   "failed"   -> could not be sent after several attempts, see `error`
  //   "skipped"  -> not sent, see `error` for the reason
  public status: "pending" | "sending" | "sent" | "failed" | "skipped";
  public email: string | null; // Recipient of the last attempt
  // Sent file: our PDF ("document") or the file of the received e-invoice
  public source: "document" | "e_invoice" | null;
  public received_e_invoice_id: string | null; // E-invoice attached to the document
  public attempts: number;
  public next_attempt_at: number;
  public locked_until: number | null;
  public sent_at: number | null;
  public error: string | null;
  public created_at: number;
}
