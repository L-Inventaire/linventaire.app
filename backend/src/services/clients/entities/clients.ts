import { SmtpOptions } from "#src/platform/push-email/api";
import { columnsFromEntity } from "#src/platform/schemas/utils";
import { TableDefinition } from "../../../platform/db/api";

export default class Clients {
  id = "string";
  created_at = 0;
  address = new Address();
  company = new Company();

  invoices_counters: {
    [key: string]: {
      quotes: Counter;
      invoices: Counter;
      credit_notes: Counter;
      supplier_invoices: Counter;
      supplier_credit_notes: Counter;
      supplier_quotes: Counter;
      drafts: Counter;
    };
  } = new InvoiceCounters() as any;

  // All of this can be overriden by the contact
  payment = new Payment();
  invoices = new InvoiceFormat();
  recurring = new InvoiceSubscription();

  preferences = new Preferences();
  configuration = new Configuration();
  service_items = new ServiceItems();
  smtp: SmtpOptions = {} as any;
}

type Counter = {
  format: string;
  counter: number;
};

class ServiceItems {
  default_article = "string";
}

export class Address {
  address_line_1 = "string";
  address_line_2 = "string";
  region = "string";
  country = "string";
  zip = "string";
  city = "string";
}

export class InvoiceSubscription {
  invoice_date:
    | "first_day"
    | "first_workday"
    | "monday"
    | "last_workday"
    | "last_day" = "first_day";
  invoice_state: "draft" | "sent";
  start = new Date();
  start_type: "after_first_invoice" | "acceptance_start" | "date" =
    "after_first_invoice"; // "after_first_invoice" | "acceptance_start" | "date"
  end_type: "none" | "delay" | "date" = "none"; // "none" | "delay" | "date"
  end = new Date();
  end_delay = "1y"; // "1y" | "2y" | "3y"
  renew_as: "draft" | "sent" | "closed" = "draft"; // "draft" | "sent" | "closed"
}

export class Payment {
  mode: ("bank_transfer" | "credit_card" | "paypal" | "cash" | "check")[] = [
    "bank_transfer",
  ]; // "bank_transfer", "credit_card", "paypal", "cash", "check"
  delay = 0; // In days
  delay_date = 0; // ms timestamp
  delay_type:
    | "normal"
    | "month_end_delay_first"
    | "month_end_delay_last"
    | "date" = "normal";
  bank_name = "string";
  bank_iban = "string";
  bank_bic = "string";
  late_penalty = "string";
  recovery_fee = "string";
  computed_date: number = new Date() as any;
}

class Company {
  //Display information
  name = "string";
  //Legal information
  legal_name = "string";
  registration_number = "string";
  tax_number = "string";
}

export class Preferences {
  logo?: string = "string";
  language?: string = "string";
  currency?: string = "string";
  timezone?: string = "string";
  email_footer?: string = "string";
}

class Configuration {
  plan = "string";
}

export class InvoiceCounters {
  ["2024"] = {
    quotes: {
      format: "string",
      counter: 1,
    },
    invoices: {
      format: "string",
      counter: 1,
    },
    credit_notes: {
      format: "string",
      counter: 1,
    },
    supplier_invoices: {
      format: "string",
      counter: 1,
    },
    supplier_credit_notes: {
      format: "string",
      counter: 1,
    },
    supplier_quotes: {
      format: "string",
      counter: 1,
    },
    drafts: {
      format: "string",
      counter: 1,
    },
  };
}

export class InvoiceFormat {
  heading = "string";
  footer = "string";
  payment_terms = "string";
  tva = "string";

  branding = true;
  color = "string";
  logo = "type:files";
  footer_logo = "type:files";
  template = "string";

  attachments = ["type:files"];
}

export const getConfiguration = (
  configuration: Configuration
): Configuration => {
  return { ...configuration };
};

export const getPublicConfiguration = (configuration: Configuration): any => {
  configuration = getConfiguration(configuration);
  return {
    ...configuration,
  };
};

export const ClientsDefinition: TableDefinition = {
  name: "clients",
  columns: {
    ...columnsFromEntity(Clients),
    id: "VARCHAR(64)",
    name: "VARCHAR(64)",
    created_at: "BIGINT",
    updated_at: "BIGINT",
    configuration: "JSONB",
    preferences: "JSONB",
    payment: "JSONB",
    invoices: "JSONB",
    invoices_counters: "JSONB",
    address: "JSONB",
    company: "JSONB",
    service_items: "JSONB",
    smtp: "JSONB",
  },
  pk: ["id"],
  auditable: true,
};
