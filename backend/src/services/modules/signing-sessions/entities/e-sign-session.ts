import { RestTableDefinition } from "../../../../platform/db/api";
import {
  classToSchema,
  schemaFromEntity,
} from "../../../../platform/schemas/utils";
import {
  RestEntity,
  RestEntityColumnsDefinition,
} from "../../../rest/entities/entity";

export type ESignSessionStatus =
  | "pending"
  | "viewed"
  | "signed"
  | "expired"
  | "cancelled";

export class ESignSessions extends RestEntity {
  signing_session_id = "string";
  document_id = "string";
  recipient_email = "string";
  recipient_name = "string";
  status: ESignSessionStatus = "pending";
  document_pdf = "string"; // S3 key
  signature_image = "string"; // Base64 signature image
  signed_document_pdf = "string"; // Final signed document (Base64 or S3 key)
  signature_date = 0;
  certificate_data: any = {}; // Metadata for certificate page
  token = "string"; // Unique token for accessing the session
  expires_at = 0;
  verification_code = "string"; // 6-digit code for email verification
  verification_code_expires_at = 0;
  is_verified = false;
}

export const ESignSessionsDefinition: RestTableDefinition = {
  name: "e_sign_sessions",
  columns: {
    ...new RestEntityColumnsDefinition(),
    signing_session_id: "VARCHAR(64)",
    document_id: "VARCHAR(64)",
    recipient_email: "VARCHAR(255)",
    recipient_name: "VARCHAR(255)",
    status: "VARCHAR(32)",
    document_pdf: "TEXT",
    signature_image: "TEXT",
    signed_document_pdf: "TEXT",
    signature_date: "BIGINT",
    certificate_data: "JSONB",
    token: "VARCHAR(64)",
    expires_at: "BIGINT",
    verification_code: "VARCHAR(8)",
    verification_code_expires_at: "BIGINT",
    is_verified: "BOOLEAN",
  },
  pk: ["id"],
  indexes: [
    ["signing_session_id"],
    ["document_id"],
    ["token"],
    ["recipient_email"],
  ],
  rest: {
    schema: classToSchema(new ESignSessions()),
  },
};

export const ESignSessionsSchema = schemaFromEntity<ESignSessions>(
  ESignSessionsDefinition.columns
);
