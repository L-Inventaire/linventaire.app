import { RestTableDefinition } from "../../../../platform/db/api";
import {
  classToSchema,
  schemaFromEntity,
} from "../../../../platform/schemas/utils";
import {
  RestEntity,
  RestEntityColumnsDefinition,
} from "../../../rest/entities/entity";

export type SigningSessionsStatus =
  | "created"
  | "viewed"
  | "sent"
  | "signed"
  | "cancelled";

export class SigningSessions extends RestEntity {
  invoice_id = "string";
  external_id = "string";
  invoice_snapshot = "type:invoices";
  recipient_email = "string";
  recipient_role: "signer" | "viewer" = "signer";
  state = "string";
  upload_url = "string";
  signing_url = "string";
  reason = "string";
  recipient_token = "string";
  expired = false;
}

export const SigningSessionsDefinition: RestTableDefinition = {
  name: "signing_sessions",
  columns: {
    ...new RestEntityColumnsDefinition(),
    invoice_id: "VARCHAR(64)",
    external_id: "VARCHAR(64)",
    invoice_snapshot: "JSONB",
    recipient_email: "VARCHAR(64)",
    recipient_role: "VARCHAR(64)",
    state: "VARCHAR(64)",
    reason: "VARCHAR(64)",
    upload_url: "TEXT",
    document_url: "TEXT",
    signing_url: "TEXT",
    recipient_token: "VARCHAR(64)",
    expired: "BOOLEAN",
  },
  pk: ["invoice_id", "recipient_email", "id"],
  indexes: [["invoice_id", "recipient_email", "external_id"]],
  rest: {
    schema: classToSchema(new SigningSessions()),
  },
};

export const SigingSessionsSchema = schemaFromEntity<SigningSessions>(
  SigningSessionsDefinition.columns
);
