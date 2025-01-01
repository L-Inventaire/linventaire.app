import { PublicCustomer } from "@features/customers/types/customers";

export type ClientsUsers = {
  client_id: string;
  user_id: string;
  created_at: number;
  updated_at: number;
  updated_by: string;
  roles: { list: Role[] };
  client: Clients;
  active: boolean;
};

export type ClientsUserWithUser = ClientsUsers & {
  user: PublicCustomer | { email: string };
};

// Roles are mainly read / write / manage
// read: can read and export data
// write: can write data
// manage: can manage data, e.g. delete, massive edits, configurations, etc.

export const Roles = [
  "ANY", // Anyone in the company can access it
  "CLIENT_MANAGE",
  "CLIENT_READ",
  "CONTACTS_READ",
  "CONTACTS_WRITE",
  "CONTACTS_MANAGE",
  "ARTICLES_READ",
  "ARTICLES_WRITE",
  "ARTICLES_MANAGE",
  "INVOICES_READ",
  "INVOICES_WRITE",
  "INVOICES_MANAGE",
  "QUOTES_READ",
  "QUOTES_WRITE",
  "QUOTES_MANAGE",
  "SUPPLIER_INVOICES_READ",
  "SUPPLIER_INVOICES_WRITE",
  "SUPPLIER_INVOICES_MANAGE",
  "SUPPLIER_QUOTES_READ",
  "SUPPLIER_QUOTES_WRITE",
  "SUPPLIER_QUOTES_MANAGE",
  "ACCOUNTING_READ",
  "ACCOUNTING_WRITE",
  "ACCOUNTING_MANAGE",
  "SIGNING_SESSIONS_READ",
  "SIGNING_SESSIONS_WRITE",
  "SIGNING_SESSIONS_MANAGE",
  "ONSITE_SERVICES_READ",
  "ONSITE_SERVICES_WRITE",
  "ONSITE_SERVICES_MANAGE",
  "STOCK_READ",
  "STOCK_WRITE",
  "STOCK_MANAGE",
  "COMMENTS_READ",
  "COMMENTS_WRITE",
  "COMMENTS_MANAGE",
  "TAGS_READ",
  "TAGS_WRITE",
  "TAGS_MANAGE",
  "FIELDS_READ",
  "FIELDS_WRITE",
  "FIELDS_MANAGE",
  "FILES_READ",
  "FILES_WRITE",
  "FILES_MANAGE",
  "USERS_READ",
  "USERS_WRITE",
  "USERS_MANAGE",
  "EVENTS_READ",
  "EVENTS_WRITE",
  "EVENTS_MANAGE",
  "CRM_READ",
  "CRM_WRITE",
  "CRM_MANAGE",
] as const;

export type Role = (typeof Roles)[number];

export type Clients = {
  id: string;
  created_at: number;
  address: Address;
  other_addresses: {
    delivery: Address | null;
    invoicing: Address | null;
  };
  company: Company;
  preferences: Preferences;
  configuration: Configuration;
  payment: Payment;
  invoices: Invoices;
  invoices_counters: InvoiceCounters;
  service_items: ServiceItems;
};

export type ServiceItems = {
  default_article: string;
};

export type InvoiceCounters = {
  quotes: {
    format: string;
    counter: number;
  };
  invoices: {
    format: string;
    counter: number;
  };
  credit_notes: {
    format: string;
    counter: number;
  };
  supplier_invoices: {
    format: string;
    counter: number;
  };
  supplier_credit_notes: {
    format: string;
    counter: number;
  };
  supplier_quotes: {
    format: string;
    counter: number;
  };
};

export type Invoices = {
  heading: string;
  footer: string;
  payment_terms: string;
  tva: string;

  branding: boolean;
  color: string;
  logo: string;
  footer_logo: string;
  template: string;

  attachments: string[];
};

export type Payment = {
  computed_date: number;
  mode: string[]; // "bank_transfer", "credit_card", "paypal", "cash", "check"
  delay: number; // In days
  delay_type: "direct" | "month_end_delay_first" | "month_end_delay_last";
  bank_name: string;
  bank_iban: string;
  bank_bic: string;
  late_penalty: string;
  recovery_fee: string;
};

export type Address = {
  address_line_1: string;
  address_line_2: string;
  region: string;
  country: string;
  zip: string;
  city: string;
};

type Company = {
  //Display information
  name: string;
  //Legal information
  legal_name: string;
  registration_number: string;
  tax_number: string;
};

type Preferences = {
  logo?: string;
  language?: string;
  currency?: string;
};

type Configuration = {
  plan: string;
};
