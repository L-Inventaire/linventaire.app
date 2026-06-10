import { Clients } from "@features/clients/types/clients";
import { Contacts } from "@features/contacts/types/types";
import { InvoiceFormat, Invoices, InvoiceSubscription } from "./types/types";

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
