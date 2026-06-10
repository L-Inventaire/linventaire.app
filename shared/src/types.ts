export class InvoicesBase {
  type:
    | "invoices"
    | "quotes"
    | "credit_notes"
    | "supplier_invoices"
    | "supplier_quotes"
    | "supplier_credit_notes" = "invoices"; // invoices, quotes, credit_notes
  emit_date: number | Date = new Date();
  content?: InvoiceLine[] = [new InvoiceLine()];
  discount?: InvoiceDiscount = new InvoiceDiscount();
  total?: InvoiceTotal = new InvoiceTotal(); // Precomputed values (for search mainly, do not use for calculations preferably)
  delivery_date: Date | number = new Date();
  wait_for_completion_since: Date | number | null = new Date(); // For completed quotes or invoices
  delivery_delay: number = 30; // In days
  payment_information?: {
    delay_type?: string;
    delay?: string | number;
    delay_date?: string | number;
  };
}

export class FromSubscription {
  // When invoice was generated from a subscription, details goes there
  frequency: "daily" | "weekly" | "monthly" | "yearly" | string = "monthly";
  from = new Date(); // Invoiced period start
  to = new Date(); // Invoiced period end
}

export class PaymentComputed {
  percentage = 0; // Between 0 and 100
  total = 0; // This one is automatically generated from the transactions
  ids = ["type:accounting_transactions"]; // List of payments executed automatically generated from trigger
}

export class Recipient {
  email = "string";
  role: "signer" | "viewer" = "signer";
}

export class InvoicedComputed {
  percentage = 0; // Between 0 and 100
  percentage_with_draft = 0; // Between 0 and 100
  ids = ["type:invoices"]; // List of invoices automatically generated from trigger
}

export class InvoiceTotal {
  initial = 0;
  discount = 0;
  total = 0;
  taxes = 0;
  total_with_taxes = 0;
  vat_breakdown?: {
    tva: string;
    taxable_amount: number;
    tax_amount: number;
  }[] = [{ tva: "string", taxable_amount: 0, tax_amount: 0 }];
  allowances_breakdown?: {
    base_amount: number;
    amount: number;
    tva: string;
  }[] = [
    {
      base_amount: 0,
      amount: 0,
      tva: "string",
    },
  ];
}

export class InvoiceReminder {
  enabled = false;
  repetition = 0; // Number of weeks of repetitions
}

export class InvoiceReview {
  // "To review" reminder configuration for quotes (e.g. renew a subscription with the supplier)
  enabled = false;
  frequencies: string[] = []; // Recurring review frequencies, e.g. "monthly", "yearly", "3_monthly"
  dates: number[] = []; // Optional specific one-off review dates (ms timestamps)
  anchor = 0; // ms, base date from which the recurring review dates are computed
}

export class InvoiceLine {
  article = "type:articles"; // Nullable

  type: "product" | "service" | "consumable" | "separation" | "correction" =
    "product"; // product, service, consumable, separation
  name = "string";
  reference = "string";
  description = "string";

  unit: string = "string";
  quantity = 0;
  unit_price = 0;
  tva = "string";
  discount?: InvoiceDiscount = new InvoiceDiscount();

  subscription: "" | "daily" | "monthly" | "yearly" | "weekly" | string = ""; // Can be 3_yearly, 6_monthly etc

  // Only for quotes and supplier quotes
  quantity_ready = 0; //Quantity received or sent to determine if the line is ready to be "completed"
  quantity_delivered = 0; //Quantity received or sent to determine if the line is ready to be duplicated as "invoices"
  // Automatically maintained up to date from the stock_items.rel_quote, cannot be changed from invoice

  optional = false;
  optional_checked = false; // Checked by the client or by the agent (like a default checked option)
}

export class InvoiceDiscount {
  mode: "percentage" | "amount" | null = "amount"; // "percentage" | "amount"
  value = 0;
}
