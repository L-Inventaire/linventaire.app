import _ from "lodash";
import { InvoiceFormat, Invoices, InvoiceSubscription } from "./types/types";
import { Clients } from "@features/clients/types/clients";
import { Contacts } from "@features/contacts/types/types";

export const getDocumentName = (type: Invoices["type"]) => {
  return (
    (
      {
        quotes: "Devis",
        invoices: "Facture",
        credit_notes: "Avoir",
        supplier_quotes: "Commande",
        supplier_invoices: "Facture fournisseur",
        supplier_credit_notes: "Avoir fournisseur",
      } as any
    )[type] || "Document"
  );
};

export const getDocumentNamePlurial = (type: Invoices["type"]) => {
  return (
    (
      {
        quotes: "Devis",
        invoices: "Factures",
        credit_notes: "Avoirs",
        supplier_quotes: "Commandes",
        supplier_invoices: "Factures fournisseur",
        supplier_credit_notes: "Avoirs fournisseur",
      } as any
    )[type] || "Document"
  );
};

/** MONOREPO needed -> Function also present in backend, if changed, change it in front too */
export const getInvoiceNextDate = (
  quote: Pick<
    Invoices,
    | "content"
    | "subscription_started_at"
    | "subscription_next_invoice_date"
    | "state"
    | "id"
    | "subscription"
    | "discount"
  >
) => {
  if (quote.state !== "recurring" || !quote?.subscription_started_at)
    return null;

  const recurringStartedAt = quote.subscription_started_at;
  const currentDate = new Date(
    quote.subscription_next_invoice_date || Date.now()
  );

  // Get lines per recurring period
  const lines = _.groupBy(quote.content, (a) => a.subscription);

  let minNextInvoiceDate = null;

  for (const frequency in lines) {
    if (!frequency) continue; // Not recurring line

    // Select the right next period start from today by simply iterating from recurrence start (not the best way but it's simple)
    let currentPeriodStart = new Date(0);
    const currentPeriodEnd = new Date(recurringStartedAt);
    while (currentPeriodStart.getTime() <= new Date(currentDate).getTime()) {
      currentPeriodStart = new Date(currentPeriodEnd);
      applyOffset(currentPeriodEnd, frequency);

      const nextInvoiceDate = getInvoiceDateInPeriod(
        currentPeriodStart,
        currentPeriodEnd,
        quote.subscription?.invoice_date || ("first_day" as any)
      );

      if (
        minNextInvoiceDate === null ||
        minNextInvoiceDate < nextInvoiceDate.getTime()
      ) {
        minNextInvoiceDate = nextInvoiceDate.getTime();
      }
    }
  }

  return minNextInvoiceDate;
};

export const getInvoiceDateInPeriod = (from: Date, to: Date, mode: string) => {
  if (mode === "first_day") {
    return new Date(from);
  } else if (mode === "first_workday") {
    const invoiceDate = new Date(from);
    while (
      getTimezoneDay(invoiceDate) === 0 ||
      getTimezoneDay(invoiceDate) === 6
    ) {
      invoiceDate.setDate(invoiceDate.getDate() + 1);
    }
    return invoiceDate;
  } else if (mode === "monday") {
    const invoiceDate = new Date(from);
    while (getTimezoneDay(invoiceDate) !== 1) {
      invoiceDate.setDate(invoiceDate.getDate() + 1);
    }
    return invoiceDate;
  } else if (mode === "last_day") {
    const invoiceDate = new Date(to);
    invoiceDate.setDate(invoiceDate.getDate() - 1);
    return invoiceDate;
  } else if (mode === "last_workday") {
    const invoiceDate = new Date(to);
    invoiceDate.setDate(invoiceDate.getDate() - 1);
    while (
      getTimezoneDay(invoiceDate) === 0 ||
      getTimezoneDay(invoiceDate) === 6
    ) {
      invoiceDate.setDate(invoiceDate.getDate() - 1);
    }
    return invoiceDate;
  }
  return from;
};

const getTimezoneDay = (date: Date) => {
  return new Date(date).getDay();
};

/** MONOREPO needed -> Function also present in backend, if changed, change it in front too */
export const applyOffset = (
  date: Date,
  frequencyAndCount: string,
  factor = 1
) => {
  const frequency = frequencyAndCount.split("_").pop();
  const periodCount = parseInt(
    frequencyAndCount.split("_")?.length === 2
      ? frequencyAndCount.split("_")[0]
      : "1"
  );
  if (frequencyAndCount.split("_").length > 2 || periodCount < 1) {
    throw new Error(`Invalid frequency ${frequencyAndCount}`);
  }
  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + 1 * factor * periodCount);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7 * factor * periodCount);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1 * factor * periodCount);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() + 1 * factor * periodCount);
      break;
    default:
      throw new Error(`Unknown frequency ${frequencyAndCount}`);
  }
};

export const getInvoiceWithOverrides = (
  invoice: Invoices,
  ...overrides: (Clients | Contacts)[]
) => {
  const subscription = mergeObjects(
    invoice.subscription || ({} as InvoiceSubscription),
    ...overrides.map((override) => override.recurring)
  );
  const payment_information = mergeObjects(
    invoice.payment_information,
    ...overrides.map((override) => override.payment)
  );
  const format = mergeObjects(
    invoice.format || ({} as InvoiceFormat),
    ...overrides.map((override) => override.invoices)
  );

  return {
    ...invoice,
    subscription,
    payment_information,
    format,
  };
};

// Complete object 1 null and undefined values with object 2 values
export const mergeObjects = <T extends {}>(...overrides: T[]): T => {
  if (overrides.length === 1) return overrides[0] as T;

  // Merge the last two ones right into left one
  const object1 = overrides[overrides.length - 2] || ({} as T);
  const object2 = overrides[overrides.length - 1] || ({} as T);
  const result = { ...object1 } as any;

  Object.keys(object2).forEach((key) => {
    if (result[key] === null || result[key] === undefined) {
      result[key] = (object2 as any)[key] || "";
    }
  });

  // If there is 3 or more, we'll have to merge this result with the others on the left
  if (overrides.length > 2)
    return mergeObjects(...overrides.slice(0, -2), result);
  return result as T;
};
