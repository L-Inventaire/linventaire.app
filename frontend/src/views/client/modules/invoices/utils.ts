import { getInvoiceMaps } from "@/features/invoices/hooks/use-invoice-maps";
import { InvoicesState, InvoicesType } from "@features/invoices/types/types";
import i18next from "@features/utils/i18n";

export const getTvaValue = (tva: string): number => {
  tva = tva || "";

  const vatValues = getInvoiceMaps()?.vat_values;

  // Try to use server-provided VAT values first
  if (vatValues && tva in vatValues) {
    return vatValues[tva] / 100;
  }

  // Fall back to parsing the string
  if (tva.match(/^[0-9.]+.*/)) {
    return parseFloat(tva) / 100;
  }
  return 0;
};

export const getInvoiceStatusPrettyName = (
  status: InvoicesState,
  type: InvoicesType,
) => {
  const prefix = "invoices.states";
  return i18next.t([
    prefix + "." + status + "." + type,
    prefix + "." + status + ".default",
  ]);
};

export const getInvoicesStatusColor = (
  state: InvoicesState,
  type: InvoicesType,
) => {
  const colors = {
    draft: "gray",
    sent:
      type === "quotes" || type === "invoices" || type === "credit_notes"
        ? "blue"
        : "red",
    accounted: "blue",
    purchase_order: "orange",
    partial_paid: "orange",
    paid: "green",
    closed: "gray",
    completed: "green",
    signed: "green",
    recurring: "blue",
  };

  return colors[state];
};
