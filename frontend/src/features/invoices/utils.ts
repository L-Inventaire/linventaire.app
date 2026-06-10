import { Clients } from "@features/clients/types/clients";
import { Contacts } from "@features/contacts/types/types";
import { applyOffset } from "@shared/invoices";
import _ from "lodash";
import {
  InvoiceFormat,
  InvoiceReview,
  Invoices,
  InvoiceSubscription,
} from "./types/types";

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

export const getInvoiceWithOverrides = (
  invoice: Invoices,
  ...overrides: (Clients | Contacts)[]
) => {
  const subscription = mergeObjects(
    invoice.subscription || ({} as InvoiceSubscription),
    ...overrides.map((override) => override.recurring),
  );
  const payment_information = mergeObjects(
    invoice.payment_information,
    ...overrides.map((override) => override.payment),
  );
  const format = mergeObjects(
    invoice.format || ({} as InvoiceFormat),
    ...overrides.map((override) => override.invoices),
  );

  return {
    ...invoice,
    subscription,
    payment_information,
    format,
  };
};

// Anchor date used to compute the recurring review dates of a quote
export const getReviewAnchor = (invoice: Pick<Invoices, "review" | "emit_date">) =>
  invoice.review?.anchor || invoice.emit_date || Date.now();

// Compute all the review occurrences (recurring frequencies + one-off dates) up to a horizon
export const getReviewOccurrences = (
  review: Partial<InvoiceReview> | undefined,
  anchor: number,
  horizon: number
): number[] => {
  if (!review) return [];
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const occurrences: number[] = [...(review.dates || [])].filter(Boolean);
  const start = anchor || Date.now();
  for (const frequency of review.frequencies || []) {
    if (!frequency) continue;
    try {
      const date = new Date(start);
      let guard = 0;
      while (date.getTime() <= horizon && guard < 2000) {
        if (date.getTime() >= start) occurrences.push(date.getTime());
        applyOffset(date, frequency, tz, 1);
        guard++;
      }
    } catch {
      // Invalid frequency, ignore it
    }
  }
  return _.uniq(occurrences).sort((a, b) => a - b);
};

// Next review date strictly after the given timestamp (null if none)
export const getNextReviewDate = (
  review: Partial<InvoiceReview> | undefined,
  anchor: number,
  fromTs: number
): number | null => {
  const horizon = fromTs + 1000 * 60 * 60 * 24 * 366 * 20; // ~20 years
  const occurrences = getReviewOccurrences(review, anchor, horizon);
  return occurrences.find((t) => t > fromTs) ?? null;
};

// Last review date strictly before the given timestamp (null if none)
export const getPrevReviewDate = (
  review: Partial<InvoiceReview> | undefined,
  anchor: number,
  beforeTs: number
): number | null => {
  const occurrences = getReviewOccurrences(review, anchor, beforeTs).filter(
    (t) => t < beforeTs
  );
  return occurrences.length ? occurrences[occurrences.length - 1] : null;
};

// Complete object 1 null and undefined values with object 2 values
export const mergeObjects = <
  T extends {
    [key: string]: any;
  },
>(
  ...overrides: T[]
): T => {
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
