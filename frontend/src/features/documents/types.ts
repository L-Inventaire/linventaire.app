export type SigningSession = {
  id: string;
  recipient_token: string;
  invoice_id: string;
  external_id: string;
  invoice_snapshot: string;
  recipient_email: string;
  recipient_role: "signer" | "viewer";
  state: string;
  document_url: string;
  signing_url: string;
  expired: boolean;
  linventaire_signature?: boolean;
};
