import {
  Address,
  Clients,
  Invoices,
  Payment,
} from "@features/clients/types/clients";
import { InvoiceSubscription } from "@features/invoices/types/types";
import { formatAddress } from "@features/utils/format/address";
import { RestEntity } from "@features/utils/rest/types/types";
import _ from "lodash";

export type Contacts = RestEntity & {
  client_id: string;
  updated_by: string;
  id: string;

  is_supplier: boolean; // Is this contact a supplier
  is_client: boolean; // Is this contact a user

  has_parents: boolean; // Does this contact have parents
  parents: string[]; // List of parent contact ids
  parents_roles: {
    [key: string]: { role: string; notes: string };
  }; // List of parent roles

  type: "person" | "company";

  business_name: string;
  business_registered_name: string;
  business_registered_id: string;
  business_tax_id: string;

  person_first_name: string;
  person_last_name: string;

  language: string;
  currency: string;

  email: string;
  emails: string[];
  phone: string;
  phones: string[];
  address: Address;
  other_addresses: { delivery: Address | null; billing: Address | null };
  billing: Billing;

  // Overrides of the Client values
  payment: Payment;
  invoices: Invoices;
  recurring: InvoiceSubscription;
  preferences: Clients["preferences"];

  notes: string;
  documents: string[];
  tags: string[];
  assigned: string[];

  fields: any;
};

export type Billing = {
  iban: string;
  bic: string;
  name: string;
  payment_method:
    | "bank"
    | "cash"
    | "check"
    | "sepa"
    | "paypal"
    | "stripe"
    | "other";
};

export const getContactName = (contact: Partial<Contacts>) => {
  return _.uniqBy(
    [
      contact.person_first_name,
      contact.person_last_name,
      contact.business_name,
      contact.business_registered_name,
    ].map((a) => a?.trim()),
    (a) =>
      a
        ?.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
  )
    .filter(Boolean)
    .join(" ");
};

export const isContactLegalyDefined = (contact: Partial<Contacts>) => {
  return !!(
    formatAddress(contact?.address)?.length &&
    contact?.business_registered_id &&
    getContactName(contact)
  );
};
