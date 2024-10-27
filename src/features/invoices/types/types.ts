import { Address, Payment } from "@features/clients/types/clients";
import { RestEntity } from "@features/utils/rest/types/types";

export type Invoices = RestEntity & {
  client_id: string;
  id: string;

  assigned: string[];
  type:
    | "quotes"
    | "invoices"
    | "credit_notes"
    | "supplier_quotes"
    | "supplier_invoices"
    | "supplier_credit_notes"; // invoice, quote, credit_note

  // Quotes: “draft”, “sent”, "purchase_order", "completed", "recurring", "closed”
  // Invoices and Credit Notes: “draft”, “sent”, "closed"
  state:
    | "draft"
    | "sent"
    | "purchase_order"
    | "completed"
    | "recurring"
    | "closed";

  // For credit notes or supplier credit note: invoices refunded by this credit note
  from_rel_invoice: string[]; // Nullable
  // For invoices or supplier invoice: quotes completed and transformed into this invoice
  from_rel_quote: string[]; // Nullable

  name: string;
  reference: string;

  supplier: string; // For supplier invoices/quotes/credit_notes
  client: string; // For client invoices/quotes/credit_notes

  contact: string; // Nullable, the person in the client we discuss with
  emit_date: number;
  language: string;
  currency: string;

  delivery_address: Address | null;
  delivery_date: number;
  delivery_delay: number;

  wait_for_completion_since: number | null;

  content?: InvoiceLine[];
  discount?: InvoiceDiscount;

  total?: InvoiceTotal; // Precomputed values (for search mainly, do not use for calculations preferably)

  // This is automatically generated from the content
  articles: {
    all: string[]; // List of all articles mentioned in the invoice
    accepted: string[]; // List of articles accepted by the client (in case of options)
  };

  // For partially paid invoices or credit notes, list of payments
  payments_total: number; // This one is automatically generated from the payments_executed
  payments_ids: string[]; // List of payments executed

  // For partially invoiced quotes, list of invoices (or credit notes)
  invoices_total: number; // Total already invoiced for this quote automatically generated from the invoices
  invoices_ids: string[]; // List of invoices automatically generated from trigger

  payment_information: Payment;
  format?: InvoiceFormat;

  recipients?: string[];
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
};

export type InvoiceSubscription = {
  enabled: boolean;
  frequency: string; // "daily" | "weekly" | "monthly" | "yearly"
  start: number;
  end: number;
  as_draft: boolean;
};

export type InvoiceLine = {
  _id?: string;

  article?: string; // Nullable

  type: "product" | "service" | "consumable" | "separation" | "correction"; // product, service, consumable, separation
  name?: string;
  description?: string;

  reference?: string;
  unit?: string;
  quantity?: number;
  unit_price?: number;
  tva?: string;
  discount?: InvoiceDiscount;
  subscription?: string; // Nullable

  quantity_ready?: number; //Quantity received or sent to determine if the line is ready to be invoices
  quantity_delivered?: number; //Quantity delivered or received to determine if the line is ready to be invoices

  optional?: boolean;
  optional_checked?: boolean; // Checked by the client or by the agent (like a default checked option)
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

export type PartialInvoiceOutType = {
  invoiced: Pick<Invoices, "content" | "discount" | "total">;
  partial_invoice: Pick<Invoices, "content" | "discount" | "type" | "total">;
  remaining: Pick<Invoices, "content" | "discount" | "total">;
};
