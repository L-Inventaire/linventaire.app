import {
  Invoices,
  InvoicesState,
  InvoicesType,
} from "@features/invoices/types/types";
import i18next from "@features/utils/i18n";
import { DateTime } from "luxon";

export const getTvaValue = (tva: string): number => {
  tva = tva || "";
  if (tva.match(/^[0-9.]+.*/)) {
    return parseFloat(tva) / 100;
  }
  return 0;
};

export const getInvoiceStatusPrettyName = (
  status: InvoicesState,
  type: InvoicesType
) => {
  const prefix = "invoices.states";

  const statusTranslationCode = {
    draft: "draft",
    sent:
      type === "quotes"
        ? "sent.quotes"
        : type === "invoices"
        ? "sent.invoices"
        : type === "credit_notes"
        ? "sent.invoices"
        : type === "supplier_quotes"
        ? "sent.quotes"
        : type === "supplier_invoices"
        ? "sent.supplier_invoices"
        : type === "supplier_credit_notes"
        ? "sent.supplier_credit_notes"
        : "sent.default",
    accounted: "accounted",
    purchase_order:
      type === "quotes"
        ? "purchase_order.quotes"
        : "purchase_order.supplier_quotes",
    partial_paid: "payment.partial_paid",
    paid: "payment.paid",
    closed: "closed",
    completed:
      type === "supplier_quotes"
        ? "completed.supplier_quotes"
        : "completed.default",
    recurring: "recurring",
  };

  return i18next.t(prefix + "." + statusTranslationCode[status]);
};

export const getInvoicesStatusColor = (
  state: InvoicesState,
  type: InvoicesType
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
  invoice: Invoices
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
    invoice.wait_for_completion_since ?? Date.now()
  );

  if (delayType === "delivery_date") {
    date = DateTime.fromMillis(invoice.delivery_date ?? Date.now());
  }
  if (delayType === "delivery_delay") {
    date = date.plus({ days: invoice.delivery_delay });
  }

  return date;
};

export const isDeliveryLate = (invoice: Invoices): boolean => {
  return DateTime.now() > computeDeliveryDelayDate(invoice);
};

export const computePaymentDelayDate = (invoice: Invoices): DateTime => {
  const payment = invoice.payment_information;
  const delayType = payment?.delay_type ?? "direct";
  let date = DateTime.fromMillis(
    invoice.wait_for_completion_since ?? Date.now()
  );

  if (delayType === "direct") {
    date = date.plus({ days: payment.delay });
  }
  if (delayType === "month_end_delay_first") {
    date = date.plus({ days: payment.delay });
    date = date.endOf("month");
  }
  if (delayType === "month_end_delay_last") {
    date = date.endOf("month");
    date = date.plus({ days: payment.delay });
  }

  return date;
};

export const isPaymentLate = (invoice: Invoices): boolean => {
  return DateTime.now() > computePaymentDelayDate(invoice);
};

export const isComplete = (invoice: Invoices): boolean => {
  return !invoice.content?.some(
    (item) => (item.quantity_delivered || 0) > (item.quantity || 0)
  );
};
