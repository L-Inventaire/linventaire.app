import { PublicCustomer } from "@features/customers/types/customers";
import { InvoiceSubscription } from "@features/invoices/types/types";

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
  "CLIENT_WRITE",
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
  company: Company;
  preferences: Preferences;
  configuration: Configuration;

  // Can be overrided by the contact
  payment: Payment;
  invoices: Invoices;
  recurring: InvoiceSubscription;

  invoices_counters: InvoiceCounters;
  service_items: ServiceItems;

  smtp: SmtpOptions;
};

export type ServiceItems = {
  default_article: string;
};

export type InvoiceCounters = {
  [key: string]: {
    quotes: Counter;
    invoices: Counter;
    credit_notes: Counter;
    supplier_invoices: Counter;
    supplier_credit_notes: Counter;
    supplier_quotes: Counter;
    drafts: Counter;
  };
};

type Counter = {
  format: string;
  counter: number;
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
  delay_date: number; // ms timestamp
  delay_type:
    | "direct"
    | "month_end_delay_first"
    | "month_end_delay_last"
    | "date";
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
  timezone?: string;
  email_footer?: string;
};

type Configuration = {
  plan: string;
};

export type SmtpOptions = {
  enabled: boolean;
  from: string;
  host: string;
  port: number;
  user: string;
  pass: string;
  tls: boolean;
  dkim?: {
    domainName: string;
    keySelector: string;
    privateKey: string;
  };
};
