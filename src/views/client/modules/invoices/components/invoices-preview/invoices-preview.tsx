import { Invoices } from "@features/invoices/types/types";
import { InvoicesApiClient } from "@features/invoices/api-client/invoices-api-client";

export const getPdfPreview = (document: Invoices) => {
  window.open(InvoicesApiClient.getPdfRoute(document), "_blank");
};
