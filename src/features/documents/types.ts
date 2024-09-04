import { Contacts } from "@features/contacts/types/types";
import { Customer } from "@features/customers/types/customers";
import { Invoices } from "@features/invoices/types/types";

export type DocumentEntity = {
  owner_id: string;
  external_documents: { list: ExternalDocuments[] };
  entity_id: string;
  must_be_signed: boolean;
  signed: boolean;
  events: { list: DocumentEvents[] };
  recipients: { list: DocumentRecipients[] };
  entity: Invoices;

  type: "invoice" | "quote";
};

export type DocumentEventsType =
  | "create"
  | "sign"
  | "view"
  | "veto"
  | "approve";

export type DocumentEvents = {
  id: string;
  event: DocumentEventsType;
  // Either user_id or contact_id is set
  contact_id: string | null;
  contact: Contacts | null;
  user_id: string | null;
  user: Customer | null;
  created_at: string;
};

export type ExternalDocuments = {
  id: string;
  external_id: string;
  veto: boolean;
};

type DocumentRecipients = {
  id: string;
  recipient_contact_id: string;
  role: "signer" | "viewer" | "approver";
};
