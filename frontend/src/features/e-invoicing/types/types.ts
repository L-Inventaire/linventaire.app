import { EN16931Invoice } from "./en16931-types";
import { RestEntity } from "@/features/utils/rest/types/types";

export interface EInvoicingConfig {
  id: string;
  client_id_main: string;
  pdp_provider: "superpdp";
  integration_client_id: string;
  integration_client_secret_encrypted: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  token_expires_at: string;
  superpdp_company_id: number;
  superpdp_company: SuperPDPCompany;
  superpdp_directory_entries: SuperPDPDirectoryEntry[];
  connection_status: "not_configured" | "connected" | "error";
  last_connection_test: string;
  last_error: string;
  receive_enabled: boolean;
  send_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SuperPDPCompany {
  id: number;
  formal_name: string;
  trade_name: string;
  number: string;
  number_scheme: string;
  env: "sandbox" | "production";
  address: string;
  city: string;
  postcode: string;
  country: string;
  created_at: string;
  mandates: SuperPDPMandate[];
}

export interface SuperPDPMandate {
  id: number;
  managed_public_company_formal_name: string;
  managed_public_company_number: string;
  owner_id: number;
  created_at: string;
}

export interface SuperPDPDirectoryEntry {
  id: number;
  directory: "peppol" | "ppf";
  identifier: string;
  status: "pending" | "created" | "error";
  status_message: string;
  is_replyto: boolean;
  created_at: string;
}

export interface TestConnectionResponse {
  success: boolean;
  company?: SuperPDPCompany;
  error?: string;
}

export interface SaveConfigRequest {
  client_id: string;
  client_secret: string;
  pdp_provider?: "superpdp";
}

export interface UpdateSettingsRequest {
  receive_enabled?: boolean;
  send_enabled?: boolean;
}

export interface ReceivedEInvoices extends RestEntity {
  state: "new" | "rejected" | "attached";

  // SuperPDP invoice ID
  superpdp_invoice_id: number;

  // Invoice direction (should always be "in" for received)
  direction: "in" | "out";

  // Invoice metadata
  invoice_number: string;
  issue_date: number; // timestamp
  type_code: number; // Invoice type code (380 for invoice, 381 for credit note, etc.)
  currency_code: string;

  // Parties
  seller_name: string;
  seller_vat: string;
  seller_address: string;
  buyer_name: string;
  buyer_vat: string;

  // Amounts
  total_amount: number;
  total_tax_amount: number;
  total_amount_with_tax: number;

  // Status
  status: "received" | "validated" | "error";
  status_message: string;

  // Raw invoice data (EN16931 JSON format)
  en_invoice: EN16931Invoice;

  // Processing
  processed: boolean; // Whether we've attempted to create a supplier invoice
  supplier_invoice_id: string; // Link to created supplier invoice if any
  processing_error: string; // Error message if processing failed

  // Timestamps
  received_at: number;
  superpdp_created_at: number;
}
