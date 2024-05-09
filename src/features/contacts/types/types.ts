import { Address } from "@features/clients/types/clients";

export type Contacts = {
  client_id: string;
  id: string;

  is_supplier: boolean; // Is this contact a supplier
  is_client: boolean; // Is this contact a user

  has_parents: boolean; // Does this contact have parents
  parents: string[]; // List of parent contact ids
  parents_roles: { role: string; note: string }[]; // List of parent roles

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
  phone: string;
  address: Address;
  delivery_address: Address | null;
  billing: Billing;

  notes: string;
  documents: string[];
  tags: string[];

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
  return contact.type === "person"
    ? [contact.person_first_name, contact.person_last_name]
        .filter(Boolean)
        .join(" ")
    : contact.business_name || contact.business_registered_name;
};
