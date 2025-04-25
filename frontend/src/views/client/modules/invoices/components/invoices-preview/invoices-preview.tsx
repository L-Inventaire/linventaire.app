import { InvoiceLine, Invoices } from "@features/invoices/types/types";
import { InvoicesApiClient } from "@features/invoices/api-client/invoices-api-client";

export const getPdfPreview = (
  document: Invoices,
  options?: {
    checked?: (InvoiceLine & { _index?: number })[];
    as?: "delivery_slip" | "proforma" | "receipt_acknowledgement" | "";
    content?: { _index: number; quantity: number }[];
  }
) => {
  window.open(InvoicesApiClient.getPdfRoute(document, options), "_blank");
};
