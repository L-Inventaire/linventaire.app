import { getInvoiceMaps } from "@/features/invoices/hooks/use-invoice-maps";
import {
  Invoices,
  InvoicesState,
  InvoicesType,
} from "@features/invoices/types/types";
import i18next from "@features/utils/i18n";
import { computePaymentDelayDate } from "@shared/invoices";
import { DateTime } from "luxon";

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

export const computePricesFromInvoice = (
  invoice: Pick<Invoices, "content" | "discount">,
  vatValues?: Record<string, number>,
): Invoices["total"] => {
  let initial = 0;
  let discount = 0;
  let taxes = 0;

  (invoice.content || []).forEach((item) => {
    const itemsPrice =
      (parseFloat(item.unit_price as any) || 0) *
      (parseFloat(item.quantity as any) || 0);
    let itemsDiscount = 0;
    if (item.discount?.mode === "percentage") {
      itemsDiscount =
        itemsPrice * (parseFloat(item.discount.value as any) / 100);
    } else if (item.discount?.mode === "amount") {
      itemsDiscount = parseFloat(item.discount.value as any);
    }
    initial += itemsPrice;
    discount += itemsDiscount;
    taxes += (itemsPrice - itemsDiscount) * getTvaValue(item.tva || "");
  });

  if (invoice.discount?.mode === "percentage") {
    discount +=
      (initial - discount) * (parseFloat(invoice.discount.value as any) / 100);
  } else if (invoice.discount?.mode === "amount") {
    discount += parseFloat(invoice.discount.value as any);
  }
  const total = initial - discount;
  const total_with_taxes = total + taxes;

  return {
    initial,
    discount,
    total,
    taxes,
    total_with_taxes,
  };
};

export const computeDeliveryDelayDate = (invoice: Invoices): DateTime => {
  const delayType = invoice?.delivery_date
    ? "delivery_date"
    : invoice?.delivery_delay
      ? "delivery_delay"
      : "no_delivery";

  let date = DateTime.fromMillis(
    new Date(invoice.wait_for_completion_since ?? Date.now()).getTime(),
  );

  if (delayType === "delivery_date") {
    date = DateTime.fromMillis(
      new Date(invoice.delivery_date ?? Date.now()).getTime(),
    );
  }
  if (delayType === "delivery_delay") {
    let delay = 30;
    try {
      delay = parseInt(invoice.delivery_delay as any);
      if (isNaN(delay)) delay = 30;
    } catch (e: any) {
      console.error(e);
      delay = 30;
    }
    date = date.plus({ days: delay });
  }

  return date;
};

export const isDeliveryLate = (invoice: Invoices): boolean => {
  return DateTime.now() > computeDeliveryDelayDate(invoice);
};

export const isPaymentLate = (invoice: Invoices): boolean => {
  return DateTime.now() > computePaymentDelayDate(invoice);
};

export const isComplete = (invoice: Invoices): boolean => {
  return !invoice.content?.some(
    (item) => (item.quantity_delivered || 0) > (item.quantity || 0),
  );
};
