import { Invoices } from "../invoices/types/types";

export type SigningSession = {
  id: string;
  recipient_token: string;
  invoice_id: string;
  external_id: string;
  invoice_snapshot: Invoices;
  recipient_email: string;
  recipient_role: "signer" | "viewer";
  state: string;
  document_url: string;
  signing_url: string;
  expired: boolean;
  linventaire_signature?: boolean;
};
