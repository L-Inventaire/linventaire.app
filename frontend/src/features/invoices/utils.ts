import { Clients } from "@features/clients/types/clients";
import { Contacts } from "@features/contacts/types/types";
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

// Resolve a reminder's day-of-month spec to an actual timestamp (noon, to avoid TZ edges)
const resolveReviewDay = (year: number, month0: number, day: string): number => {
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  let d: number;
  if (day === "first") d = 1;
  else if (day === "last") d = daysInMonth;
  else if (day === "middle") d = 15;
  else d = Math.min(Math.max(parseInt(day) || 1, 1), daysInMonth);
  return new Date(year, month0, d, 12, 0, 0, 0).getTime();
};

// Compute all the review occurrences (from every reminder rule) within [startTs, endTs]
export const getReviewOccurrences = (
  review: Partial<InvoiceReview> | undefined,
  startTs: number,
  endTs: number
): number[] => {
  if (!review?.reminders?.length) return [];
  const occurrences: number[] = [];
  const startYear = new Date(startTs).getFullYear();
  const endYear = new Date(endTs).getFullYear();
  for (const reminder of review.reminders) {
    if (!reminder?.day || !reminder?.month) continue;
    for (let year = startYear; year <= endYear; year++) {
      if (reminder.month === "every") {
        for (let m = 0; m < 12; m++) {
          occurrences.push(resolveReviewDay(year, m, reminder.day));
        }
      } else {
        const month0 = (parseInt(reminder.month) || 1) - 1;
        occurrences.push(resolveReviewDay(year, month0, reminder.day));
      }
    }
  }
  return _.uniq(occurrences)
    .filter((t) => t >= startTs && t <= endTs)
    .sort((a, b) => a - b);
};

const ONE_YEAR = 1000 * 60 * 60 * 24 * 366;

// Next review date strictly after the given timestamp (null if none)
export const getNextReviewDate = (
  review: Partial<InvoiceReview> | undefined,
  fromTs: number
): number | null => {
  const occurrences = getReviewOccurrences(review, fromTs, fromTs + ONE_YEAR * 5);
  return occurrences.find((t) => t > fromTs) ?? null;
};

// Last review date strictly before the given timestamp (null if none)
export const getPrevReviewDate = (
  review: Partial<InvoiceReview> | undefined,
  beforeTs: number
): number | null => {
  const occurrences = getReviewOccurrences(
    review,
    beforeTs - ONE_YEAR * 5,
    beforeTs
  ).filter((t) => t < beforeTs);
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
