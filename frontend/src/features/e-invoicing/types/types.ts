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
