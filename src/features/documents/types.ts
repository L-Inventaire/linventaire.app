export type SigningSession = {
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
};
