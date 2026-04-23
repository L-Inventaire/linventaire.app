import { RestTableDefinition } from "../../../../platform/db/api";
import {
  classToSchema,
  columnsFromEntity,
  schemaFromEntity,
} from "../../../../platform/schemas/utils";
import {
  RestEntity,
  RestEntityColumnsDefinition,
} from "../../../rest/entities/entity";

export class EInvoicingConfig extends RestEntity {
  // Platform provider
  pdp_provider: "superpdp" | string = "superpdp"; // Only SuperPDP for now

  // Connection credentials (encrypted)
  integration_client_id = "string";
  integration_client_secret_encrypted = "string"; // AES encrypted with db.encryption_key

  // OAuth2 token management
  access_token_encrypted = "string"; // AES encrypted
  refresh_token_encrypted = "string"; // AES encrypted
  token_expires_at = 0;

  // SuperPDP company info (cached from /v1.beta/companies/me)
  superpdp_company_id = 0;
  superpdp_company = {} as SuperPDPCompany;

  // SuperPDP directory entries (cached from /v1.beta/directory_entries)
  superpdp_directory_entries: SuperPDPDirectoryEntry[] = [
    {} as SuperPDPDirectoryEntry,
  ];

  // Connection status
  connection_status: "not_configured" | "connected" | "error" =
    "not_configured";
  last_connection_test = 0;
  last_error = "string";

  // E-invoicing settings
  receive_enabled = false; // Auto-fetch received invoices
  send_enabled = false; // Auto-send invoices via e-invoicing
}

export class SuperPDPCompany {
  id = 0;
  formal_name = "string";
  trade_name = "string";
  number = "string"; // SIREN/SIRET
  number_scheme = "string";
  env: "sandbox" | "production" = "sandbox";
  address = "string";
  city = "string";
  postcode = "string";
  country = "string";
  created_at = 0;

  // Mandates for selfbilling
  mandates: SuperPDPMandate[] = [];
}

export class SuperPDPMandate {
  id = 0;
  managed_public_company_formal_name = "string";
  managed_public_company_number = "string";
  owner_id = 0;
  created_at = new Date();
}

export class SuperPDPDirectoryEntry {
  id = 0;
  directory: "peppol" | "ppf" = "peppol";
  identifier = "string";
  status: "pending" | "created" | "error" = "created";
  status_message = "string";
  is_replyto = false;
  created_at = 0;
}

export const EInvoicingConfigDefinition: RestTableDefinition = {
  name: "e_invoicing_config",
  columns: {
    ...columnsFromEntity(EInvoicingConfig),
    ...new RestEntityColumnsDefinition(),
  },
  pk: ["client_id", "id"],
  auditable: true,
  rest: {
    label: (config: EInvoicingConfig) =>
      `${config.pdp_provider} - ${config.connection_status}`,
    searchable: () => "",
    schema: classToSchema(new EInvoicingConfig()),
  },
};

export const EInvoicingConfigSchema = schemaFromEntity<EInvoicingConfig>(
  EInvoicingConfigDefinition.columns
);
