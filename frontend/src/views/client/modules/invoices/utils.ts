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
  return i18next.t([
    prefix + "." + status + "." + type,
    prefix + "." + status + ".default",
  ]);
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
  invoice: Pick<Invoices, "content" | "discount">
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
    new Date(invoice.wait_for_completion_since ?? Date.now()).getTime()
  );

  if (delayType === "delivery_date") {
    date = DateTime.fromMillis(
      new Date(invoice.delivery_date ?? Date.now()).getTime()
    );
  }
  if (delayType === "delivery_delay") {
    let delay = 30;
    try {
      delay = parseInt(invoice.delivery_delay as any);
      if (isNaN(delay)) delay = 30;
    } catch (e) {
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

/** WARNING This same code exists in backend, please update both */
export const computePaymentDelayDate = (invoice: Invoices): DateTime => {
  const payment = invoice.payment_information;
  const delayType = payment?.delay_type ?? "direct";
  let date = DateTime.fromMillis(
    new Date(
      (invoice.type === "quotes"
        ? invoice.wait_for_completion_since
        : invoice.emit_date) || Date.now()
    ).getTime()
  );

  let delay = 30;
  try {
    delay = parseInt(payment.delay as any);
    if (isNaN(delay)) delay = 30;
  } catch (e) {
    console.error(e);
    delay = 30;
  }

  if (delayType === "direct") {
    date = date.plus({ days: delay });
  }
  if (delayType === "month_end_delay_first") {
    date = date.plus({ days: delay });
    date = date.endOf("month");
  }
  if (delayType === "month_end_delay_last") {
    date = date.endOf("month");
    date = date.plus({ days: delay });
  }
  if (delayType === "date") {
    date = DateTime.fromMillis(
      new Date(payment.delay_date || Date.now()).getTime()
    );
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
