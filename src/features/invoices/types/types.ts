import { Address, Payment } from "@features/clients/types/clients";

export type Invoices = {
  client_id: string;
  id: string;

  assigned: string[];
  type: string; // invoice, quote, credit_note

  // Quotes: “created”, “sent”, “accepted”, "completed", “canceled”, “discontinued”
  // Invoices: “created”, “sent”, “paid”
  // Credit Notes: “created”, “sent”, “paid”
  state: string;
  // For invoices: invoices cancelled and refunded by this credit note
  related_credit_notes: string[]; // Nullable
  // For credit notes: invoice refunded by this credit note
  // For quotes: invoices generated from this quote
  related_invoice: string; // Nullable
  // For invoices: quotes completed and transformed into invoices
  related_quote: string; // Nullable

  reference: string;

  client: string;
  contact: string; // Nullable, the person in the client we discuss with
  emit_date: number;
  language: string;
  currency: string;

  delivery_address: Address | null;
  delivery_date: number;

  content?: InvoiceLine[];
  discount?: InvoiceDiscount;
  total?: InvoiceTotal; // Precomputed values (for search mainly, do not use for calculations preferably)

  // This is automatically generated from the content
  articles: {
    all: string[]; // List of all articles mentioned in the invoice
    accepted: string[]; // List of articles accepted by the client (in case of options)
  };

  name: string;
  payment_information: Payment;
  format?: InvoiceFormat;

  reminders?: InvoiceReminder;
  subscription?: InvoiceSubscription; // Available only for invoices

  attachments: string[];

  notes: string;
  documents: string[];
  tags: string[];

  fields: any;
};
export type InvoiceTotal = {
  initial: number;
  discount: number;
  total: number;
  taxes: number;
  total_with_taxes: number;
};

export type InvoiceReminder = {
  enabled: boolean;
  repetition: number; // Number of weeks of repetitions
  recipients: string[]; // List of emails
};

export type InvoiceSubscription = {
  enabled: boolean;
  frequency: string; // "daily" | "weekly" | "monthly" | "yearly"
  start: number;
  end: number;
};

export type InvoiceLine = {
  article: string; // Nullable

  type: string; // product, service, consumable, separation
  name: string;
  description: string;

  reference: string;
  unit: string;
  quantity: number;
  unit_price: number;
  tva: number;
  discount?: InvoiceDiscount;

  optional: boolean;
  optional_checked: boolean; // Checked by the client or by the agent (like a default checked option)
};

export type InvoiceDiscount = {
  mode: "percentage" | "amount" | null;
  value: number;
};

export type InvoiceFormat = {
  heading: string;
  footer: string;
  payment_terms: string;
  tva: string;

  branding: boolean;
  color: string;
  logo: string;
  footer_logo: string;
  template: string;
};
